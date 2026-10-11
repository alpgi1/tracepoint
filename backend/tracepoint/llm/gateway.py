"""Provider-agnostic LLM gateway.

Responsibilities: one place for provider calls (OpenAI first), structured JSON outputs validated
against Pydantic models, a response cache keyed by the input hash (identical requests never hit
the provider twice), retries with backoff, per-call logging in ``llm_call`` with tokens and cost,
and a cost cap per run. Business modules never import a provider SDK directly.
"""

from __future__ import annotations

import hashlib
import json
import re
import time
from collections.abc import Callable
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field, replace
from datetime import UTC, datetime, timedelta
from typing import Any, Protocol, TypeVar

from pydantic import BaseModel, ValidationError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from tracepoint.core.settings import Settings, get_settings
from tracepoint.db.models import LlmCall
from tracepoint.llm.pricing import estimate_cost_usd
from tracepoint.llm.schema import to_strict_schema

T = TypeVar("T", bound=BaseModel)


class LlmError(RuntimeError):
    """Base class for gateway errors. ``response`` is set when the provider did answer (and
    billed) but the answer is unusable."""

    response: ProviderResponse | None = None


class LlmRetryableError(LlmError):
    """Transient provider error (rate limit, timeout, 5xx)."""


class LlmBudgetExceeded(LlmError):
    """The cost cap of the current run would be exceeded."""


class LlmSchemaError(LlmError):
    """The provider answer did not validate against the requested schema."""


@dataclass(frozen=True)
class LlmRequest:
    purpose: str
    system: str
    user: str
    prompt_version: str
    schema_name: str = "result"
    tier: str = "bulk"  # bulk / reasoning → settings model
    model: str | None = None
    temperature: float | None = None
    max_output_tokens: int = 1024
    metadata: dict[str, Any] = field(default_factory=dict)
    # Agent turns that follow ``user``, in a provider-neutral form:
    #   {"role": "assistant", "content": str, "tool_calls": [{"id", "name", "arguments"}]}
    #   {"role": "tool", "tool_call_id": str, "content": str}  /  {"role": "user", "content": str}
    history: tuple[dict[str, Any], ...] = ()
    tools: tuple[dict[str, Any], ...] = ()  # entries of agent.tools.tool_schemas()
    allow_tool_calls: bool = True  # False: the tools stay declared but the model must answer


@dataclass
class ProviderResponse:
    text: str
    model: str
    input_tokens: int | None = None
    cached_tokens: int | None = None
    output_tokens: int | None = None
    finish_reason: str | None = None
    tool_calls: list[dict[str, Any]] = field(default_factory=list)


@dataclass
class LlmResult:
    parsed: Any
    text: str
    model: str
    input_tokens: int | None
    cached_tokens: int | None
    output_tokens: int | None
    cost_estimate_usd: float | None
    cached: bool
    llm_call_id: int | None
    input_hash: str
    tool_calls: list[dict[str, Any]] = field(default_factory=list)


class Provider(Protocol):
    name: str

    def complete(
        self,
        *,
        model: str,
        system: str,
        user: str,
        schema: dict[str, Any] | None,
        schema_name: str,
        temperature: float,
        max_output_tokens: int,
        timeout: float,
        history: tuple[dict[str, Any], ...] = (),
        tools: tuple[dict[str, Any], ...] = (),
        allow_tool_calls: bool = True,
    ) -> ProviderResponse: ...


