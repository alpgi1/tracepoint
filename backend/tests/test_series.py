"""The series analysis: regions side by side, the checks on a decision, the brief."""

from __future__ import annotations

import re

import pytest
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from tracepoint.agent.series import (
    PROMPT_VERSION,
    build_series_pack,
    pack_refs,
    regions_of_refs,
    render_series,
    render_series_pack,
    run_series_analysis,
    series_regions,
)
from tracepoint.core.runs import start_run
from tracepoint.db.models import AuditEvent, Verbatim
from tracepoint.ingest.external import ingest_external
from tracepoint.llm.gateway import FakeProvider, LlmGateway, ProviderResponse


@pytest.fixture(scope="module", autouse=True)
def prepared(engine, ingested):
    """What `start.sh` runs after the ingestion: the committed gap labels, the findings of the
    series, the requirements with their effort, the external evidence."""
    from tracepoint.classify.gap import import_gap_file
    from tracepoint.effort.store import estimate_all
    from tracepoint.findings.extract import extract_findings
    from tracepoint.requirements.store import import_all

    with Session(engine) as session:
        with start_run(session, "test.series.prepare") as run:
            for code in ("F70", "G60", "G70"):
                import_gap_file(session, run, code)
            for vehicle, market in (
                *(("G60", "US"), ("G60", "EU"), ("G60", "RoW"), ("G68", "CN")),
                *(("F70", "EU"), ("G70", "US")),  # the requirement files of the other series
            ):
                extract_findings(session, run, vehicle, market)
            import_all(session, run)
            estimate_all(session, run, runs=200)
            ingest_external(session, run)
        session.commit()


def test_regions_of_a_series(session):
    """The markets in which a vehicle of the series holds evidence, largest sales first. The
    remainder market (Japan, South Korea and others) has verbatims but no study, no market
    evidence and no sales per country, and is left out. Any vehicle of the series names it."""
    regions = series_regions(session, "G68")
    assert [r["label"] for r in regions] == ["EU", "US", "CN"]
    by = {r["label"]: r for r in regions}
    assert (by["CN"]["vehicle"], by["CN"]["verbatims"]) == ("G68", 0)
    assert by["US"]["verbatims"] == 3628 and by["EU"]["sales_2025"] == 115000
    assert by["US"]["countries"] == {"US": 3610, "CA": 18}
    korean = session.scalar(
        select(func.count()).select_from(Verbatim).where(Verbatim.country_code == "KR")
    )
    assert korean and "RoW" not in {r["market"] for r in regions}  # there, and not a region
    # the 1 Series is not sold in the US or China, and its Japanese verbatims are remainder
    assert [r["label"] for r in series_regions(session, "F70")] == ["EU"]


