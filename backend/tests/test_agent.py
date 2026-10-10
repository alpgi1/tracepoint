from __future__ import annotations

import json

import pytest
from pydantic import ValidationError
from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.agent.context_pack import build_context_pack, render_markdown
from tracepoint.agent.tools import TOOLS, call_tool, tool_schemas
from tracepoint.db.models import AuditEvent

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
        "get_verbatims_by_theme": {"vehicle": "G60", "theme": "electric range", "limit": 3},
        "get_metric": {"vehicle": "G60", "market": "US"},
        "get_equipment": {"vehicle": "F70", "query": "lenkrad"},
        "get_sales": {"vehicle": "G70", "market": "US"},
        "get_findings": {"vehicle": "G60"},
        "get_requirements": {"vehicle": "G60", "status": "proposed"},
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