class OpenAIProvider:
    """OpenAI chat completions with JSON-schema structured outputs."""

    name = "openai"

    def __init__(self, api_key: str, base_url: str | None = None) -> None:
        from openai import OpenAI

        self._client = OpenAI(api_key=api_key, base_url=base_url)

    def complete(
        self,
        *,
        model: str,
        system: str,
        user: str,
        schema: dict[str, Any] | None,
        schema_name: str,
        temperature: float,
        max_output_tokens: int,
        timeout: float,
        history: tuple[dict[str, Any], ...] = (),
        tools: tuple[dict[str, Any], ...] = (),
        allow_tool_calls: bool = True,
    ) -> ProviderResponse:
        import openai

        messages: list[dict[str, Any]] = [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ]
        for turn in history:
            if turn.get("tool_calls"):
                turn = {
                    "role": "assistant",
                    "content": turn.get("content") or None,
                    "tool_calls": [
                        {
                            "id": c["id"],
                            "type": "function",
                            "function": {
                                "name": c["name"],
                                "arguments": json.dumps(c["arguments"] or {}),
                            },
                        }
                        for c in turn["tool_calls"]
                    ],
                }
            messages.append(turn)
        kwargs: dict[str, Any] = {
            "model": model,
            "messages": messages,
            "max_completion_tokens": max_output_tokens,
            "timeout": timeout,
        }
        if tools:
            kwargs["tools"] = [
                {
                    "type": "function",
                    "function": {
                        "name": t["name"],
                        "description": t["description"],
                        "parameters": t["input_schema"],
                    },
                }
                for t in tools
            ]
            if not allow_tool_calls:
                kwargs["tool_choice"] = "none"
        if temperature is not None:
            kwargs["temperature"] = temperature
        if schema is not None:
            kwargs["response_format"] = {
                "type": "json_schema",
                "json_schema": {"name": schema_name, "schema": schema, "strict": True},
            }
        try:
            resp = self._client.chat.completions.create(**kwargs)
        except (openai.RateLimitError, openai.APITimeoutError, openai.APIConnectionError) as exc:
            raise LlmRetryableError(str(exc)) from exc
        except openai.APIStatusError as exc:
            if exc.status_code >= 500:
                raise LlmRetryableError(str(exc)) from exc
            raise LlmError(str(exc)) from exc
        choice = resp.choices[0]
        usage = getattr(resp, "usage", None)
        details = getattr(usage, "prompt_tokens_details", None) if usage else None
        return ProviderResponse(
            text=choice.message.content or "",
            model=getattr(resp, "model", model) or model,
            input_tokens=getattr(usage, "prompt_tokens", None) if usage else None,
            cached_tokens=getattr(details, "cached_tokens", None) if details else None,
            output_tokens=getattr(usage, "completion_tokens", None) if usage else None,
            finish_reason=getattr(choice, "finish_reason", None),
            tool_calls=[
                {
                    "id": c.id,
                    "name": c.function.name,
                    "arguments": _json_object(c.function.arguments),
                }
                for c in (choice.message.tool_calls or [])
            ],
        )


def _json_object(text: str) -> dict[str, Any] | None:
    """Tool arguments as a dict; None when the model wrote something else."""
    try:
        value = json.loads(text or "{}")
    except json.JSONDecodeError:
        return None
    return value if isinstance(value, dict) else None


class FakeProvider:
    """Deterministic provider for tests and dry runs. ``responder`` maps a request to JSON, or
    to a ``ProviderResponse`` when the test needs tool calls."""

    name = "fake"

    def __init__(
        self, responder: Callable[[dict[str, Any]], Any], model: str = "fake-model"
    ) -> None:
        self._responder = responder
        self.model = model
        self.calls: list[dict[str, Any]] = []

    def complete(self, **kwargs: Any) -> ProviderResponse:
        self.calls.append(kwargs)
        payload = self._responder(kwargs)
        if isinstance(payload, ProviderResponse):
            return payload
        text = payload if isinstance(payload, str) else json.dumps(payload, ensure_ascii=False)
        return ProviderResponse(
            text=text,
            model=self.model,
            input_tokens=len(kwargs.get("system", "")) // 4 + len(kwargs.get("user", "")) // 4,
            cached_tokens=0,
            output_tokens=len(text) // 4,
            finish_reason="stop",
        )


def make_provider(settings: Settings | None = None) -> Provider:
    settings = settings or get_settings()
    if settings.llm_provider == "openai":
        if not settings.openai_api_key:
            raise LlmError("TRACEPOINT_OPENAI_API_KEY is not set; use --dry-run or a FakeProvider")
        # An empty TRACEPOINT_OPENAI_BASE_URL= line in .env arrives as "", which the client
        # would take literally; treat it as unset.
        return OpenAIProvider(settings.openai_api_key, settings.openai_base_url or None)
    raise LlmError(f"unknown LLM provider {settings.llm_provider!r}")


_fence_re = re.compile(r"^```(?:json)?\s*|\s*```$", re.MULTILINE)


def _strip_fences(text: str) -> str:
    return _fence_re.sub("", text.strip()).strip()


