from __future__ import annotations

import csv
import io
import json

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from tracepoint.api import app as api_module
from tracepoint.core.audit import export_events, record_event
from tracepoint.reports.baseline import build_baseline, render_markdown


def test_audit_round_trip(engine, ingested):
    with Session(engine) as session:
        ev = record_event(
            session,
            actor_type="human",
            actor_id="pm",
            action="test.touch",
            entity_type="requirement",
            entity_id="REQ-TEST-0001",
            before={"status": "proposed"},
            after={"status": "approved"},
            rationale="unit test",
        )
        session.commit()
        payload = json.loads(export_events(session, "json", entity_id="REQ-TEST-0001"))
        assert (
            payload and payload[-1]["id"] == ev.id and payload[-1]["after"]["status"] == "approved"
        )
        rows = list(
            csv.DictReader(io.StringIO(export_events(session, "csv", entity_id="REQ-TEST-0001")))
        )
        assert (
            rows[-1]["action"] == "test.touch"
            and json.loads(rows[-1]["before"])["status"] == "proposed"
        )


def test_api_endpoints(engine, ingested):
    api_module._engine = engine
    client = TestClient(api_module.app)
    assert client.get("/health").json()["status"] == "ok"
    vehicles = client.get("/vehicles").json()
    assert {v["code"] for v in vehicles} >= {"F70", "G60", "G70"}
    res = client.get(
        "/verbatims",
        params={"vehicle": "G60", "powertrain": "BEV", "feedback_type": "Wants", "limit": 5},
    ).json()
    assert res["total"] > 0 and len(res["items"]) == 5
    item = res["items"][0]
    assert item["locator"]["row"] >= 2 and item["evidence_ref"].startswith("verbatim:")
    one = client.get(f"/verbatims/{item['id']}").json()
    assert one["id"] == item["id"]
    eq = client.get("/equipment", params={"vehicle": "F70", "q": "Lenkradheizung"}).json()
    assert any(e["sa_code"] == "248" for e in eq)
    ev = client.get("/events", params={"action": "verbatims.ingested"}).json()
    assert ev["total"] >= 3
    rep = client.get("/reports/baseline/G60", params={"market": "US"}).json()
    assert rep["coverage"]["verbatims"] > 3000 and rep["domains"]
    # a scope that does not resolve is refused before any model call
    bad = client.post("/agent/analyze", json={"vehicle": "F70", "market": "US", "country": "GB"})
    assert bad.status_code == 422 and "belongs to market EU" in bad.json()["detail"]
    # while one analysis holds the lock, a second request is turned away before any model call
    with engine.connect() as other:
        key = func.hashtext(api_module.ANALYSIS_LOCK)
        other.execute(select(func.pg_advisory_lock(key)))
        busy = client.post("/agent/analyze", json={"vehicle": "G60", "market": "US"})
        other.execute(select(func.pg_advisory_unlock(key)))
    assert busy.status_code == 429


def test_baseline_report(engine, ingested):
    with Session(engine) as session:
        rep = build_baseline(session, "F70", "EU")
        assert rep["coverage"]["verbatims"] > 1400
        assert rep["top_complaint_themes"][0]["quotes"]
        md = render_markdown(rep)
        assert md.startswith("# Baseline situation analysis") and "Top complaint themes" in md


def test_write_endpoints_reject_spoofing_and_form_posts(engine, ingested, monkeypatch, tmp_path):
    from tracepoint.requirements import store

    api_module._engine = engine
    client = TestClient(api_module.app)
    # a cross-site form or text/plain post is not parsed as JSON
    r = client.post(
        "/requirements/REQ-X/decision",
        content='{"decision": "approve", "note": "ok ok"}',
        headers={"content-type": "text/plain"},
    )
    assert r.status_code == 422
    assert (
        client.post("/requirements/REQ-X/decision", json={"decision": "approve"}).status_code == 422
    )
    # tool calls may only be attributed to agents
    r = client.post("/agent/tools/get_sales", params={"actor": "human:pm"}, json={"vehicle": "G60"})
    assert r.status_code == 422
    monkeypatch.setattr(store, "decisions_file", lambda: tmp_path / "d.jsonl")
    r = client.post("/requirements/REQ-X/decision", json={"decision": "approve", "note": "ok ok"})
    assert r.status_code == 422 and "unknown" in r.text  # valid request, unknown requirement
