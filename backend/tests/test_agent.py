from __future__ import annotations

import json
import re

import pytest
from pydantic import BaseModel, ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.agent.analysis import (
    PROMPT_VERSION,
    Insight,
    SituationAnalysis,
    render_analysis,
    resolve_scope,
    run_analysis,
    unverified_quotes,
)
from tracepoint.agent.context_pack import build_context_pack, render_markdown
from tracepoint.agent.loop import UNTRUSTED_DATA_RULE, run_agent
from tracepoint.agent.tools import TOOLS, call_tool, tool_schemas
from tracepoint.core.runs import start_run
from tracepoint.db.models import AuditEvent, Verbatim
from tracepoint.llm.gateway import FakeProvider, LlmGateway, ProviderResponse

# WP1.9 acceptance: hand-written queries return relevant evidence in the top five
RETRIEVAL = {
    "electric range in winter cold": ["range"],
    "charging port flap": ["charg", "port", "flap"],
    "seats uncomfortable back pain": ["seat"],
    "wind noise at highway speed": ["noise", "wind"],
    "touch screen distracting buttons": ["screen", "button", "touch"],
    "sunglasses storage": ["sunglass", "storage"],
    "automatic doors open": ["door"],
    "auto start stop switch off": ["stop"],
    "apple carplay connection drops": ["carplay", "car play"],
    "trunk too small luggage": ["trunk", "boot", "luggage"],
}


@pytest.mark.parametrize("query", RETRIEVAL)
def test_search_evidence_top5_relevant(engine, ingested, query):
    with Session(engine) as session:
        items = call_tool(session, "search_evidence", {"query": query, "limit": 5})["items"]
        session.rollback()
    hits = sum(any(t in i["text"].lower() for t in RETRIEVAL[query]) for i in items)
    assert len(items) == 5 and hits >= 4


def test_context_pack_is_compact_and_cited(engine, ingested):
    with Session(engine) as session:
        pack = build_context_pack(session, "G60", "US")
    assert pack["coverage"]["verbatims"] > 1000 and pack["top_complaints"]
    assert all(
        q["evidence_ref"].startswith("verbatim:") for q in pack["top_complaints"][0]["quotes"]
    )
    assert len(json.dumps(pack, default=str)) < 40_000  # fits a prompt
    assert "## Top complaint themes" in render_markdown(pack)


def test_every_tool_runs_and_is_logged(engine, ingested):
    calls = {
        "get_context_pack": {"vehicle": "F70", "market": "EU"},
        "search_evidence": {"query": "heated steering wheel", "vehicle": "F70"},
        "search_documents": {"query": "electric"},
        "get_verbatims_by_theme": {"vehicle": "G60", "theme": "electric range", "limit": 3},
        "get_metric": {"vehicle": "G60", "market": "US"},
        "get_equipment": {"vehicle": "F70", "query": "lenkrad"},
        "get_sales": {"vehicle": "G70", "market": "US"},
        "get_findings": {"vehicle": "G60"},
        "get_requirements": {"vehicle": "G60", "status": "proposed"},
        "get_effort": {"vehicle": "G60", "market": "US"},
    }
    assert set(calls) == set(TOOLS) and len(tool_schemas()) == len(TOOLS)
    with Session(engine) as session:
        for name, args in calls.items():
            assert "error" not in call_tool(session, name, args, actor_id="agent:test")
        logged = session.scalars(
            select(AuditEvent.entity_id).where(
                AuditEvent.action == "tool.called", AuditEvent.actor_id == "agent:test"
            )
        ).all()
        assert set(logged) == set(calls)
        with pytest.raises(ValidationError):
            call_tool(session, "get_sales", {"vehicle": "X99"})
        session.rollback()


# ---- agent loop and situation analysis (fake provider) -----------------------------------------


class _Answer(BaseModel):
    text: str
    evidence_refs: list[str]


def _calls(*calls):
    return ProviderResponse(
        text="",
        model="fake-model",
        finish_reason="tool_calls",
        tool_calls=[{"id": f"c{i}", "name": n, "arguments": a} for i, (n, a) in enumerate(calls)],
    )


def _first_ref(history):
    """A reference the tools really returned, read from the tool messages."""
    for turn in history:
        if turn["role"] == "tool" and "evidence_ref" in turn["content"]:
            return json.loads(turn["content"])["items"][0]["evidence_ref"]
    raise AssertionError("no tool result with evidence")