class LlmGateway:
    def __init__(
        self,
        session: Session,
        provider: Provider,
        run_id: str | None,
        settings: Settings | None = None,
    ) -> None:
        self.session = session
        self.provider = provider
        self.run_id = run_id
        self.settings = settings or get_settings()
        self.spent_usd = 0.0

    # ---- helpers ------------------------------------------------------------------------------

    def resolve_model(self, req: LlmRequest) -> str:
        if req.model:
            return req.model
        if req.tier == "bulk" and self.settings.openai_model_bulk:
            return self.settings.openai_model_bulk
        if isinstance(self.provider, FakeProvider):
            return self.provider.model
        if not self.settings.openai_model:
            raise LlmError(
                "no model configured (TRACEPOINT_OPENAI_MODEL / TRACEPOINT_OPENAI_MODEL_BULK)"
            )
        return self.settings.openai_model

    def input_hash(self, req: LlmRequest, model: str, schema: dict[str, Any] | None) -> str:
        payload = {
            "provider": self.provider.name,
            "model": model,
            "prompt_version": req.prompt_version,
            "system": req.system,
            "user": req.user,
            "schema": schema,
            "temperature": req.temperature
            if req.temperature is not None
            else self.settings.llm_temperature,
        }
        if req.history or req.tools:  # only then, so the hashes of plain requests stay the same
            payload["history"] = list(req.history)
            payload["tools"] = list(req.tools)
            payload["allow_tool_calls"] = req.allow_tool_calls
        return hashlib.sha256(
            json.dumps(payload, sort_keys=True, ensure_ascii=False).encode("utf-8")
        ).hexdigest()

    def cached_call(self, input_hash: str) -> LlmCall | None:
        return self.session.scalar(
            select(LlmCall)
            .where(LlmCall.input_hash == input_hash, LlmCall.status == "ok")
            .order_by(LlmCall.id.desc())
        )

    def run_spent_usd(self) -> float:
        if self.run_id is None:
            return self.spent_usd
        total = self.session.scalar(
            select(func.coalesce(func.sum(LlmCall.cost_estimate_usd), 0.0)).where(
                LlmCall.run_id == self.run_id
            )
        )
        return float(total or 0.0)

    def day_spent_usd(self) -> float:
        total = self.session.scalar(
            select(func.coalesce(func.sum(LlmCall.cost_estimate_usd), 0.0)).where(
                LlmCall.created_at >= datetime.now(UTC) - timedelta(hours=24)
            )
        )
        return float(total or 0.0)

    def _parse(self, text: str, schema_model: type[T] | None) -> Any:
        clean = _strip_fences(text)
        if schema_model is None:
            return clean
        try:
            return schema_model.model_validate_json(clean)
        except ValidationError as exc:
            raise LlmSchemaError(str(exc)[:1500]) from exc

    def _record(
        self,
        req: LlmRequest,
        model: str,
        input_hash: str,
        resp: ProviderResponse | None,
        *,
        status: str,
        error: str | None,
        latency_ms: int,
        attempts: int,
    ) -> LlmCall:
        cost = (
            estimate_cost_usd(resp.model, resp.input_tokens, resp.cached_tokens, resp.output_tokens)
            if resp is not None
            else None
        )
        row = LlmCall(
            run_id=self.run_id,
            purpose=req.purpose,
            provider=self.provider.name,
            model=resp.model if resp else model,
            prompt_version=req.prompt_version,
            input_hash=input_hash,
            input_tokens=resp.input_tokens if resp else None,
            cached_tokens=resp.cached_tokens if resp else None,
            output_tokens=resp.output_tokens if resp else None,
            cost_estimate_usd=cost,
            request={
                "system": req.system,
                "user": req.user,
                "schema_name": req.schema_name,
                "metadata": req.metadata,
                "history": list(req.history),
                "tools": [t["name"] for t in req.tools],
            },
            response={
                "text": resp.text,
                "finish_reason": resp.finish_reason,
                "tool_calls": resp.tool_calls,
            }
            if resp
            else None,
            status=status,
            error=error,
            latency_ms=latency_ms,
            attempts=attempts,
            created_at=datetime.now(UTC),
        )
        self.session.add(row)
        self.session.flush()
        if cost:
            self.spent_usd += cost
        return row

    # ---- public API ---------------------------------------------------------------------------

    def complete(
        self, req: LlmRequest, schema_model: type[T] | None = None, *, use_cache: bool = True
    ) -> LlmResult:
        model = self.resolve_model(req)
        schema = to_strict_schema(schema_model) if schema_model is not None else None
        ihash = self.input_hash(req, model, schema)
        if use_cache:
            hit = self.cached_call(ihash)
            if hit is not None and hit.response:
                tool_calls = hit.response.get("tool_calls") or []
                return LlmResult(
                    tool_calls=tool_calls,
                    parsed=None if tool_calls else self._parse(hit.response["text"], schema_model),
                    text=hit.response["text"],
                    model=hit.model,
                    input_tokens=hit.input_tokens,
                    cached_tokens=hit.cached_tokens,
                    output_tokens=hit.output_tokens,
                    cost_estimate_usd=hit.cost_estimate_usd,
                    cached=True,
                    llm_call_id=hit.id,
                    input_hash=ihash,
                )
        resp = self._billed_call(req, model, schema, ihash)
        parsed = None
        attempts_total = 1
        try:
            parsed = self._parse_billed(req, model, ihash, resp, schema_model)
        except LlmSchemaError as exc:
            # one repair attempt with the validation error sent back as the latest user text
            note = f"The previous answer was not valid for the schema ({exc}). Return only valid JSON for the schema."
            repair = (
                replace(req, history=(*req.history, {"role": "user", "content": note}))
                if req.history
                else replace(req, user=f"{req.user}\n\n{note}")
            )
            resp = self._billed_call(repair, model, schema, ihash)
            parsed = self._parse_billed(repair, model, ihash, resp, schema_model)
            attempts_total = 2
        latency = int(resp.__dict__.get("_latency_ms", 0))
        row = self._record(
            req,
            model,
            ihash,
            resp,
            status="ok",
            error=None,
            latency_ms=latency,
            attempts=attempts_total,
        )
        return LlmResult(
            parsed=parsed,
            text=resp.text,
            model=resp.model,
            input_tokens=resp.input_tokens,
            cached_tokens=resp.cached_tokens,
            output_tokens=resp.output_tokens,
            cost_estimate_usd=row.cost_estimate_usd,
            cached=False,
            llm_call_id=row.id,
            input_hash=ihash,
            tool_calls=resp.tool_calls,
        )

    def complete_many(
        self,
        requests: list[LlmRequest],
        schema_model: type[T] | None = None,
        *,
        concurrency: int | None = None,
    ) -> list[LlmResult | Exception]:
        """Run many requests: cache lookups and logging in this thread, provider calls in a pool."""
        concurrency = concurrency or self.settings.llm_concurrency
        results: list[LlmResult | Exception | None] = [None] * len(requests)
        todo: list[tuple[int, LlmRequest, str, dict[str, Any] | None, str]] = []
        for i, req in enumerate(requests):
            try:
                model = self.resolve_model(req)
                schema = to_strict_schema(schema_model) if schema_model is not None else None
                ihash = self.input_hash(req, model, schema)
                hit = self.cached_call(ihash)
                if hit is not None and hit.response:
                    results[i] = LlmResult(
                        parsed=self._parse(hit.response["text"], schema_model),
                        text=hit.response["text"],
                        model=hit.model,
                        input_tokens=hit.input_tokens,
                        cached_tokens=hit.cached_tokens,
                        output_tokens=hit.output_tokens,
                        cost_estimate_usd=hit.cost_estimate_usd,
                        cached=True,
                        llm_call_id=hit.id,
                        input_hash=ihash,
                    )
                else:
                    todo.append((i, req, model, schema, ihash))
            except LlmError as exc:
                results[i] = exc

        def work(
            item: tuple[int, LlmRequest, str, dict[str, Any] | None, str],
        ) -> tuple[int, ProviderResponse | Exception]:
            i, req, model, schema, _ = item
            try:
                return i, self._call_with_retries(req, model, schema, None)
            except Exception as exc:  # noqa: BLE001 - surfaced per item
                return i, exc

        with ThreadPoolExecutor(max_workers=max(1, concurrency)) as pool:
            responses = list(pool.map(work, todo))
        by_index = {i: r for i, r in responses}
        for i, req, model, _schema, ihash in todo:
            resp = by_index[i]
            if isinstance(resp, Exception):
                self._record(
                    req,
                    model,
                    ihash,
                    getattr(resp, "response", None),
                    status="error",
                    error=str(resp)[:2000],
                    latency_ms=0,
                    attempts=self.settings.llm_max_attempts,
                )
                results[i] = resp if isinstance(resp, LlmError) else LlmError(str(resp))
                continue
            try:
                parsed = self._parse(resp.text, schema_model)
            except LlmSchemaError as exc:
                self._record(
                    req,
                    model,
                    ihash,
                    resp,
                    status="error",
                    error=str(exc),
                    latency_ms=int(resp.__dict__.get("_latency_ms", 0)),
                    attempts=1,
                )
                results[i] = exc
                continue
            row = self._record(
                req,
                model,
                ihash,
                resp,
                status="ok",
                error=None,
                latency_ms=int(resp.__dict__.get("_latency_ms", 0)),
                attempts=1,
            )
            results[i] = LlmResult(
                parsed=parsed,
                text=resp.text,
                model=resp.model,
                input_tokens=resp.input_tokens,
                cached_tokens=resp.cached_tokens,
                output_tokens=resp.output_tokens,
                cost_estimate_usd=row.cost_estimate_usd,
                cached=False,
                llm_call_id=row.id,
                input_hash=ihash,
            )
        return [r if r is not None else LlmError("unprocessed request") for r in results]

    # ---- internals ----------------------------------------------------------------------------

    def _parse_billed(
        self,
        req: LlmRequest,
        model: str,
        ihash: str,
        resp: ProviderResponse,
        schema_model: type[T] | None,
    ) -> Any:
        """Parse an answer; one that is invalid for the schema was billed all the same and is
        logged with its cost before the error goes on (first answer and repair alike)."""
        if resp.tool_calls:  # a turn that calls tools carries no answer to parse yet
            return None
        try:
            return self._parse(resp.text, schema_model)
        except LlmSchemaError as exc:
            self._record(
                req, model, ihash, resp, status="error", error=str(exc), latency_ms=0, attempts=1
            )
            raise

    def _billed_call(
        self, req: LlmRequest, model: str, schema: dict[str, Any] | None, ihash: str
    ) -> ProviderResponse:
        """Provider call whose unusable but billed answer is logged before the error goes on."""
        try:
            return self._call_with_retries(req, model, schema, ihash)
        except LlmError as exc:
            if exc.response is not None:
                self._record(
                    req,
                    model,
                    ihash,
                    exc.response,
                    status="error",
                    error=str(exc),
                    latency_ms=0,
                    attempts=1,
                )
            raise

    def _call_with_retries(
        self, req: LlmRequest, model: str, schema: dict[str, Any] | None, ihash: str | None
    ) -> ProviderResponse:
        cap = self.settings.llm_max_cost_usd_per_run
        day_cap = self.settings.llm_max_cost_usd_per_day
        if (
            (cap or day_cap)
            and not isinstance(self.provider, FakeProvider)
            and estimate_cost_usd(model, 0, 0, 0) is None
        ):
            raise LlmError(
                f"model {model!r} has no price in config/llm/pricing.yaml, so the cost caps "
                "cannot count it; add its price or set both caps to 0"
            )
        if cap and self.run_spent_usd() >= cap:
            raise LlmBudgetExceeded(f"run cost cap of USD {cap} reached")
        if day_cap and self.day_spent_usd() >= day_cap:
            raise LlmBudgetExceeded(
                f"cost cap of USD {day_cap} per 24 hours reached "
                "(TRACEPOINT_LLM_MAX_COST_USD_PER_DAY)"
            )
        temperature = (
            req.temperature if req.temperature is not None else self.settings.llm_temperature
        )
        last_error: Exception | None = None
        for attempt in range(1, self.settings.llm_max_attempts + 1):
            started = time.monotonic()
            try:
                resp = self.provider.complete(
                    model=model,
                    system=req.system,
                    user=req.user,
                    schema=schema,
                    schema_name=req.schema_name,
                    temperature=temperature,
                    max_output_tokens=req.max_output_tokens,
                    timeout=self.settings.llm_timeout_seconds,
                    history=req.history,
                    tools=req.tools,
                    allow_tool_calls=req.allow_tool_calls,
                )
                resp.__dict__["_latency_ms"] = int((time.monotonic() - started) * 1000)
                if resp.finish_reason == "length":
                    exc = LlmError("provider answer truncated (max_output_tokens too small)")
                    exc.response = resp  # billed all the same: the caller logs it with its cost
                    raise exc
                return resp
            except LlmRetryableError as exc:
                last_error = exc
                time.sleep(min(30.0, 2.0**attempt))
        raise LlmError(
            f"provider failed after {self.settings.llm_max_attempts} attempts: {last_error}"
        )
