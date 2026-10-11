"""The CPM subsystem view: parity with the frontend content, attribution, endpoints."""

from __future__ import annotations

import json

import yaml
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.agent.tools import call_tool
from tracepoint.api import app as api_module
from tracepoint.core.settings import REPO_ROOT
from tracepoint.db.models import TaxonomyLevel2
from tracepoint.effort.subsystems import (
    load_market_rows,
    load_theme_map,
    model_catalogue,
    subsystem_view,
    subsystems_of_refs,
)

CONTENT = json.loads((REPO_ROOT / "frontend/content/cpm.json").read_text(encoding="utf-8"))


def _as_content(view: dict) -> dict:
    """A backend view without the fields it adds to the contract (ids of market rows, country)."""
    view = json.loads(json.dumps(view))
    view.pop("country")
    for sub in view["subsystems"]:
        for row in sub["market"]:
            for key in ("id", "evidence_ref", "market", "subsystem"):
                row.pop(key)
    return view


def test_every_canonical_theme_is_mapped_once(session):
    themes, unassigned = load_theme_map()
    canonical = {t.name for t in session.scalars(select(TaxonomyLevel2)) if t.status == "canonical"}
    assert set(themes) | set(unassigned) == canonical
    assert len(themes) + len(unassigned) == len(canonical) == 225


def test_view_equals_the_frontend_content(session):
    """D-075: `GET /cpm/{vehicle}` and frontend/content/cpm.json are the same object: counts,
    renormalised weights, absent subsystems, the derived narration, themes, quotes and market
    rows. The assistant's gap labels, which other tests import, are not part of this basis."""
    for name in ("G60_US", "F70_EU", "G60_EU", "G68_CN"):
        want = dict(CONTENT["views"][name])
        vehicle, market = name.split("_")
        got = _as_content(subsystem_view(session, vehicle, market, labels="given"))
        # the content names the workbook as its source, the backend names its counting basis
        want.pop("rowsSource"), got.pop("rowsSource")
        assert got == want, name
    f70 = subsystem_view(session, "F70", "EU")
    assert [a["key"] for a in f70["absent"]] == ["hv_battery", "charging"]
    assert len(f70["subsystems"]) == 10
    assert round(sum(s["weight"] for s in f70["subsystems"])) == 100


def test_catalogue_equals_the_frontend_content():
    cat = model_catalogue()
    for key in ("method", "subsystems", "mapping", "marketContextSource", "narrationSource"):
        assert cat[key] == CONTENT[key], key
    assert cat["vehicles"]["F70"]["absent"] == ["hv_battery", "charging"]


def test_scopes_and_counting_bases(session):
    given = subsystem_view(session, "G60", "US", labels="given")
    one = subsystem_view(session, "G60", "US", labels="given", subsystem="seats")
    assert one["rows"] == given["rows"]
    assert all(
        bool(t["quotes"]) == (s["key"] == "seats")
        for s in one["subsystems"]
        for t in s["criticised"]["themes"]
    )
    canada = subsystem_view(session, "G60", "US", "CA")
    assert 0 < canada["rows"] < given["rows"] and canada["country"] == "CA"
    assert subsystem_view(session, "G60", "US", labels="all")["rows"] >= given["rows"]


def test_market_rows_and_reference_attribution(session):
    rows = load_market_rows()
    assert [r["id"] for r in rows][:3] == [
        "MKT-EU-powertrain-1",
        "MKT-CN-powertrain-1",
        "MKT-US-powertrain-1",
    ]
    fridge = next(r for r in rows if r["subsystem"] == "interior_console")
    assert fridge["level"] == "medium" and set(fridge["contradiction"]) == {"for", "against"}
    assert [r["market"] for r in load_market_rows("US")] == ["US"]
    raw = yaml.safe_load((REPO_ROOT / "config/cpm/market_context.yaml").read_text())["rows"]
    assert len(rows) == len(raw)
    view = subsystem_view(session, "G60", "US", subsystem="seats")
    seats = next(s for s in view["subsystems"] if s["key"] == "seats")
    ref = seats["criticised"]["themes"][0]["quotes"][0]["evidenceRef"]
    hits = subsystems_of_refs(session, [ref, "market:MKT-US-powertrain-1", "metric:none"])
    assert hits["seats"] == 1 and hits["powertrain"] == 1


def test_subsystem_tool(engine, ingested):
    with Session(engine) as session:
        overview = call_tool(session, "get_subsystems", {"vehicle": "F70", "market": "EU"})
        seats = call_tool(
            session, "get_subsystems", {"vehicle": "F70", "market": "EU", "subsystem": "seats"}
        )
        absent = call_tool(
            session, "get_subsystems", {"vehicle": "F70", "market": "EU", "subsystem": "charging"}
        )
        session.rollback()
    assert overview["total"] == 10 and overview["not_on_this_vehicle"][0]["key"] == "hv_battery"
    assert overview["market_evidence"][0]["evidence_ref"] == "market:MKT-EU-powertrain-1"
    assert seats["items"][0]["criticised"][0]["quotes"][0]["evidenceRef"].startswith("verbatim:")
    assert "has no charging subsystem" in absent["error"]


def test_cpm_and_effort_endpoints(engine, ingested):
    api_module._engine = engine
    client = TestClient(api_module.app)
    model = client.get("/effort/model").json()
    assert len(model["subsystems"]) == 12 and sum(s["weight"] for s in model["subsystems"]) == 100
    assert model["method"]["thresholds"]["adaptBelowPercent"] == 15
    view = client.get("/cpm/G60", params={"market": "US"}).json()
    assert view["rows"] == CONTENT["views"]["G60_US"]["rows"] and len(view["subsystems"]) == 12
    assert view["subsystems"][2]["market"][0]["evidence_ref"] == "market:MKT-US-powertrain-1"
    assert view["subsystems"][0]["liked"]["narration"]["basis"] == "derived"
    assert client.get("/cpm/X99", params={"market": "US"}).status_code == 422
    assert model["modelHash"]
    seats = {"subsystem": "seats", "own_impact": 0.3}
    hmi = {"subsystem": "software_hmi", "own_impact": 0.2, "layer": "K1"}
    est = client.post("/effort/estimate", json={"vehicle": "G60", "changes": [seats, hmi]}).json()
    one, combined = est["items"][0], est["combined"]
    assert one["decision"] == "adapt" and one["p5"] < one["effort_pct"] < one["p95"]
    assert one["changes"][0]["layer"] == "K2" and est["basis"].startswith("assumption")
    # the seat change also reaches other subsystems through the links
    assert {"seats", "software_hmi"} <= {s["subsystem"] for s in one["subsystems"]}
    # shared work counts once: the combination is less than the sum of the two
    assert combined["effort_pct"] < est["sum_of_single_pct"] and est["model_hash"]
    battery = {"subsystem": "hv_battery", "own_impact": 0.3}
    refused = client.post("/effort/estimate", json={"vehicle": "F70", "changes": [battery]})
    assert refused.status_code == 422 and "not present on F70" in refused.text
    assert client.post("/effort/estimate", json={"vehicle": "G60"}).status_code == 422
    foreign = {"vehicle": "G70", "market": "US", "requirement_ids": ["REQ-G60-US-IC-01"]}
    assert client.post("/effort/estimate", json=foreign).status_code == 422
    assert client.get("/requirements/REQ-NONE/effort").status_code == 404