def test_comparison_pack_puts_regions_on_one_scale(session):
    pack = build_series_pack(session, "G60")
    hmi = next(s for s in pack["subsystems"] if s["subsystem"] == "software_hmi")["regions"]
    assert hmi["US"] == {"rows": 723, "per_100": 19.9, "likes": 392}
    assert hmi["EU"]["rows"] == 46 and hmi["EU"]["per_100"] == 41.4
    assert hmi["CN"]["per_100"] is None  # no verbatims: no rate, not a zero
    theme = next(t for t in pack["complaint_themes"] if t["theme"] == "Electric Range")["regions"]
    assert theme["US"]["finding"] == "FND-G60-US-VOC-electric_range" and theme["CN"]["rows"] == 0
    # EU and CN share one study: scores compare; the US study compares by rank only
    seat = next(a for a in pack["study"] if a["key"] == "seat_comfort")["regions"]
    assert (seat["EU"]["scale"], seat["CN"]["scale"], seat["US"]["scale"]) == (
        "1-10",
        "1-10",
        "1-7",
    )
    assert seat["US"]["rank_from_bottom"] <= seat["US"]["of"] == 103
    assert seat["CN"]["evidence_ref"] == "metric:MET-CNEU-CN-G68-seat_comfort"
    text = render_series_pack(pack)
    assert "| Software/HMI `software_hmi` | " in text and "no text" in text
    assert "tools: vehicle=G68, market=CN" in text and "RoW" not in text
    assert "`REQ-G60-US-IC-01`" in text
    # what sets a region apart is computed, so that a regional decision starts from a difference
    apart = pack["apart"]
    raised = apart["EU"]["complaints_raised_here"][0]
    assert raised["text"].startswith("Electric Range: 13.5 per 100 (15 rows)")
    assert raised["ref"] == "FND-G60-EU-VOC-electric_range"
    weak = {i["text"].split(":")[0]: i for i in apart["CN"]["study_weaker_here"]}
    assert weak["Braking"]["text"].startswith("Braking: 3rd weakest of 37 (score 7.38) against")
    assert weak["Braking"]["ref"] == "metric:MET-CNEU-CN-G68-braking"
    assert "Quality of ride" not in weak  # weaker than in the EU, but mid-table in China
    stronger = [i["text"] for i in apart["CN"]["study_stronger_here"]]
    assert any(t.startswith("Rear interior roominess") for t in stronger)
    assert "(3rd weakest of 37)" in text and "rank 3/37" not in text
    assert "## What sets each region apart" in text and "this region only" in text
    refs = pack_refs(pack)
    assert {"FND-G60-US-VOC-electric_range", "sales:SAL-G60-EU-2025", "REQ-G60-US-IC-01"} <= refs
    assert "metric:MET-CNEU-CN-G68-seat_comfort" in refs
    assert any(r.startswith("external:EXT-") for r in refs)


def test_references_are_counted_per_region(session):
    regions = series_regions(session, "G60")
    korean = session.scalar(select(Verbatim.id).where(Verbatim.country_code == "KR").limit(1))
    british = session.scalar(
        select(Verbatim.id).where(Verbatim.country_code == "GB", Verbatim.vehicle_code == "G60")
    )
    refs = [
        f"verbatim:{korean}",
        f"verbatim:{british}",
        "FND-G60-US-VOC-seats",
        "metric:MET-CNEU-CN-G68-seat_comfort",
        "REQ-G60-US-IC-01",
        "sales:SAL-G60-EU-2025",  # sales, the catalogue and the remainder belong to no region
    ]
    assert regions_of_refs(session, refs, regions) == {"EU": 1, "US": 2, "CN": 1}


def _topic(title, decision, targets, refs, labels, changes=None, requirement=None):
    return {
        "title": title,
        "regions": [
            {"region": r, "customers": "c", "market": None, "weight": "weak"} for r in labels
        ],
        "our_offer": None,
        "rivals": None,
        "decision": decision,
        "target_regions": targets,
        "action": "a",
        "why": "w",
        "related_requirement": requirement,
        "effort_changes": changes
        and [
            {
                "subsystem": s,
                "own_impact": impact,
                "layer": layer,
                "carryover": False,
                "why": "y",
                "portfolio_terms": [],
            }
            for s, impact, layer in changes
        ],
        "confidence": "medium",
        "evidence_refs": refs,
    }


