"""External evidence: the two lists, the scope decision, the claim check and the read path."""

from __future__ import annotations

import httpx
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from tracepoint.agent.tools import call_tool
from tracepoint.core.runs import start_run
from tracepoint.db.models import DocumentPage, ExternalEvidence, ExternalSource, Source
from tracepoint.effort.subsystems import external_rows, subsystems_of_refs
from tracepoint.ingest import external
from tracepoint.ingest.external import (
    Fetcher,
    claim_figures,
    html_text,
    ingest_external,
    load_fetched,
    load_registry,
    public_address,
    set_levels,
    verify_claim,
)


def test_every_listed_source_is_decided():
    """131 entries in the two lists; each is in scope or excluded with a reason."""
    reg = load_registry()
    by_list = {
        name: sum(e["list"] == name for e in reg["listed"])
        for name in ("trend_sources.md", "external_sources_v2.json")
    }
    assert by_list == {"trend_sources.md": 76, "external_sources_v2.json": 55}
    assert len(reg["sources"]) + len(reg["excluded"]) == 131
    # what the list itself drops, and what the brief puts out of scope, is not loaded
    assert {"E-07", "E-08", "E-23", "T8-02", "X-04"} <= set(reg["excluded"])
    assert all(len(reason) > 30 for reason in reg["excluded"].values())
    # a source that is not fetched says why
    assert all(s["why_not_fetched"] for s in reg["sources"] if s["fetch"] in ("manual", "none"))
    first = next(s for s in reg["sources"] if s["ref"] == "P-01")
    assert (first["regions"], first["trust"], first["published"]) == (["EU"], 4, "2026-01-27")
    assert first["listed"]["verified"] == "yes" and first["feeds"] == ["market_momentum"]


def test_claim_figures_leave_out_years_and_single_digits():
    text = "US 2025: battery electric 7.5 %, 216,000 units, 6 % in Q2 and Level 2+ on 28 %."
    assert claim_figures(text) == ["7.5", "216000", "28"]


def test_claim_check_against_a_page():
    claim = {"figures": ["17.4", "216000", "28"], "quote": None}
    page = "Battery-electric cars took 17,4% of the market. Hybrids sold 216,000 units; 128 new."
    got = verify_claim(claim, [page])
    assert got["verification"] == "partial"
    assert (got["found"], got["missing"]) == (["17.4", "216000"], ["28"])  # 128 is not 28
    assert "17,4%" in got["excerpt"]
    assert verify_claim(claim, [page + " A share of 28 %."])["verification"] == "confirmed"
    # the same figures far apart prove little on a page of numbers, unless a reader pinned it
    apart = [page + " filler" * 200 + " A share of 28 %."]
    assert verify_claim(claim, apart)["verification"] == "on_page"
    pinned = {**claim, "quote": "Hybrids sold 216,000 units"}
    assert verify_claim(pinned, apart)["verification"] == "confirmed"
    assert verify_claim({**claim, "quote": "not there"}, apart)["verification"] == "not_found"
    assert verify_claim(claim, ["nothing here"])["verification"] == "not_found"
    assert verify_claim(claim, None)["verification"] == "not_fetched"
    worded = {"figures": [], "quote": "Nobody asked for the knob"}
    assert verify_claim(worded, ["BMW says: nobody asked for the knob."])["verification"] == (
        "confirmed"
    )
    assert verify_claim({"figures": [], "quote": None}, ["x"])["verification"] == "not_checkable"


def test_page_text_keeps_the_article_and_drops_the_chrome():
    html = (
        "<html><head><title>T</title><script>var a = 1;</script></head><body>"
        "<nav><li>Menu entry</li></nav><header>Site header</header>"
        "<article><h1>Headline</h1><p>BEV share was <b>17.4</b> %.</p>"
        + "<p>More text.</p>" * 200
        + "</article><footer>Imprint</footer></body></html>"
    )
    text = html_text(html.encode())
    assert text.startswith("Headline\nBEV share was 17.4 %.")
    assert not any(word in text for word in ("Menu entry", "Site header", "Imprint", "var a"))


def test_fetcher_stays_on_public_hosts_and_bounds_the_body(monkeypatch):
    for url in (
        "http://127.0.0.1/admin",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.5/",
        "http://[::1]/",
        "file:///etc/passwd",
        "ftp://8.8.8.8/",
    ):
        assert not public_address(url), url
    assert public_address("https://8.8.8.8/page")

    def answer(request: httpx.Request) -> httpx.Response:
        if request.url.path == "/moved":  # a public page that points inwards
            return httpx.Response(302, headers={"location": "http://169.254.169.254/latest"})
        if request.url.path == "/loop":
            return httpx.Response(302, headers={"location": "/loop"})
        if request.url.path == "/robots.txt":
            return httpx.Response(404)
        return httpx.Response(200, content=b"x" * 5000, headers={"content-type": "text/html"})

    monkeypatch.setattr(external, "HOST_PAUSE_SECONDS", 0)
    fetcher = Fetcher()
    fetcher.client = httpx.Client(transport=httpx.MockTransport(answer))
    assert fetcher.snapshot("https://8.8.8.8/moved")[0]["status"] == "non_public_address"
    assert fetcher.snapshot("https://8.8.8.8/loop")[0]["status"] == "too_many_redirects"
    record, body = fetcher.snapshot("https://8.8.8.8/page")
    assert (record["status"], len(body)) == ("fetched", 5000)
    monkeypatch.setattr(external, "MAX_BYTES", 1000)  # cut off while reading
    record, body = fetcher.snapshot("https://8.8.8.8/page")
    assert (record["status"], body) == ("too_large", None)


