"""What the product manager reads (D-100 to D-102): the vocabulary, the briefs of the stored
analyses, the overview of the markets, the external evidence and the read endpoints the screens
use."""

from __future__ import annotations

import json
import re

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from tracepoint.api import app as api_module
from tracepoint.briefs import labels, store
from tracepoint.briefs.external import external_view
from tracepoint.briefs.refs import describe, split
from tracepoint.briefs.text import plain
from tracepoint.briefs.views import brief
from tracepoint.core.runs import start_run
from tracepoint.core.settings import REPO_ROOT
from tracepoint.reports.overview import build_overview

COMMITTED = REPO_ROOT / "reports" / "analysis"
CODE_KEYS = re.compile(
    r"\b(?:software_hmi|interior_console|thermal_hvac|ee_architecture|body_structure|hv_battery"
    r"|exterior_design|paint_color|infotainment_digital|own_impact|effort_changes)\b"
)
DASHES = re.compile("[–—]")


@pytest.fixture(scope="module", autouse=True)
def prepared(engine, ingested):
    """What `start.sh` runs after the ingestion, so that every reference of the committed
    analyses can be read back: gap labels, findings, requirements with effort, external rows.
    The test database lives for the whole session and pytest collects modules by name, so this
    module comes after the ones that count what the pipeline creates (test_effort,
    test_ingestion, test_classify_and_findings), as test_series does."""
    from tracepoint.classify.gap import import_gap_file
    from tracepoint.effort.store import estimate_all
    from tracepoint.findings.extract import extract_findings
    from tracepoint.ingest.external import ingest_external
    from tracepoint.requirements.store import import_all

    with Session(engine) as session:
        with start_run(session, "test.briefs.prepare") as run:
            for code in ("F70", "G60", "G70"):
                import_gap_file(session, run, code)
            for vehicle, market in (
                ("G60", "US"),
                ("G60", "EU"),
                ("G68", "CN"),
                ("F70", "EU"),
                ("G70", "US"),
            ):
                extract_findings(session, run, vehicle, market)
            import_all(session, run)
            estimate_all(session, run, runs=200)
            ingest_external(session, run)
        session.commit()


@pytest.fixture
def committed_only(monkeypatch):
    """The analyses filed with the repository, whatever runs this machine holds."""
    monkeypatch.setattr(store, "folders", lambda: [(COMMITTED, "committed with the repository")])


def test_plain_words_for_codes():
    assert plain("driven mainly by software_hmi 0.1 K2 plus interior_console 0.1 K2.") == (
        "driven mainly by Software/HMI (own impact 0.1, module change) plus Interior/console "
        "(own impact 0.1, module change)."
    )
    assert plain("starting in seats at own_impact 0.25 K1.") == (
        "starting in seats (own impact 0.25, add-on)."
    )
    assert plain("starting in hv_battery at K3.") == "starting in HV battery as a platform change."
    assert plain("A K2 change (K1) in infotainment_digital.") == (
        "A module change (K2) (K1, add-on) in Infotainment & Digital Services."
    )
    # evidence references leave the sentence, requirement ids stay; dashes become words
    assert plain("Seats lead (FND-G60-US-VOC-seat) [verbatim:G60-0248, metric:MET-X] here.") == (
        "Seats lead here."
    )
    assert plain("See REQ-G60-US-IC-01, range 1.47–5.48 — rough.") == (
        "See REQ-G60-US-IC-01, range 1.47 to 5.48, rough."
    )
    assert plain("Owners report seamless Tesla charging; Seamlessly done.") == (
        "Owners report trouble-free Tesla charging; Without trouble done."
    )
    # the customer texts are customer comments on screen (D-105); a reference to one still leaves
    assert plain("Verbatims point to firmness; 41.4 per 100 verbatims (verbatim:G60-1) here.") == (
        "Customer comments point to firmness; 41.4 per 100 customer comments here."
    )
    assert plain("Some verbatim rows; no customer verbatims.") == (
        "Some customer comment rows; no customer comments."
    )
    assert plain(None) is None


def test_vocabulary_is_complete_and_free_of_dashes():
    g = labels.glossary()
    assert set(g["seriesDecisions"]) == {
        "change_now_all_markets",
        "change_now_regional",
        "next_generation",
        "keep",
        "no_action",
    }
    assert set(g["effortDecisions"]) == {"no change", "adapt", "major revision", "new generation"}
    assert g["effortDecisions"]["adapt"].startswith("Adaptation, below 15 %")
    assert g["sizes"]["XS"] == "below 1 %" and g["sizes"]["XL"] == "50 % or more"
    assert set(g["layers"]) == {"K0", "K1", "K2", "K3"}
    assert len(g["subsystems"]) == 12 and g["subsystems"]["software_hmi"] == "Software/HMI"
    assert set(g["verified"]) == {"confirmed", "computed"}
    assert not DASHES.search(json.dumps(g, ensure_ascii=False))