def test_series_analysis_checks_regional_decisions(engine, ingested):
    corrections, seen = [], []
    labels = ["EU", "US", "CN"]

    def responder(kw):
        seen.append(kw["user"])
        if kw["history"] and kw["history"][-1]["role"] == "user":
            corrections.append(kw["history"][-1]["content"])
        if not kw["history"]:
            return ProviderResponse(
                text="",
                model="fake-model",
                finish_reason="tool_calls",
                tool_calls=[
                    {
                        "id": "c0",
                        "name": "get_external_evidence",
                        "arguments": {"market": "CN", "vehicle": "G68", "limit": 3},
                    }
                ],
            )
        us = "FND-G60-US-VOC-seats"
        china = re.search(r"metric:MET-CNEU-CN-G68-[\w]+", kw["user"]).group(0)
        return {
            "headline": "h",
            "answer": "a",
            "regions": [{"region": r, "expects": ["e"], "evidence_refs": [us]} for r in labels],
            "topics": [
                # covered by a requirement of one of the series' markets: its profile is used
                _topic(
                    "seats",
                    "change_now_all_markets",
                    labels,
                    [us],
                    labels,
                    requirement="REQ-G60-US-IC-01",
                ),
                # regional for China on US evidence alone: sent back
                _topic(
                    "rear screens",
                    "change_now_regional",
                    ["CN"],
                    [us],
                    labels,
                    changes=[("software_hmi", 0.1, "K1")],
                ),
                # regional for China with a Chinese study score: accepted
                _topic(
                    "rear comfort",
                    "change_now_regional",
                    ["CN"],
                    [china, us],
                    labels,
                    changes=[("seats", 0.25, "K1")],
                ),
                _topic(
                    "battery",
                    "next_generation",
                    labels,
                    [us],
                    labels,
                    changes=[("hv_battery", 0.9, "K3")],
                ),
                # left to the next generation although the change is an adaptation: sent back
                _topic(
                    "small menu fix later, see FND-G60-US-VOC-seats",
                    "next_generation",
                    labels,
                    [us],
                    labels,
                    changes=[("software_hmi", 0.1, "K1")],
                ),
                # a strength with a change profile, and a region missing: both sent back
                _topic("handling", "keep", [], [us], labels[:2], changes=[("chassis", 0.1, "K1")]),
            ],
            "optimum_version": {
                "every_market": ["seats"],
                "regional": [{"region": "CN", "items": ["rear comfort"]}],
                "next_generation": ["battery"],
                "keep": ["handling"],
            },
            "unknowns": ["rivals"],
        }

    with Session(engine) as session:
        with start_run(session, "test.agent.series") as run:
            gateway = LlmGateway(session, FakeProvider(responder), run.id)
            out = run_series_analysis(session, run, gateway, "G60")
        event = session.scalar(
            select(AuditEvent).where(
                AuditEvent.action == "analysis.created", AuditEvent.run_id == out["run_id"]
            )
        )
        assert (event.actor_id, event.prompt_version) == ("agent:series-analyst", PROMPT_VERSION)
        assert event.after["decisions"]["change_now_regional"] == 2
    assert "# Comparison pack – BMW 5 Series" in seen[0] and "## Effort model (CPM)" in seen[0]
    correction = corrections[-1]
    assert '"rear screens" is a change for CN but cites no evidence of CN' in correction
    assert '"handling" must list each region once' in correction
    assert '"handling" is keep and carries a change profile' in correction
    assert '"rear comfort" is a change for CN but cites no evidence' not in correction
    assert "left to the next generation, but the change profile comes to" in correction
    assert "Text fields hold reference ids" in correction
    # what sets a region apart has to be dealt with: the fake answer cites none of it
    assert "What sets a region apart is passed over: " in correction
    assert "CN: Braking: 3rd weakest of 37" in correction
    seats, screens, comfort, battery, later, handling = out["effort"]["recommendations"]
    assert later["decision"] == "adapt" and later["flags"][-1]["rule"] == "horizon"
    assert seats["source"] == "change profile of REQ-G60-US-IC-01" and seats["decision"] == "adapt"
    assert battery["decision"] == "new generation"
    assert [t["horizon"] for t in out["topics"]] == ["H1", "H1", "H1", "H2", "H2", "H1"]
    assert out["topics"][2]["evidence_by_region"] == {"US": 1, "CN": 1}
    assert {p["horizon"] for p in out["effort"]["packages"]} == {"H1", "H2"}
    assert any("cites no evidence of CN" in f for f in out["effort"]["open_faults"])
    assert out["trace"]["tool_calls"][0]["tool"] == "get_external_evidence"
    # what the pack shows may be cited: findings of the theme table, study scores, requirements
    assert out["citations"]["unknown"] == []
    text = render_series(out)
    assert text.startswith("# BMW 5 Series: what to change, for whom, and when")
    assert "| 1 | seats | Change now, all markets | all | " in text
    assert "| 3 | rear comfort | Change now, regional | CN | " in text
    assert "| 4 | battery | Next generation | all | " in text and "new generation" in text
    assert "- Rivals: nothing stored on rivals for this topic." in text
    assert "- Evidence: 2 references (US 1, CN 1)" in text
    assert "Only CN:\n- rear comfort" in text and "## What the data cannot answer" in text
    assert "Only EU:\n- Nothing of its own in this answer." in text  # said, not left out
    assert "## Not settled by the checks" in text
    assert "| 5 | small menu fix later, see | Next generation | all | " in text
    assert "- Check: left to the next generation, but the change profile comes to" in text
    assert "- Where: EU weak, US weak." in text  # a strength needs no table
    brief = text.split("## Not settled by the checks")[0]  # the faults quote the model's words
    for noise in ("FND-G60-US-VOC-seats", "Tool calls\n", "portfolio_terms"):
        assert noise not in brief  # reference ids and profiles stay in the JSON