def test_agent_loop_runs_tools_and_corrects_unknown_citation(engine, ingested):
    turns = []

    def responder(kw):
        turns.append(kw)
        if len(turns) == 1:
            return _calls(
                ("search_evidence", {"query": "seat comfort", "vehicle": "G60", "limit": 2}),
                ("get_sales", {"vehicle": "X99"}),
                ("no_such_tool", {}),
            )
        ref = "verbatim:INVENTED" if len(turns) == 2 else _first_ref(kw["history"])
        return {"text": "seats", "evidence_refs": [ref]}

    with Session(engine) as session, start_run(session, "test.agent.loop") as run:
        gateway = LlmGateway(session, FakeProvider(responder), run.id)
        res = run_agent(
            session,
            gateway,
            purpose="test",
            prompt_version="t-v1",
            system="s",
            user="u",
            schema_model=_Answer,
            schema_name="answer",
            actor_id="agent:looptest",
        )
        logged = session.scalars(
            select(AuditEvent.entity_id).where(
                AuditEvent.action == "tool.called", AuditEvent.run_id == run.id
            )
        ).all()
    assert res.steps == 3 and res.unknown_refs == [] and res.cited_refs[0].startswith("verbatim:")
    # bad calls go back to the model as errors instead of ending the run; only real calls log
    assert [("error" in c) for c in res.tool_calls] == [False, True, True]
    assert logged == ["search_evidence"]
    tool_turns = [t for t in turns[1]["history"] if t["role"] == "tool"]
    assert len(tool_turns) == 3 and "unknown tool" in tool_turns[2]["content"]
    assert "verbatim:INVENTED" in turns[2]["history"][-1]["content"]  # the correction request
    assert turns[0]["system"].endswith(UNTRUSTED_DATA_RULE)


def test_agent_loop_must_answer_at_the_step_limit(engine, ingested):
    def responder(kw):
        if kw["allow_tool_calls"]:
            return _calls(("get_sales", {"vehicle": "G60", "market": "US"}))
        return {"text": "done", "evidence_refs": ["sales:SAL-G60-US-2025"]}

    with Session(engine) as session, start_run(session, "test.agent.limit") as run:
        res = run_agent(
            session,
            LlmGateway(session, FakeProvider(responder), run.id),
            purpose="test",
            prompt_version="t-v1",
            system="s",
            user="limit",
            schema_model=_Answer,
            schema_name="answer",
            actor_id="agent:looptest",
            max_steps=2,
        )
    assert res.steps == 3 and res.hit_step_limit and res.unknown_refs == []


def _rec(ref, title, requirement, changes, *, changes_vehicle=True, carryover=False):
    return {
        "title": title,
        "proposal": "p",
        "horizon": "H1",
        "rationale": "why",
        "evidence_refs": [ref],
        "related_requirement": requirement,
        "changes_vehicle": changes_vehicle,
        "effort_changes": changes
        and [
            {
                "subsystem": s,
                "own_impact": own,
                "layer": layer,
                "carryover": carryover,
                "why": "w",
                "portfolio_terms": ["%", "ab"],  # a wildcard and a too short term: both dropped
            }
            for s, own, layer in changes
        ],
    }