def test_index_of_the_stored_analyses(committed_only):
    keys = {i["key"]: i for i in store.index()}
    assert set(keys) == {"F70_GB", "G60_US", "G68_CN", "G60_regions"}
    assert keys["G60_regions"]["kind"] == "series"
    assert [(s["vehicle"], s["market"]) for s in keys["G60_regions"]["scopes"]] == [
        ("G60", "EU"),
        ("G60", "US"),
        ("G68", "CN"),
    ]
    assert keys["F70_GB"]["country"] == "GB" and keys["F70_GB"]["market"] == "EU"
    assert keys["G60_US"]["ranAt"] == "2026-10-11T03:55:57+00:00"
    assert [i["key"] for i in store.index("G60", "EU")] == ["G60_regions"]
    assert [i["key"] for i in store.index("G68", "CN")] == ["G68_CN", "G60_regions"]
    assert store.index("G70", "US") == []
    assert store.load("G99_XX") is None and store.load("../etc") is None


def test_situation_brief(session, committed_only):
    raw = json.loads((COMMITTED / "G60_US.json").read_text(encoding="utf-8"))
    b = brief(session, "G60_US")
    assert b["kind"] == "situation" and b["title"] == raw["scope"]
    groups = {g["group"]: g["proposals"] for g in b["proposalGroups"]}
    assert groups == {"now": [1, 2, 3, 4, 5, 7], "next": [6], "keep": [8]}
    # the engine's figures as the run stored them, with their words
    for p, e in zip(b["proposals"], raw["effort"]["recommendations"], strict=True):
        assert p["effort"]["status"] == e["status"]
        if e["status"] == "estimated":
            assert (p["effort"]["effortPct"], p["effort"]["decision"]) == (
                e["effort_pct"],
                e["decision"],
            )
            assert p["effort"]["decisionLabel"].split(",")[0] in {
                "Adaptation",
                "Major revision",
                "New generation",
            }
    assert [p["horizon"] for p in b["packages"]] == ["H1", "H2"]
    assert b["packages"][0]["effortPct"] == raw["effort"]["packages"][0]["effort_pct"]
    # every reference is read back from the store, none dropped
    refs = {r for p in raw["analysis"]["recommendations"] for r in p["evidence_refs"]}
    items = [i for p in b["proposals"] for i in p["evidence"]["items"]]
    assert {i["ref"] for i in items} == refs
    assert all(i["kind"] != "unknown" for i in items)
    verbatim = next(i for i in items if i["kind"] == "verbatim")
    assert verbatim["text"] and verbatim["label"].startswith("Customer comment ")
    # the groups of what customers say cover every insight once
    assert sum(len(g["items"]) for g in b["customers"]) == len(raw["analysis"]["insights"])
    assert b["customers"][-1]["group"] == "strengths"
    texts = [p["why"] for p in b["proposals"]] + [p["proposal"] for p in b["proposals"]]
    assert not any(CODE_KEYS.search(t) for t in texts)


def test_series_brief(session, committed_only):
    b = brief(session, "G60_regions")
    assert b["kind"] == "series" and [r["label"] for r in b["regions"]] == ["EU", "US", "CN"]
    decisions = {d["decision"]: d["topics"] for d in b["decisions"]}
    assert decisions == {
        "change_now_all_markets": [1, 4],
        "change_now_regional": [2, 5, 6, 7, 8],
        "next_generation": [3],
        "no_action": [9, 10],
    }
    first = b["topics"][0]
    assert first["everywhere"] and first["decisionLabel"] == "Change now, all markets"
    assert first["effort"]["effortPct"] == 3.05 and first["evidence"]["byRegion"]["EU"] == 7
    assert [r["region"] for r in b["optimum"]["regional"]] == ["EU", "US", "CN"]
    h1 = b["packages"][0]
    assert h1["borderline"] and h1["checks"][0]["ruleLabel"] == "borderline estimate"
    assert b["regions"][2]["vehicle"] == "G68" and b["regions"][2]["verbatims"] == 0


def test_unknown_references_are_named_not_dropped(session):
    out = describe(session, ["verbatim:NOPE-1", "FND-NOPE", "weird"])
    assert {r["kind"] for r in out.values()} == {"unknown"}
    assert out["weird"]["meta"] == "not in the evidence store"
    assert split("vclass:G60-0876#1") == ("verbatim", "G60-0876")
    assert split("REQ-G60-US-IC-01") == ("requirement", "REQ-G60-US-IC-01")


def test_overview_equals_the_frontend_content(session):
    """D-101: the landing page's content is what `GET /overview` serves, written by the
    frontend's snapshot; a fresh ingest gives the same figures."""
    content = json.loads((REPO_ROOT / "frontend/content/markets.json").read_text("utf-8"))
    got = build_overview(session)
    got.pop("generatedAt"), content.pop("generatedAt")
    assert got == content
    eu = next(m for m in got["markets"] if m["code"] == "EU")
    assert [v["code"] for v in eu["vehicles"]] == ["F70", "G60", "G70"]
    cn = next(m for m in got["markets"] if m["code"] == "CN")
    assert [v["code"] for v in cn["vehicles"]] == ["G68", "G70"]
    assert cn["verbatims"]["count"] == 0 and cn["study"]["vehicles"] == ["G68", "G70"]


