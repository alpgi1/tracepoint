from __future__ import annotations

import json

import pytest
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from tracepoint.core.runs import start_run
from tracepoint.core.settings import Settings
from tracepoint.db.models import LlmCall
from tracepoint.llm.gateway import (
    FakeProvider,
    LlmBudgetExceeded,
    LlmGateway,
    LlmRequest,
    LlmSchemaError,
    ProviderResponse,
    make_provider,
)
from tracepoint.llm.pricing import estimate_cost_usd
from tracepoint.llm.schema import to_strict_schema


class Answer(BaseModel):
    label: str
    score: float
    note: str | None = None


def _req(user: str) -> LlmRequest:
    return LlmRequest(
        purpose="test", system="sys", user=user, prompt_version="t-v1", schema_name="answer"
    )


def test_strict_schema_marks_objects_closed():
    schema = to_strict_schema(Answer)
    assert schema["additionalProperties"] is False
    assert set(schema["required"]) == {"label", "score", "note"}


def test_gateway_caches_identical_requests(engine, ingested):
    provider = FakeProvider(lambda kw: {"label": "ok", "score": 0.9, "note": None})
    with Session(engine) as session, start_run(session, "test.llm") as run:
        gw = LlmGateway(session, provider, run.id, Settings(llm_max_attempts=2))
        first = gw.complete(_req("hello"), Answer)
        second = gw.complete(_req("hello"), Answer)
        assert first.parsed.label == "ok" and not first.cached
        assert second.cached and second.llm_call_id == first.llm_call_id
        assert len(provider.calls) == 1
        n = session.scalar(
            select(func.count()).select_from(LlmCall).where(LlmCall.run_id == run.id)
        )
        assert n == 1
        row = session.get(LlmCall, first.llm_call_id)
        assert row.status == "ok" and row.input_tokens and row.request["user"] == "hello"


def test_gateway_repairs_invalid_json_once(engine, ingested):
    calls = {"n": 0}

    def responder(kw):
        calls["n"] += 1
        return (
            "not json" if calls["n"] == 1 else {"label": "fixed", "score": 1.0, "note": "repaired"}
        )

    provider = FakeProvider(responder)
    with Session(engine) as session, start_run(session, "test.llm.repair") as run:
        gw = LlmGateway(session, provider, run.id, Settings(llm_max_attempts=2))
        res = gw.complete(_req("broken"), Answer)
        assert res.parsed.label == "fixed" and calls["n"] == 2


def test_gateway_schema_error_in_batch_is_reported(engine, ingested):
    provider = FakeProvider(lambda kw: {"label": "x"})  # missing score → schema error
    with Session(engine) as session, start_run(session, "test.llm.batch") as run:
        gw = LlmGateway(session, provider, run.id, Settings(llm_max_attempts=1))
        results = gw.complete_many([_req("a"), _req("b")], Answer, concurrency=2)
        assert all(isinstance(r, LlmSchemaError) for r in results)
        errors = session.scalar(
            select(func.count())
            .select_from(LlmCall)
            .where(LlmCall.run_id == run.id, LlmCall.status == "error")
        )
        assert errors == 2


def test_gateway_budget_cap(engine, ingested, monkeypatch):
    provider = FakeProvider(lambda kw: {"label": "ok", "score": 0.5, "note": None})
    with Session(engine) as session, start_run(session, "test.llm.cap") as run:
        gw = LlmGateway(session, provider, run.id, Settings(llm_max_cost_usd_per_run=0.001))
        gw.spent_usd = 0.5
        monkeypatch.setattr(gw, "run_spent_usd", lambda: 0.5)
        with pytest.raises(LlmBudgetExceeded):
            gw.complete(_req("capped"), Answer)


def test_fake_provider_payload_is_json():
    provider = FakeProvider(lambda kw: {"a": 1})
    resp = provider.complete(
        model="m",
        system="s",
        user="u",
        schema=None,
        schema_name="x",
        temperature=0.0,
        max_output_tokens=10,
        timeout=1.0,
    )
    assert json.loads(resp.text) == {"a": 1}


def test_empty_base_url_falls_back_to_default_endpoint():
    provider = make_provider(Settings(openai_api_key="sk-test", openai_base_url=""))
    assert str(provider._client.base_url).startswith("https://")


def test_dated_snapshot_is_priced_as_its_alias():
    mini = estimate_cost_usd("gpt-5.4-mini", 1_000_000, 0, 1_000_000)
    assert mini is not None
    assert estimate_cost_usd("gpt-5.4-mini-2026-03-17", 1_000_000, 0, 1_000_000) == mini
    assert estimate_cost_usd("gpt-5.4-2026-03-05", 1_000_000, 0, 1_000_000) != mini
    assert estimate_cost_usd("some-other-model", 1, 0, 1) is None


def test_gateway_returns_and_caches_tool_calls(engine, ingested):
    call = {"id": "c1", "name": "get_sales", "arguments": {"vehicle": "G60"}}
    provider = FakeProvider(
        lambda kw: ProviderResponse(text="", model="fake-model", tool_calls=[call])
    )
    tools = ({"name": "get_sales", "description": "d", "input_schema": {"type": "object"}},)
    req = LlmRequest(purpose="test", system="s", user="tools", prompt_version="t-v1", tools=tools)
    later = LlmRequest(
        purpose="test",
        system="s",
        user="tools",
        prompt_version="t-v1",
        tools=tools,
        history=({"role": "tool", "tool_call_id": "c1", "content": "{}"},),
    )
    with Session(engine) as session, start_run(session, "test.llm.tools") as run:
        gw = LlmGateway(session, provider, run.id)
        first = gw.complete(req, Answer)  # a tool-call turn is not parsed against the schema
        again = gw.complete(req, Answer)
        gw.complete(later, Answer)  # the history is part of the cache key
        assert first.tool_calls == [call] and first.parsed is None
        assert again.cached and again.tool_calls == [call]
        assert len(provider.calls) == 2 and provider.calls[1]["history"] == later.history
        assert session.get(LlmCall, first.llm_call_id).request["tools"] == ["get_sales"]
