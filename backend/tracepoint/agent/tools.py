"""Drill-down tools for the agents (WP1.9). Each tool takes validated arguments, returns compact
rows with evidence references, and is logged as an audit event so that agent citations can be
traced back to the call that produced them.

``TOOLS`` maps a tool name to (argument model, function, description); ``tool_schemas()`` gives
the JSON schemas an LLM needs and ``call_tool`` is the single entry point an agent loop uses.
"""

from __future__ import annotations

from collections.abc import Callable
from typing import Any, Literal

from pydantic import BaseModel, Field
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from tracepoint.agent.context_pack import build_context_pack
from tracepoint.api import app as api
from tracepoint.core.audit import record_event
from tracepoint.db.models import (
    Finding,
    TaxonomyLevel2,
    TaxonomyLevel3,
    Verbatim,
    VerbatimClassification,
)

Vehicle = Literal["F70", "G60", "G68", "G70"]
MarketCode = Literal["EU", "US", "CN", "RoW"]
FeedbackType = Literal["Likes", "Difficult to Use", "Defect", "Wants"]


def _compact_verbatims(session: Session, rows: list[Verbatim]) -> list[dict[str, Any]]:
    if not rows:
        return []
    l2 = {t.id: t.name for t in session.scalars(select(TaxonomyLevel2))}
    l3 = {t.id: t.name for t in session.scalars(select(TaxonomyLevel3))}
    labels: dict[str, list[str]] = {}
    for c in session.scalars(
        select(VerbatimClassification).where(
            VerbatimClassification.verbatim_id.in_([v.id for v in rows]),
            VerbatimClassification.status == "canonical",
        )
    ):
        labels.setdefault(c.verbatim_id, []).append(
            f"{c.feedback_type} | {l2.get(c.level2_id)} | {l3.get(c.level3_id)}"
        )
    return [
        {
            "evidence_ref": f"verbatim:{v.id}",
            "market": v.market_code,
            "country": v.country_code,
            "powertrain": v.powertrain,
            "source": v.source_label,
            "text": v.text if v.char_len <= 600 else v.text[:600] + " …",
            "labels": labels.get(v.id, []),
        }
        for v in rows
    ]


# ---- tools -------------------------------------------------------------------------------------


class SearchEvidenceArgs(BaseModel):
    query: str = Field(description="Free text, e.g. 'charging port flap stuck in cold weather'")
    vehicle: Vehicle | None = None
    market: MarketCode | None = None
    powertrain: str | None = Field(None, description="e.g. BEV, PHEV, ICE")
    feedback_type: FeedbackType | None = None
    domain: str | None = Field(None, description="Vehicle domain key, e.g. interior_comfort")
    limit: int = Field(10, ge=1, le=50)


def search_evidence(session: Session, a: SearchEvidenceArgs) -> dict[str, Any]:
    """Ranked full-text search over verbatims with SQL filters."""
    # ponytail: lexical ranking (PostgreSQL full-text, GIN index); add embedding similarity
    # here once the embedding model is named (D-020), the arguments stay the same.
    # any word may match, more matching words rank higher; quoted phrases stay phrases
    tsq = func.websearch_to_tsquery("english", " or ".join(a.query.split()))
    vec = func.to_tsvector(text("'english'"), Verbatim.text)
    stmt = select(Verbatim).where(vec.op("@@")(tsq))
    for col, val in (
        (Verbatim.vehicle_code, a.vehicle),
        (Verbatim.market_code, a.market),
        (Verbatim.powertrain, a.powertrain),
    ):
        if val:
            stmt = stmt.where(col == val)
    if a.feedback_type or a.domain:
        sub = select(VerbatimClassification.verbatim_id).where(
            VerbatimClassification.status == "canonical"
        )
        if a.feedback_type:
            sub = sub.where(VerbatimClassification.feedback_type == a.feedback_type)
        if a.domain:
            sub = sub.join(TaxonomyLevel2, TaxonomyLevel2.id == VerbatimClassification.level2_id)
            sub = sub.where(TaxonomyLevel2.domain_key == a.domain)
        stmt = stmt.where(Verbatim.id.in_(sub))
    total = session.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = session.scalars(
        stmt.order_by(func.ts_rank(vec, tsq, 1).desc(), Verbatim.id).limit(a.limit)
    ).all()
    return {"total": total, "items": _compact_verbatims(session, list(rows))}


