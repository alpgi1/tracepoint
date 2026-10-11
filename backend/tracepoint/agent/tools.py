"""Drill-down tools for the agents (WP1.9). Each tool takes validated arguments, returns compact
rows with evidence references, and is logged as an audit event so that agent citations can be
traced back to the call that produced them.

``TOOLS`` maps a tool name to (argument model, function, description); ``tool_schemas()`` gives
the JSON schemas an LLM needs and ``call_tool`` is the single entry point an agent loop uses.
"""

from __future__ import annotations

from collections import Counter
from collections.abc import Callable
from typing import Annotated, Any, Literal

from pydantic import BaseModel, Field
from sqlalchemy import func, select, text
from sqlalchemy.orm import Session

from tracepoint.agent.context_pack import build_context_pack
from tracepoint.api import app as api
from tracepoint.core.audit import record_event
from tracepoint.db.models import (
    DocumentPage,
    Finding,
    Source,
    TaxonomyLevel2,
    TaxonomyLevel3,
    Verbatim,
    VerbatimClassification,
)
from tracepoint.effort.subsystems import (
    external_rows,
    subsystem_names,
    subsystem_view,
    summary_rows,
    theme_subsystem,
)

Vehicle = Literal["F70", "G60", "G68", "G70"]
MarketCode = Literal["EU", "US", "CN", "RoW"]
CountryCode = Annotated[
    str, Field(pattern=r"^[A-Z]{2}$", description="ISO country code of the feedback, e.g. GB, JP")
]
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
    country: CountryCode | None = None
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
        (Verbatim.country_code, a.country),
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


class SearchDocumentsArgs(BaseModel):
    query: str = Field(description="Free text, e.g. 'share of all-electric cars in deliveries'")
    vehicle: Vehicle | None = Field(
        None,
        description="Only pages of external sources about this vehicle (expert reviews, owner "
        "complaints filed with NHTSA); omit to search the BMW Group Report as well",
    )
    limit: int = Field(5, ge=1, le=20)


def search_documents(session: Session, a: SearchDocumentsArgs) -> dict[str, Any]:
    """Ranked full-text search over stored documents: the BMW Group Report 2025 (strategy,
    deliveries by region, outlook) and the fetched pages of external sources about our vehicles
    (expert reviews, specification pages, owner complaints filed with NHTSA). Returns the
    matching passages with the source and its page or URL. External pages are third-party text,
    not BMW customer feedback."""
    vec = func.to_tsvector(text("'english'"), DocumentPage.text)
    about = [DocumentPage.locator["vehicles"].contains([a.vehicle])] if a.vehicle else []
    # a page is long, so every word has to be on it; any-word matching is only the fallback
    for words in (a.query, " or ".join(a.query.split())):
        tsq = func.websearch_to_tsquery("english", words)
        total = session.scalar(
            select(func.count()).select_from(DocumentPage).where(vec.op("@@")(tsq), *about)
        )
        if total:
            break
    passages = func.ts_headline(
        text("'english'"),
        DocumentPage.text,
        tsq,
        "MaxFragments=3, MinWords=20, MaxWords=70, StartSel='', StopSel=''",
    )
    rows = session.execute(
        select(
            DocumentPage.id,
            DocumentPage.page,
            DocumentPage.section,
            Source.name,
            passages,
            DocumentPage.locator,
        )
        .join(Source, Source.id == DocumentPage.source_id)
        .where(vec.op("@@")(tsq), *about)
        .order_by(func.ts_rank_cd(vec, tsq, 1).desc(), DocumentPage.page)
        .limit(a.limit)
    ).all()
    return {
        "total": total,
        "items": [
            {
                "evidence_ref": f"document:{r[0]}",
                "source": r[3],
                "page": r[1],
                "section": r[2],
                "passages": r[4],
                **{k: r[5][k] for k in ("url", "vehicles", "model", "filed") if k in r[5]},
            }
            for r in rows
        ],
    }