def test_external_view_in_words(session):
    x = external_view(session, "CN", "G68")
    assert x["total"] == len(x["items"]) > 0 and x["verified"] <= x["total"]
    row = x["items"][0]
    assert row["aboutVehicle"]  # rows about the vehicle come first
    assert row["verificationLabel"] and row["levelLabel"] and row["kindLabel"]
    assert all(
        r["source"]["url"] is None or r["source"]["url"].startswith("http") for r in x["items"]
    )
    only = external_view(session, "CN", "G68", verified_only=True)
    assert only["total"] == x["verified"] and all(r["verified"] for r in only["items"])
    seats = external_view(session, "US", "G60", subsystem="seats")
    assert seats["items"] and all("seats" in r["subsystems"] for r in seats["items"])


def test_read_endpoints_of_the_screens(engine, committed_only):
    api_module._engine = engine
    client = TestClient(api_module.app)
    assert client.get("/glossary").json()["flagRules"]["51"] == "borderline estimate"
    assert [m["code"] for m in client.get("/overview").json()["markets"]] == ["CN", "US", "EU"]
    listed = client.get("/analyses", params={"vehicle": "G68", "market": "CN"}).json()
    assert [i["key"] for i in listed] == ["G68_CN", "G60_regions"]
    assert client.get("/analyses", params={"kind": "series"}).json()[0]["key"] == "G60_regions"
    assert client.get("/analyses/G60_US").json()["run_id"].startswith("RUN-")
    assert client.get("/analyses/G60_regions/brief").json()["kind"] == "series"
    assert client.get("/analyses/G99_XX").status_code == 404
    assert client.get("/analyses/g60_us").status_code == 422
    ext = client.get(
        "/external", params={"market": "CN", "vehicle": "G68", "subsystem": "charging"}
    )
    assert ext.status_code == 200 and all(
        "charging" in r["subsystems"] for r in ext.json()["items"]
    )
    assert client.get("/external", params={"market": "XX"}).status_code == 422
    # one scope's events in one call, the prefix taken literally
    scoped = client.get("/events", params={"entity_prefix": "REQ-G60-US-", "limit": 5000}).json()
    assert scoped["total"] > 0
    assert all(e["entity_id"].startswith("REQ-G60-US-") for e in scoped["items"])
    assert client.get("/events", params={"entity_prefix": "REQ-%"}).status_code == 422
    # the D2 exporter, not shadowed by the detail route
    csv = client.get("/requirements/export", params={"vehicle": "G60", "market": "US"})
    assert csv.headers["content-type"].startswith("text/csv")
    assert csv.text.splitlines()[0].startswith("id,vehicle,market,domain,title")
    md = client.get(
        "/requirements/export", params={"vehicle": "G60", "market": "US", "format": "md"}
    )
    assert md.headers["content-type"].startswith("text/markdown")
    assert md.text.startswith("# Requirement list, G60 US")
    params = client.get("/effort/model").json()["parameters"]
    assert params["carryoverFactor"] == 0.3 and params["platformRule"]["minOwnImpact"] == 0.8


def test_export_carries_effort_and_the_latest_decision(engine, monkeypatch, tmp_path):
    """The D2 list the workspace downloads is the exporter's, with each requirement's effort and
    its latest gate G2 decision (rolled back, so no other test sees the decision)."""
    from tracepoint.requirements import store as requirements
    from tracepoint.requirements.report import export_rows, render_csv, render_markdown

    monkeypatch.setattr(requirements, "decisions_file", lambda: tmp_path / "d.jsonl")
    with Session(engine) as session:
        requirements.decide(
            session, "REQ-G60-US-ID-01", "defer", actor="human:pm", note="Wait for the EU study"
        )
        rows = {r["id"]: r for r in export_rows(session, "G60", "US")}
        session.rollback()
    one = rows["REQ-G60-US-ID-01"]
    assert one["decision"]["status"] == "deferred" and one["decision"]["by"] == "human:pm"
    assert one["effort"]["effort_pct"] > 0 and one["effort"]["model_hash"]
    keep = next(r for r in rows.values() if r["effort"] is None)  # a strength to keep
    assert keep["decision"] is None
    csv = render_csv(list(rows.values())).splitlines()
    assert csv[0].endswith("effort_model_hash,decision,decided_by,decided_at,decision_note")
    line = next(x for x in csv if x.startswith("REQ-G60-US-ID-01,"))
    assert ",deferred,human:pm," in line and line.endswith("Wait for the EU study")
    md = render_markdown([one], "x")
    assert "**Effort:**" in md and "**Decision:** deferred by human:pm" in md