class VerbatimsByThemeArgs(BaseModel):
    vehicle: Vehicle
    theme: str = Field(description="Exact level-2 theme name, e.g. 'Electric Range'")
    market: MarketCode | None = None
    feedback_type: FeedbackType | None = None
    limit: int = Field(20, ge=1, le=100)


def get_verbatims_by_theme(session: Session, a: VerbatimsByThemeArgs) -> dict[str, Any]:
    """Verbatims carrying a canonical label of one level-2 theme."""
    theme = session.scalar(
        select(TaxonomyLevel2).where(func.lower(TaxonomyLevel2.name) == a.theme.lower())
    )
    if theme is None:
        return {"error": f"unknown theme {a.theme!r}; use the names from the context pack"}
    sub = select(VerbatimClassification.verbatim_id).where(
        VerbatimClassification.level2_id == theme.id, VerbatimClassification.status == "canonical"
    )
    if a.feedback_type:
        sub = sub.where(VerbatimClassification.feedback_type == a.feedback_type)
    stmt = select(Verbatim).where(Verbatim.vehicle_code == a.vehicle, Verbatim.id.in_(sub))
    if a.market:
        stmt = stmt.where(Verbatim.market_code == a.market)
    total = session.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = session.scalars(stmt.order_by(Verbatim.id).limit(a.limit)).all()
    return {
        "theme": theme.name,
        "domain": theme.domain_key,
        "total": total,
        "items": _compact_verbatims(session, list(rows)),
    }


class MetricArgs(BaseModel):
    vehicle: Vehicle
    market: MarketCode | None = None
    attribute: str | None = Field(None, description="Substring of the study attribute name")
    domain: str | None = None


def get_metric(session: Session, a: MetricArgs) -> dict[str, Any]:
    """Customer-study metrics (means or distributions) with evidence references."""
    rows = api.studies(vehicle=a.vehicle, market=a.market, study=None, session=session)
    rows = [
        {
            k: r[k]
            for k in (
                "evidence_ref",
                "market_code",
                "study",
                "attribute_raw",
                "domain_key",
                "stat_kind",
                "mean",
                "distribution",
                "scale_note",
            )
        }
        for r in rows
        if (not a.attribute or a.attribute.lower() in r["attribute_raw"].lower())
        and (not a.domain or r["domain_key"] == a.domain)
    ]
    return {"total": len(rows), "items": rows}


class EquipmentArgs(BaseModel):
    vehicle: Vehicle
    query: str | None = Field(None, description="Substring of the German or English item name")
    group: str | None = None
    domain: str | None = None
    limit: int = Field(30, ge=1, le=200)


def get_equipment(session: Session, a: EquipmentArgs) -> dict[str, Any]:
    """Catalogue items with price and standard / optional / not-available status per variant."""
    rows = api.equipment(vehicle=a.vehicle, group=a.group, q=a.query, session=session)
    rows = [
        {
            k: r[k]
            for k in (
                "evidence_ref",
                "sa_code",
                "name_en",
                "group_key",
                "domain_key",
                "price_eur",
                "availability",
            )
        }
        for r in rows
        if not a.domain or r["domain_key"] == a.domain
    ]
    return {"total": len(rows), "items": rows[: a.limit]}


class SalesArgs(BaseModel):
    vehicle: Vehicle
    market: MarketCode | None = None


def get_sales(session: Session, a: SalesArgs) -> dict[str, Any]:
    """Sales volumes per market and year (2030 is a plan figure)."""
    rows = api.sales(vehicle=a.vehicle, session=session)
    rows = [
        {k: r[k] for k in ("evidence_ref", "market_code", "year", "units", "kind", "note")}
        for r in rows
        if not a.market or r["market_code"] == a.market
    ]
    return {"total": len(rows), "items": rows}