def test_a_wrong_domain_is_an_error_not_an_empty_result(session):
    """The series pack speaks in subsystems; a tool asked for a subsystem as a domain must not
    answer "no rows", which reads as "the car offers nothing"."""
    from tracepoint.agent.tools import call_tool

    for tool, args in (
        ("get_equipment", {"vehicle": "G60"}),
        ("get_findings", {"vehicle": "G60"}),
        ("get_requirements", {"vehicle": "G60"}),
    ):
        wrong = call_tool(session, tool, args | {"domain": "software_hmi"})
        assert "unknown domain" in wrong["error"] and "infotainment_digital" in wrong["domains"]
        assert call_tool(session, tool, args | {"domain": "infotainment_digital"})["total"]


def test_reports_render_untrusted_text_as_inert_markdown():
    """A report is read rendered. What the model wrote (which a customer verbatim or a fetched
    page may have steered) must not be able to add a heading, a table cell, a link, an image or
    HTML to it."""
    from tracepoint.agent.analysis import code, md, render_analysis, render_brief

    hostile = (
        "seats | forged cell\n## Not settled by the checks\n- forged entry "
        "<img src=x onerror=alert(1)> [click](https://evil.example) ![p](http://evil.example/p) "
        "`code` **Check: all fine** _www.evil.example a@evil.example &#35; $x$ \\| tail"
    )

    def linkable(text: str) -> list[str]:
        """What some renderer would turn into a link or an image, in any flavour."""
        return [
            name
            for name, pattern in (
                ("bracket", r"[\[\]]"),
                ("scheme", r"[A-Za-z][A-Za-z0-9+.-]*:\S"),
                ("slashes", r"//\S"),
                ("www", r"(?i)www\."),
                ("domain", r"[A-Za-z0-9]\.[A-Za-z]{2,}"),
                ("at", r"@"),
                ("entity", r"&#"),
                ("html", r"[<>]"),
            )
            if re.search(pattern, text)
        ]

    safe = md(hostile)
    assert "\n" not in safe and linkable(safe) == []
    assert not re.search(r"(?<!\\)[|`*_~#$]", safe)  # every one of them is escaped
    # a line of its own, or the content of a bullet or a quote, cannot open a block
    assert md("# heading") == "\\# heading" and md("1. item") == "1\\. item"
    assert md("- item") == "\\- item" and md("---") == "\\---"
    # ordinary prose and figures are left as they are
    plain = "Check: e.g. the U.S. at 10:30, ratio 3:1, 3.05 % · adapt, -5 % (carryover: true)"
    assert md(plain) == plain and md("gpt-5.4-2026-03-05") == "gpt-5.4-2026-03-05"
    # renderers disagree on what a link is, so every form is broken up in the visible text
    for bypass in (
        "[click](https://evil.example/x)",
        "![p](//evil.example/p)",
        "evil.example/path and bit.ly/x",
        "_www.Evil.example",
        "mailto:a@evil.example",
        "javascript:alert(1)",
        "data:text/html,x",
        "https&#58;//evil.example",
        "HTTPS://Evil.example",
        "\\[x\\](https://evil.example)",
        "<https://evil.example>",
    ):
        assert linkable(md(bypass)) == [], bypass
        # in a code span nothing is linked; it only must not end early or hold a bracket
        assert not re.search(r"[`|<>\[\]\n]", code(bypass)[1:-1]), bypass
    # a reference keeps its spelling, so that it can be looked up
    assert code("verbatim:G60-0248") == "`verbatim:G60-0248`"
    assert code("FND-`x` | y\nz <b> [a](b)") == "`FND-'x' / y z (b) (a)(b)`" and code("") == "`-`"

    effort_row = {"status": "no_vehicle_change", "flags": [], "evidence_subsystems": {}}
    situation = {
        "scope": hostile,
        "run_id": "RUN-1",
        "model": hostile,
        "prompt_version": "v",
        "analysis": {
            "headline": hostile,
            "summary": "# " + hostile,
            "data_coverage": hostile,
            "insights": [
                {
                    "title": hostile,
                    "kind": "context",
                    "domain": hostile,
                    "statement": "- " + hostile,
                    "customer_quote": hostile,
                    "evidence_refs": [hostile],
                    "confidence": "low",
                }
            ],
            "recommendations": [
                {
                    "title": hostile,
                    "proposal": hostile,
                    "horizon": "H1",
                    "rationale": hostile,
                    "evidence_refs": [hostile],
                    "related_requirement": hostile,
                }
            ],
            "assumptions_and_gaps": [hostile, "# Forged heading in a bullet", "> forged quote"],
        },
        "effort": {
            "method": "m",
            "model_hash": "h",
            "recommendations": [effort_row],
            "packages": [],
            "open_faults": [hostile],
        },
        "subsystems": {"insights": [{}]},
        "citations": {"cited": 1, "unknown": [hostile], "unverified_quotes": []},
        "trace": {
            "steps": 1,
            "tool_calls": [{"tool": hostile, "args": {"q": hostile}, "total": 0}],
        },
    }
    series = {
        "series": hostile,
        "run_id": "RUN-1",
        "model": hostile,
        "prompt_version": "v",
        "regions": [{"label": "EU", "name": hostile, "verbatims": 1, "sales_2025": 1}],
        "analysis": {
            "headline": hostile,
            "answer": "# " + hostile,
            "regions": [{"region": hostile, "expects": [hostile], "evidence_refs": []}],
            "topics": [
                {
                    "title": hostile,
                    "regions": [
                        {
                            "region": hostile,
                            "customers": hostile,
                            "market": hostile,
                            "weight": "weak",
                        }
                    ],
                    "our_offer": hostile,
                    "rivals": hostile,
                    "decision": "change_now_regional",
                    "target_regions": [hostile],
                    "action": hostile,
                    "why": hostile,
                    "confidence": "low",
                    "evidence_refs": [hostile],
                }
            ],
            "optimum_version": {
                "every_market": [hostile],
                "regional": [{"region": hostile, "items": [hostile]}],
                "next_generation": [hostile],
                "keep": [hostile],
            },
            "unknowns": [hostile, "# Forged heading in a bullet", "1. forged list"],
        },
        "topics": [{"evidence_by_region": {hostile: 1}}],
        "effort": {"recommendations": [effort_row], "packages": [], "open_faults": [hostile]},
        "citations": {"cited": 1, "unknown": [hostile]},
        "trace": {"tool_calls": []},
    }
    for render, out, headings, table_rows in (
        (render_brief, situation, 6, 3),
        (render_analysis, situation, 9, 0),
        (render_series, series, 7, 6),
    ):
        text = render(out)
        assert "<" not in text and "[" not in text and "]" not in text  # no HTML, no link
        outside = re.sub(r"`[^`\n]*`", "", text)  # code spans are shown as they stand
        assert "://" not in outside and "@" not in outside  # nothing to click
        assert not re.search(r"evil\.example|www\.", outside)
        # the structure is the program's own: no heading and no table row was added
        assert len(re.findall(r"(?m)^#{1,3} ", text)) == headings, render.__name__
        rows = [line for line in text.splitlines() if line.startswith("|")]
        assert len(rows) == table_rows, render.__name__
        assert len({len(re.findall(r"(?<!\\)\|", row)) for row in rows}) <= 2  # header widths
        assert not re.search(r"(?m)^- forged entry", text)
        # and none inside a bullet or a quote, where a line is parsed as a block again
        assert not re.search(r"(?m)^\s*(?:[-*+>]|\d+[.)])\s+(?:#{1,6}\s|>|[-*+]\s|\d+[.)]\s)", text)
