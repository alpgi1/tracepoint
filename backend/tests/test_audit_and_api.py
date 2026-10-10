from __future__ import annotations

import csv
import io
import json

from fastapi.testclient import TestClient
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


def test_baseline_report(engine, ingested):
    with Session(engine) as session:
        rep = build_baseline(session, "F70", "EU")
        assert rep["coverage"]["verbatims"] > 1400
        assert rep["top_complaint_themes"][0]["quotes"]
        md = render_markdown(rep)
        assert md.startswith("# Baseline situation analysis") and "Top complaint themes" in md