class FindingsArgs(BaseModel):
    vehicle: Vehicle
    market: MarketCode | None = None
    domain: str | None = None
    kind: str | None = Field(None, description="e.g. recurring_complaint, unmet_need, metric_gap")
    limit: int = Field(20, ge=1, le=100)


def get_findings(session: Session, a: FindingsArgs) -> dict[str, Any]:
    """Extracted findings; drill into one with the API route /findings/{id} for its evidence."""
    stmt = select(Finding).where(Finding.vehicle_code == a.vehicle, Finding.status != "withdrawn")
    for col, val in (
        (Finding.market_code, a.market),
        (Finding.domain_key, a.domain),
        (Finding.kind, a.kind),
    ):
        if val:
            stmt = stmt.where(col == val)
    rows = session.scalars(
        stmt.order_by(Finding.evidence_level, Finding.severity_score.desc().nulls_last()).limit(
            a.limit
        )
    ).all()
    return {
        "items": [
            {
                "id": f.id,
                "kind": f.kind,
                "layer": f.layer,
                "domain": f.domain_key,
                "title": f.title,
                "statement": f.statement,
                "evidence_level": f.evidence_level,
                "evidence_count": f.evidence_count,
                "quantification": f.quantification,
            }
            for f in rows
        ]
    }


class RequirementsArgs(BaseModel):
    vehicle: Vehicle | None = None
    market: MarketCode | None = None
    domain: str | None = None
    status: Literal["proposed", "approved", "rejected", "deferred"] | None = None


def get_requirements(session: Session, a: RequirementsArgs) -> dict[str, Any]:
    """Derived requirements with acceptance criteria, linked findings and decision status."""
    from tracepoint.requirements.report import list_requirements

    rows = [
        r
        for r in list_requirements(session, a.vehicle, a.market)
        if (not a.domain or r["domain"] == a.domain) and (not a.status or r["status"] == a.status)
    ]
    return {"total": len(rows), "items": rows}


class ContextPackArgs(BaseModel):
    vehicle: Vehicle
    market: MarketCode | None = None


def get_context_pack(session: Session, a: ContextPackArgs) -> dict[str, Any]:
    """Compact overview of one vehicle × market; the starting point before drilling down."""
    return build_context_pack(session, a.vehicle, a.market)


TOOLS: dict[str, tuple[type[BaseModel], Callable[[Session, Any], dict[str, Any]]]] = {
    "get_context_pack": (ContextPackArgs, get_context_pack),
    "search_evidence": (SearchEvidenceArgs, search_evidence),
    "get_verbatims_by_theme": (VerbatimsByThemeArgs, get_verbatims_by_theme),
    "get_metric": (MetricArgs, get_metric),
    "get_equipment": (EquipmentArgs, get_equipment),
    "get_sales": (SalesArgs, get_sales),
    "get_findings": (FindingsArgs, get_findings),
    "get_requirements": (RequirementsArgs, get_requirements),
}


def tool_schemas() -> list[dict[str, Any]]:
    """Name, description and JSON input schema per tool (provider-neutral)."""
    return [
        {
            "name": name,
            "description": (fn.__doc__ or "").strip(),
            "input_schema": model.model_json_schema(),
        }
        for name, (model, fn) in TOOLS.items()
    ]


def _refs(result: dict[str, Any]) -> list[str]:
    return [r["evidence_ref"] for r in result.get("items", []) if "evidence_ref" in r][:50]


def call_tool(
    session: Session,
    name: str,
    args: dict[str, Any],
    *,
    actor_id: str = "agent:unknown",
    run_id: str | None = None,
) -> dict[str, Any]:
    """Validate the arguments, run the tool and log the call. Raises KeyError / ValidationError
    on an unknown tool or bad arguments so the agent loop can report them back to the model."""
    model, fn = TOOLS[name]
    parsed = model.model_validate(args)
    result = fn(session, parsed)
    record_event(
        session,
        actor_type="agent",
        actor_id=actor_id,
        action="tool.called",
        entity_type="tool",
        entity_id=name,
        run_id=run_id,
        after={
            "args": parsed.model_dump(exclude_none=True),
            "total": result.get("total"),
            "evidence_refs": _refs(result),
        },
    )
    session.flush()
    return result