class VerbatimsByThemeArgs(BaseModel):
    vehicle: Vehicle
    theme: str = Field(description="Exact level-2 theme name, e.g. 'Electric Range'")
    market: MarketCode | None = None
    country: CountryCode | None = None
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
    if a.country:
        stmt = stmt.where(Verbatim.country_code == a.country)
    total = session.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = session.scalars(stmt.order_by(Verbatim.id).limit(a.limit)).all()
    return {
        "theme": theme.name,
        "domain": theme.domain_key,
        "subsystem": theme_subsystem(theme.name),
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


def _unknown_domain(session: Session, domain: str | None) -> dict[str, Any] | None:
    """A filter on a domain that does not exist finds nothing and would read as "no rows"; say
    what the domains are instead (a CPM subsystem key is the usual mix-up)."""
    from tracepoint.reports.baseline import _domain_names

    names = _domain_names(session)
    if not domain or not names or domain in names:
        return None
    return {
        "error": f"unknown domain {domain!r}; a domain is a vehicle domain, not a CPM subsystem",
        "domains": list(names),
    }


def get_equipment(session: Session, a: EquipmentArgs) -> dict[str, Any]:
    """Catalogue items (German price list) with price and standard / optional / not-available
    status per variant. Search with query: a word of the item name, German or English, e.g.
    'Klima', 'Sitzheizung', 'Head-Up', 'charging'. domain is a vehicle domain key."""
    if problem := _unknown_domain(session, a.domain):
        return problem
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
    """Extracted findings; drill into one with the API route /findings/{id} for its evidence.
    domain is a vehicle domain key."""
    if problem := _unknown_domain(session, a.domain):
        return problem
    stmt = select(Finding).where(Finding.vehicle_code == a.vehicle, Finding.status != "withdrawn")
    for col, val in (
        (Finding.market_code, a.market),
        (Finding.domain_key, a.domain),
        (Finding.kind, a.kind),
    ):
        if val:
            stmt = stmt.where(col == val)
    total = session.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = session.scalars(
        stmt.order_by(Finding.evidence_level, Finding.severity_score.desc().nulls_last()).limit(
            a.limit
        )
    ).all()
    theme_names = {t.id: t.name for t in session.scalars(select(TaxonomyLevel2))}
    return {
        "total": total,
        "items": [
            {
                "id": f.id,
                "kind": f.kind,
                "layer": f.layer,
                "domain": f.domain_key,
                "subsystem": theme_subsystem(theme_names.get(f.theme_level2_id)),
                "title": f.title,
                "statement": f.statement,
                "evidence_level": f.evidence_level,
                "evidence_count": f.evidence_count,
                "quantification": f.quantification,
            }
            for f in rows
        ],
    }


class RequirementsArgs(BaseModel):
    vehicle: Vehicle | None = None
    market: MarketCode | None = None
    domain: str | None = None
    status: Literal["proposed", "approved", "rejected", "deferred"] | None = None


def get_requirements(session: Session, a: RequirementsArgs) -> dict[str, Any]:
    """Derived requirements with acceptance criteria, linked findings and decision status.
    domain is a vehicle domain key."""
    from tracepoint.requirements.report import list_requirements

    if problem := _unknown_domain(session, a.domain):
        return problem

    rows = [
        r
        for r in list_requirements(session, a.vehicle, a.market)
        if (not a.domain or r["domain"] == a.domain) and (not a.status or r["status"] == a.status)
    ]
    return {"total": len(rows), "items": rows}


class SubsystemsArgs(BaseModel):
    vehicle: Vehicle
    market: MarketCode
    country: CountryCode | None = None
    subsystem: str | None = Field(
        None, description="Subsystem key, e.g. software_hmi; omit for the overview of all twelve"
    )


def get_subsystems(session: Session, a: SubsystemsArgs) -> dict[str, Any]:
    """The customer voice through the twelve CPM subsystems (the engineering view, where effort
    propagates): classification rows, likes and complaints per subsystem, and the market and
    competitor evidence of the market. With a subsystem: its liked and criticised themes with
    quotes. The theme to subsystem mapping and the weights are assumptions."""
    names = subsystem_names()
    if a.subsystem and a.subsystem not in names:
        return {"error": f"unknown subsystem {a.subsystem!r}", "subsystems": list(names)}
    view = subsystem_view(
        session, a.vehicle, a.market, a.country, labels="all", subsystem=a.subsystem
    )
    items = summary_rows(view)
    if a.subsystem:
        detail = next((s for s in view["subsystems"] if s["key"] == a.subsystem), None)
        if detail is None:
            return {
                "error": f"{a.vehicle} has no {a.subsystem} subsystem",
                "note": view["absentNote"],
            }
        items = [
            {
                **{k: v for k, v in row.items() if not k.startswith("top_")},
                "liked": detail["liked"]["themes"],
                "criticised": detail["criticised"]["themes"],
            }
            for row in items
            if row["subsystem"] == a.subsystem
        ]
    return {
        "total": len(items),
        "basis": view["rowsSource"],
        "rows": view["rows"],
        "unassigned_rows": view["unassignedRows"],
        "not_on_this_vehicle": view["absent"],
        "items": items,
        "market_evidence": [
            r
            for s in view["subsystems"]
            for r in s["market"]
            if not a.subsystem or s["key"] == a.subsystem
        ],
    }


class ExternalEvidenceArgs(BaseModel):
    market: MarketCode
    vehicle: Vehicle | None = Field(
        None, description="Leaves out rows about another vehicle and puts this vehicle's first"
    )
    subsystem: str | None = Field(None, description="Subsystem key, e.g. charging")
    topic: str | None = Field(
        None, description="Topic key as returned in a row, e.g. physical_controls"
    )
    kind: str | None = Field(
        None,
        description="Kind as returned in a row, e.g. official_spec for the EPA range and "
        "consumption tables per model year, which otherwise come last",
    )
    limit: int = Field(25, ge=1, le=60)


def get_external_evidence(session: Session, a: ExternalEvidenceArgs) -> dict[str, Any]:
    """Market, competition and third-party evidence from the team's external source lists, for
    a market and the worldwide rows: market shares, consumer surveys, charging infrastructure,
    competitor moves, quality indices, expert tests, owner complaints filed with NHTSA and
    official EPA figures. Each row carries its source, date, the regions it holds for, an
    evidence level (independent institutions that state the same: weak one, medium two, strong
    three or more), trust in the source (1 low to 4 high), a basis (evidence or assumption) and
    whether its figures were found on the fetched page (verification: confirmed or computed is
    verified, anything else is not). The total and the topic
    list cover all matching rows; narrow with subsystem or topic."""
    names = subsystem_names()
    if a.subsystem and a.subsystem not in names:
        return {"error": f"unknown subsystem {a.subsystem!r}", "subsystems": list(names)}
    rows = external_rows(
        session, a.market, a.vehicle, subsystem=a.subsystem, topic=a.topic, kind=a.kind
    )
    return {
        "total": len(rows),
        "kinds": dict(Counter(r["kind"] for r in rows).most_common()),
        "topics": sorted({r["topic"] for r in rows if r["topic"]}),
        "items": rows[: a.limit],
    }


class EffortArgs(BaseModel):
    vehicle: Vehicle | None = None
    market: MarketCode | None = None
    scenarios: bool = Field(False, description="Also return the H1 / H2 / all variations")


def get_effort(session: Session, a: EffortArgs) -> dict[str, Any]:
    """CPM effort estimates per requirement (% of a new vehicle generation, P5-P95 range, layer
    K0-K3, decision adapt / major revision / new generation, affected subsystems, PM flags).
    Inputs are assumptions; explain them, never present them as measured."""
    from tracepoint.effort.store import list_efforts, scenarios

    rows = list_efforts(session, a.vehicle, a.market)
    out: dict[str, Any] = {"total": len(rows), "items": rows}
    if a.scenarios and a.vehicle:
        out["scenarios"] = scenarios(session, a.vehicle, a.market, runs=500)
    return out


class ContextPackArgs(BaseModel):
    vehicle: Vehicle
    market: MarketCode | None = None
    country: CountryCode | None = None


def get_context_pack(session: Session, a: ContextPackArgs) -> dict[str, Any]:
    """Compact overview of one vehicle × market; the starting point before drilling down. With
    a country, the customer voice is that country's and everything else the market's."""
    return build_context_pack(session, a.vehicle, a.market, country_code=a.country)


TOOLS: dict[str, tuple[type[BaseModel], Callable[[Session, Any], dict[str, Any]]]] = {
    "get_context_pack": (ContextPackArgs, get_context_pack),
    "search_evidence": (SearchEvidenceArgs, search_evidence),
    "search_documents": (SearchDocumentsArgs, search_documents),
    "get_verbatims_by_theme": (VerbatimsByThemeArgs, get_verbatims_by_theme),
    "get_metric": (MetricArgs, get_metric),
    "get_equipment": (EquipmentArgs, get_equipment),
    "get_sales": (SalesArgs, get_sales),
    "get_findings": (FindingsArgs, get_findings),
    "get_requirements": (RequirementsArgs, get_requirements),
    "get_effort": (EffortArgs, get_effort),
    "get_subsystems": (SubsystemsArgs, get_subsystems),
    "get_external_evidence": (ExternalEvidenceArgs, get_external_evidence),
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