def test_level_counts_independent_origins_of_a_topic_and_region():
    def claim(origin, regions, topic="t", side="for"):
        return {"origin": origin, "regions": regions, "topic": topic, "side": side}

    claims = [
        claim("ACEA", ["EU"]),
        claim("ACEA", ["EU"]),  # the same institution twice is one source
        claim("IEA", ["Global", "EU"]),
        claim("EIA", ["US"]),  # another region does not support the EU rows
        claim("BMW", ["EU"], side="against"),
        claim("Solo", ["EU"], topic=None),
        # a statement that was not found on its page supports nobody else
        {**claim("Unread", ["EU"]), "verified": False},
    ]
    set_levels(claims)
    assert [c["level"] for c in claims] == [
        "medium",
        "medium",
        "medium",
        "weak",
        "weak",
        "weak",
        "strong",
    ]


def test_ingest_loads_only_what_is_in_scope(engine, ingested):
    with Session(engine) as session:
        with start_run(session, "test.ingest.external") as run:
            stats = ingest_external(session, run)
        with start_run(session, "test.ingest.external.again") as run:
            assert ingest_external(session, run)["claims"] == stats["claims"]  # idempotent
        session.commit()
        assert (stats["listed"], stats["excluded"]) == (131, 7)
        assert session.scalar(select(func.count()).select_from(ExternalSource)) == 124
        assert stats["claims"] == session.scalar(select(func.count()).select_from(ExternalEvidence))
        for dropped in ("E-07", "E-08", "E-23", "T8-02", "X-04", "X-05", "T7-06"):
            assert session.get(Source, f"SRC-EXT-{dropped}") is None
        acea = session.get(ExternalEvidence, "EXT-P-01-1")
        assert (acea.regions, acea.subsystems, acea.kind) == (
            ["EU"],
            ["powertrain"],
            "market_share",
        )
        assert acea.contradiction["id"] == "C-EU-electrification"
        assert acea.locator["url"].startswith("https://www.acea.auto/")
        # a forecast is an assumption (rule 36)
        assert session.get(ExternalEvidence, "EXT-T5-01-1").basis == "assumption"
        # page text is stored for sources about our vehicles only
        tagged = session.scalars(
            select(DocumentPage.locator).where(DocumentPage.source_id.like("SRC-EXT-%"))
        ).all()
        assert all(loc["vehicles"] for loc in tagged)


def test_fetch_record_matches_the_registry():
    reg, fetched = load_registry(), load_fetched()
    assert set(fetched["claims"]) <= {c["id"] for c in reg["claims"]}
    assert set(fetched["sources"]) <= {
        s["ref"] for s in reg["sources"] if s["fetch"] in ("auto", "api")
    }
    states = {"confirmed", "on_page", "partial", "not_found", "not_checkable", "not_fetched"}
    assert {c["verification"] for c in fetched["claims"].values()} <= states


def test_rows_of_a_scope(session):
    us = external_rows(session, "US", "G60")
    assert us and all({"US", "Global"} & set(r["regions"]) for r in us)
    assert all(not r["vehicles"] or "G60" in r["vehicles"] for r in us)
    # the F70 has no high-voltage battery and no charging: rows about those alone do not apply
    f70 = external_rows(session, "EU", "F70")
    assert f70 and all(
        set(r["subsystems"]) - {"hv_battery", "charging"} or not r["subsystems"] for r in f70
    )
    charging = external_rows(session, "CN", "G68", subsystem="charging")
    assert charging and all("charging" in r["subsystems"] for r in charging)
    assert subsystems_of_refs(session, ["external:EXT-P-01-1"]) == {"powertrain": 1}


def test_agent_tool_and_pack(session):
    out = call_tool(
        session,
        "get_external_evidence",
        {"market": "CN", "vehicle": "G68", "topic": "physical_controls"},
    )
    assert out["total"] >= 3 and out["topics"] == ["physical_controls"]
    row = out["items"][0]
    assert row["evidence_ref"] == f"external:{row['id']}" and row["level"] == "strong"
    assert {"title", "origin", "url", "date", "type"} <= set(row["source"])
    assert "error" in call_tool(
        session, "get_external_evidence", {"market": "US", "subsystem": "nope"}
    )
    pack = call_tool(session, "get_context_pack", {"vehicle": "G60", "market": "US"})
    assert pack["external_evidence"]["rows"] == len(external_rows(session, "US", "G60"))