def test_situation_analysis_for_a_country(engine, ingested):
    seen_user, corrections = [], []

    def responder(kw):
        seen_user.append(kw["user"])
        if kw["history"] and kw["history"][-1]["role"] == "user":
            corrections.append(kw["history"][-1]["content"])
        if not kw["history"]:
            return _calls(("get_verbatims_by_theme", {"vehicle": "F70", "theme": "Seats"}))
        ref = re.search(r"verbatim:[\w-]+", kw["user"]).group(0)  # a quote of the context pack
        return {
            "headline": "h",
            "summary": "s",
            "data_coverage": "d",
            "insights": [
                {
                    "title": "t",
                    "kind": "recurring_complaint",
                    "domain": "interior_comfort",
                    "statement": "st",
                    "customer_quote": "a sentence no customer wrote",
                    "evidence_refs": [ref],
                    "confidence": "medium",
                }
            ],
            "recommendations": [
                _rec(ref, "seat foam", "REQ-INVENTED", [("seats", 0.25, "K1")]),
                _rec(ref, "new body", None, [("body_structure", 0.9, "K3")]),
                _rec(ref, "bigger battery", None, [("hv_battery", 0.5, "K2")]),
                _rec(ref, "keep the handling", None, None, changes_vehicle=False),
                _rec(ref, "silent change", None, None),
                _rec(ref, "seat foam as carryover", None, [("seats", 0.25, "K1")], carryover=True),
            ],
            "assumptions_and_gaps": ["a"],
        }

    with Session(engine) as session:
        with start_run(session, "test.agent.analysis") as run:
            gateway = LlmGateway(session, FakeProvider(responder), run.id)
            out = run_analysis(session, run, gateway, "F70", country="gb")
        event = session.scalar(select(AuditEvent).where(AuditEvent.action == "analysis.created"))
        assert event.actor_id == "agent:analyst" and event.run_id == out["run_id"]
        assert event.prompt_version == PROMPT_VERSION
        with pytest.raises(ValueError, match="belongs to market EU"):
            resolve_scope(session, "US", "GB")
        with pytest.raises(ValueError, match="no evidence"):
            run_analysis(session, run, gateway, "F70", market="US")
    assert (out["market"], out["country"]) == ("EU", "GB")
    assert "country GB only" in seen_user[0] and "country=GB" in seen_user[0]
    correction = corrections[-1]
    assert "REQ-INVENTED" in correction and "a sentence no customer wrote" in correction
    # effort comes from the CPM engine, from the change profile the analyst gave
    assert "## Effort model (CPM)" in seen_user[0]
    assert "Not on this vehicle, so no change can start there: hv_battery, charging" in seen_user[0]
    seats, body, battery, keep, silent, carried = out["effort"]["recommendations"]
    assert seats["decision"] == "adapt" and 0 < seats["p5"] < seats["effort_pct"] < seats["p95"]
    # a requirement id the model made up gives no profile; its own profile is used and flagged
    assert seats["source"] == "analyst's change profile" and seats["flags"][0]["rule"] == "scope"
    assert seats["changes"][0]["portfolio_terms"] == []
    assert "catalogue terms not searched" in seats["flags"][1]["text"]  # dropped, and said so
    assert body["decision"] == "new generation"
    assert any(f["level"] == "conflict" for f in body["flags"])
    assert battery["status"] == "invalid" and "not present on F70" in battery["error"]
    # only a declared "no change" passes without an estimate
    assert keep["status"] == "no_vehicle_change" and silent["status"] == "missing"
    # the model cannot lower its own estimate by claiming carryover
    assert carried["effort_pct"] == seats["effort_pct"] and not carried["changes"][0]["carryover"]
    assert any("is not applied" in f["text"] for f in carried["flags"])
    for sent_back in (
        "REQ-INVENTED, which does not exist",
        '"new body" is H1',
        "breaks the effort model",
        '"silent change" changes the vehicle but has no change profile',
    ):
        assert sent_back in correction
    assert len(out["effort"]["open_faults"]) == 4  # the fake provider did not correct them
    (package,) = out["effort"]["packages"]
    assert (package["horizon"], package["proposals"]) == ("H1", 3)
    assert package["not_counted"] == ["bigger battery", "silent change"]
    assert package["decision"] == "new generation" and out["effort"]["model_hash"]
    assert package["flags"][0]["level"] == "conflict"  # shown to the PM with the package
    # the invented requirement id survived the one correction and is reported, not hidden
    assert out["citations"]["unknown"] == ["REQ-INVENTED"]
    assert out["citations"]["unverified_quotes"] == ["a sentence no customer wrote"]
    text = render_analysis(out)
    assert "## Insights" in text and "`REQ-INVENTED` (not verified)" in text
    assert "Effort (CPM estimate): **" in text and "## Effort of the proposals as packages" in text
    assert "not estimated**, the profile breaks the model" in text
    assert "not estimated**, no change profile was given" in text
    assert "not counted, no usable change profile: silent change" in text


def test_quote_check_does_not_pass_quotes_it_cannot_compare(engine, ingested):
    def analysis(quote, refs):
        insight = Insight(
            title="t",
            kind="context",
            domain="general",
            statement="s",
            customer_quote=quote,
            evidence_refs=refs,
            confidence="low",
        )
        return SituationAnalysis(
            headline="h",
            summary="s",
            data_coverage="d",
            insights=[insight],
            recommendations=[],
            assumptions_and_gaps=[],
        )

    with Session(engine) as session:
        verbatim = session.scalars(select(Verbatim).where(Verbatim.char_len > 80)).first()
        ref = f"verbatim:{verbatim.id}"
        real = verbatim.text[10:60].upper()  # case and punctuation do not matter
        assert unverified_quotes(session, analysis(real, [ref])) == []
        # nothing comparable (punctuation, or a script the old ASCII filter emptied) is not a match
        for quote in ("…", "座席が硬い"):
            assert unverified_quotes(session, analysis(quote, [ref])) == [quote]
        assert unverified_quotes(session, analysis(real, ["FND-X"])) == [real]  # no verbatim cited


def test_answer_schema_bounds_reject_instead_of_truncating():
    from tracepoint.agent.analysis import MAX_CHANGES, MAX_TERMS, ProposedChange, Recommendation
    from tracepoint.llm.schema import to_strict_schema

    change = {"subsystem": "seats", "own_impact": 0.1, "layer": "K1", "carryover": False}
    rec = _rec("verbatim:x", "t", None, None)
    Recommendation(**{**rec, "effort_changes": [{**change, "portfolio_terms": []}] * MAX_CHANGES})
    with pytest.raises(ValidationError):  # one more change than allowed: the answer is invalid
        Recommendation(
            **{**rec, "effort_changes": [{**change, "portfolio_terms": []}] * (MAX_CHANGES + 1)}
        )
    with pytest.raises(ValidationError):
        ProposedChange(**change, portfolio_terms=["term"] * (MAX_TERMS + 1))
    # the provider is given the same bounds
    schema = json.dumps(to_strict_schema(SituationAnalysis))
    assert f'"maxItems": {MAX_CHANGES}' in schema and f'"maxItems": {MAX_TERMS}' in schema
