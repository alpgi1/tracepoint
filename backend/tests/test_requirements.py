from __future__ import annotations

import pytest
import yaml
from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.core.runs import start_run
from tracepoint.db.models import AuditEvent, Finding, Requirement
from tracepoint.findings.extract import extract_findings
from tracepoint.requirements.report import list_requirements, render_csv, render_markdown
from tracepoint.requirements.store import decide, import_requirement_file


def _spec(finding_ids: list[str], title: str = "Seats comfortable on long drives") -> dict:
    return {
        "vehicle": "G60",
        "market": "US",
        "author": "agent:test",
        "requirements": [
            {
                "id": "REQ-G60-US-IC-99",
                "domain": "interior_comfort",
                "title": title,
                "statement": "Test statement.",
                "recommend": True,
                "recommend_rationale": "Test rationale.",
                "horizon": "H1",
                "horizon_rationale": "Software.",
                "markets": ["US"],
                "findings": [{"id": finding_ids[0]}, {"id": finding_ids[1], "role": "supporting"}],
                "criteria": [
                    {
                        "market": "US",
                        "metric": "m",
                        "target": "t",
                        "method": "x",
                        "basis": "assumption",
                    }
                ],
            }
        ],
        "excluded": [{"finding": finding_ids[2], "reason": "test"}],
    }


def test_import_decide_version_and_replay(engine, ingested, tmp_path):
    from tracepoint.requirements.store import replay_decisions

    decisions = tmp_path / "decisions.jsonl"
    path = tmp_path / "G60_US.yaml"
    with Session(engine) as session:
        with start_run(session, "test.findings") as run:
            extract_findings(session, run, "G60", "US")
        ids = session.scalars(
            select(Finding.id)
            .where(Finding.vehicle_code == "G60", Finding.market_code == "US")
            .order_by(Finding.evidence_level, Finding.id)
            .limit(3)
        ).all()
        path.write_text(yaml.safe_dump(_spec(list(ids))))
        with start_run(session, "test.req") as run:
            assert import_requirement_file(session, run, path)["created"] == 1
            assert import_requirement_file(session, run, path)["unchanged"] == 1
        req = session.get(Requirement, "REQ-G60-US-IC-99")
        assert req.evidence_level == session.get(Finding, ids[0]).evidence_level

        decide(session, req.id, "approve", actor="human:pm", note="ok", path=decisions)
        assert req.status == "approved" and decisions.read_text().count("\n") == 1
        with pytest.raises(ValueError):
            decide(session, req.id, "approve", actor="human:pm", note=" ", path=decisions)

        # a rebuilt database gets the decision back from the file ...
        req.status = "proposed"
        with start_run(session, "test.req") as run:
            assert replay_decisions(session, run, decisions) == {"applied": 1}
        assert req.status == "approved"
        # ... but a changed requirement needs a new decision
        path.write_text(yaml.safe_dump(_spec(list(ids), title="Changed title")))
        with start_run(session, "test.req") as run:
            assert import_requirement_file(session, run, path)["updated"] == 1
            assert replay_decisions(session, run, decisions) == {"stale": 1}
        assert (req.status, req.version) == ("proposed", 2)
        actions = session.scalars(
            select(AuditEvent.action).where(AuditEvent.entity_id == req.id).order_by(AuditEvent.id)
        ).all()
        assert actions == [
            "requirement.created",
            "requirement.decided",
            "requirement.decided",
            "requirement.updated",
        ]

        rows = list_requirements(session, "G60", "US")
        assert rows[0]["findings"] and "REQ-G60-US-IC-99" in render_markdown(rows, "x")
        assert render_csv(rows).startswith("id,vehicle")
        session.rollback()


def test_import_rejects_unknown_findings_and_bad_ids(engine, ingested, tmp_path):
    spec = _spec(["FND-DOES-NOT-EXIST", "FND-X", "FND-Y"])
    spec["requirements"][0]["id"] = "REQ-G70-US-IC-01"
    path = tmp_path / "bad.yaml"
    path.write_text(yaml.safe_dump(spec))
    with Session(engine) as session, start_run(session, "test.req") as run:
        with pytest.raises(ValueError, match="unknown finding FND-DOES-NOT-EXIST"):
            import_requirement_file(session, run, path)
        with pytest.raises(ValueError, match="must start with REQ-G60-US-"):
            import_requirement_file(session, run, path)
