"""Read API for the evidence store (Phase 1). Every evidence endpoint returns locators."""

from __future__ import annotations

from collections.abc import Iterator
from typing import Any

from fastapi import Depends, FastAPI, HTTPException, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from tracepoint.core.audit import event_to_dict
from tracepoint.db.models import (
    AuditEvent,
    EquipmentAvailability,
    EquipmentItem,
    Finding,
    FindingEvidence,
    FindingLink,
    Market,
    Run,
    SalesVolume,
    StudyMetric,
    TaxonomyLevel2,
    TaxonomyLevel3,
    TechSpec,
    Vehicle,
    VehicleVariant,
    Verbatim,
    VerbatimClassification,
)
from tracepoint.db.session import make_engine

app = FastAPI(
    title="Tracepoint API", version="0.1.0", description="Evidence store read API (Phase 1)."
)

_engine = None


def get_session() -> Iterator[Session]:
    global _engine
    if _engine is None:
        _engine = make_engine()
    with Session(_engine) as session:
        yield session


def _row(obj: Any, fields: list[str]) -> dict[str, Any]:
    return {f: getattr(obj, f) for f in fields}


@app.get("/health")
def health(session: Session = Depends(get_session)) -> dict[str, Any]:
    n = session.scalar(select(func.count()).select_from(Verbatim))
    return {"status": "ok", "verbatims": n}


@app.get("/vehicles")
def vehicles(session: Session = Depends(get_session)) -> list[dict[str, Any]]:
    out = []
    for v in session.scalars(select(Vehicle).order_by(Vehicle.code)):
        variants = session.scalars(
            select(VehicleVariant)
            .where(VehicleVariant.vehicle_code == v.code)
            .order_by(VehicleVariant.column_order)
        ).all()
        out.append(
            {
                **_row(v, ["code", "name", "series", "generation", "segment", "tier", "notes"]),
                "variants": [
                    _row(
                        x,
                        [
                            "id",
                            "name",
                            "powertrain",
                            "fuel",
                            "drive",
                            "power_kw",
                            "base_price_eur",
                            "locator",
                        ],
                    )
                    for x in variants
                ],
            }
        )
    return out


@app.get("/markets")
def markets(session: Session = Depends(get_session)) -> list[dict[str, Any]]:
    return [_row(m, ["code", "name", "notes"]) for m in session.scalars(select(Market))]


@app.get("/taxonomy/level2")
def taxonomy_level2(session: Session = Depends(get_session)) -> list[dict[str, Any]]:
    return [
        _row(t, ["id", "name", "domain_key", "origin", "status"])
        for t in session.scalars(select(TaxonomyLevel2).order_by(TaxonomyLevel2.id))
    ]


@app.get("/taxonomy/level3")
def taxonomy_level3(session: Session = Depends(get_session)) -> list[dict[str, Any]]:
    return [
        _row(t, ["id", "name", "polarity", "origin", "status"])
        for t in session.scalars(select(TaxonomyLevel3).order_by(TaxonomyLevel3.id))
    ]


def _verbatim_dict(v: Verbatim) -> dict[str, Any]:
    return {
        **_row(
            v,
            [
                "id",
                "vehicle_code",
                "source_label",
                "country_code",
                "market_code",
                "powertrain",
                "text",
                "char_len",
                "source_id",
                "locator",
            ],
        ),
        "evidence_ref": f"verbatim:{v.id}",
        "classifications": [
            _row(
                c,
                [
                    "id",
                    "feedback_type",
                    "level2_id",
                    "level2_raw",
                    "level3_id",
                    "level3_raw",
                    "origin",
                    "status",
                    "confidence",
                ],
            )
            for c in v.classifications
        ],
    }


@app.get("/verbatims")
def list_verbatims(
    vehicle: str | None = None,
    market: str | None = None,
    powertrain: str | None = None,
    source: str | None = None,
    feedback_type: str | None = None,
    level2: str | None = Query(None, description="Level-2 taxonomy id or exact name"),
    q: str | None = Query(None, description="Case-insensitive text search"),
    limit: int = Query(50, le=500),
    offset: int = 0,
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    stmt = select(Verbatim)
    if vehicle:
        stmt = stmt.where(Verbatim.vehicle_code == vehicle)
    if market:
        stmt = stmt.where(Verbatim.market_code == market)
    if powertrain:
        stmt = stmt.where(Verbatim.powertrain == powertrain)
    if source:
        stmt = stmt.where(Verbatim.source_label == source)
    if q:
        stmt = stmt.where(Verbatim.text.ilike(f"%{q}%"))
    if feedback_type or level2:
        sub = select(VerbatimClassification.verbatim_id)
        if feedback_type:
            sub = sub.where(VerbatimClassification.feedback_type == feedback_type)
        if level2:
            sub = sub.where(
                or_(
                    VerbatimClassification.level2_id == level2,
                    VerbatimClassification.level2_raw == level2,
                )
            )
        stmt = stmt.where(Verbatim.id.in_(sub))
    total = session.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = session.scalars(stmt.order_by(Verbatim.id).offset(offset).limit(limit)).all()
    return {
        "total": total,
        "offset": offset,
        "limit": limit,
        "items": [_verbatim_dict(v) for v in rows],
    }


@app.get("/verbatims/{verbatim_id}")
def get_verbatim(verbatim_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    v = session.get(Verbatim, verbatim_id)
    if v is None:
        raise HTTPException(404, "verbatim not found")
    return _verbatim_dict(v)


@app.get("/studies")
def studies(
    vehicle: str | None = None,
    market: str | None = None,
    study: str | None = None,
    session: Session = Depends(get_session),
) -> list[dict[str, Any]]:
    stmt = select(StudyMetric)
    if vehicle:
        stmt = stmt.where(StudyMetric.vehicle_code == vehicle)
    if market:
        stmt = stmt.where(StudyMetric.market_code == market)
    if study:
        stmt = stmt.where(StudyMetric.study == study)
    return [
        {
            **_row(
                m,
                [
                    "id",
                    "vehicle_code",
                    "market_code",
                    "study",
                    "attribute_raw",
                    "attribute_key",
                    "domain_key",
                    "stat_kind",
                    "mean",
                    "distribution",
                    "scale_note",
                    "locator",
                ],
            ),
            "evidence_ref": f"metric:{m.id}",
        }
        for m in session.scalars(stmt.order_by(StudyMetric.id))
    ]


@app.get("/sales")
def sales(
    vehicle: str | None = None, session: Session = Depends(get_session)
) -> list[dict[str, Any]]:
    stmt = select(SalesVolume)
    if vehicle:
        stmt = stmt.where(SalesVolume.vehicle_code == vehicle)
    return [
        {
            **_row(
                s, ["id", "vehicle_code", "market_code", "year", "units", "kind", "note", "locator"]
            ),
            "evidence_ref": f"sales:{s.id}",
        }
        for s in session.scalars(stmt.order_by(SalesVolume.id))
    ]


@app.get("/equipment")
def equipment(
    vehicle: str,
    group: str | None = None,
    q: str | None = None,
    session: Session = Depends(get_session),
) -> list[dict[str, Any]]:
    stmt = select(EquipmentItem).where(EquipmentItem.vehicle_code == vehicle)
    if group:
        stmt = stmt.where(EquipmentItem.group_key == group)
    if q:
        stmt = stmt.where(
            or_(EquipmentItem.name_de.ilike(f"%{q}%"), EquipmentItem.name_en.ilike(f"%{q}%"))
        )
    variants = {
        v.id: v.name
        for v in session.scalars(
            select(VehicleVariant).where(VehicleVariant.vehicle_code == vehicle)
        )
    }
    out = []
    for it in session.scalars(stmt.order_by(EquipmentItem.id)):
        avail = session.scalars(
            select(EquipmentAvailability).where(EquipmentAvailability.equipment_item_id == it.id)
        ).all()
        out.append(
            {
                **_row(
                    it,
                    [
                        "id",
                        "sa_code",
                        "name_de",
                        "name_en",
                        "section",
                        "group_key",
                        "domain_key",
                        "description_de",
                        "price_eur",
                        "price_note",
                        "locator",
                    ],
                ),
                "evidence_ref": f"equipment:{it.id}",
                "availability": {variants.get(a.variant_id, a.variant_id): a.status for a in avail},
                "dependencies": [{"kind": d.kind, "text": d.text} for d in it.dependencies],
            }
        )
    return out


@app.get("/specs")
def specs(vehicle: str, session: Session = Depends(get_session)) -> list[dict[str, Any]]:
    return [
        {
            **_row(
                s,
                [
                    "id",
                    "variant_id",
                    "attribute_key",
                    "attribute_raw",
                    "value",
                    "value_num",
                    "unit",
                    "locator",
                ],
            ),
            "evidence_ref": f"spec:{s.id}",
        }
        for s in session.scalars(
            select(TechSpec).where(TechSpec.vehicle_code == vehicle).order_by(TechSpec.id)
        )
    ]


@app.get("/runs")
def runs(
    limit: int = Query(50, le=500), session: Session = Depends(get_session)
) -> list[dict[str, Any]]:
    return [
        _row(
            r,
            [
                "id",
                "kind",
                "started_at",
                "finished_at",
                "status",
                "code_version",
                "config_snapshot",
                "notes",
            ],
        )
        for r in session.scalars(select(Run).order_by(Run.started_at.desc()).limit(limit))
    ]


@app.get("/events")
def events(
    entity_type: str | None = None,
    entity_id: str | None = None,
    run_id: str | None = None,
    action: str | None = None,
    limit: int = Query(200, le=5000),
    offset: int = 0,
    session: Session = Depends(get_session),
) -> dict[str, Any]:
    stmt = select(AuditEvent)
    if entity_type:
        stmt = stmt.where(AuditEvent.entity_type == entity_type)
    if entity_id:
        stmt = stmt.where(AuditEvent.entity_id == entity_id)
    if run_id:
        stmt = stmt.where(AuditEvent.run_id == run_id)
    if action:
        stmt = stmt.where(AuditEvent.action == action)
    total = session.scalar(select(func.count()).select_from(stmt.subquery()))
    rows = session.scalars(stmt.order_by(AuditEvent.id).offset(offset).limit(limit)).all()
    return {"total": total, "items": [event_to_dict(e) for e in rows]}


@app.get("/reports/baseline/{vehicle}")
def baseline(
    vehicle: str, market: str | None = None, session: Session = Depends(get_session)
) -> dict[str, Any]:
    from tracepoint.reports.baseline import build_baseline

    try:
        return build_baseline(session, vehicle, market)
    except ValueError as exc:
        raise HTTPException(404, str(exc)) from exc


@app.get("/findings")
def findings(
    vehicle: str | None = None,
    market: str | None = Query(
        None, description="EU / US / CN / RoW; 'ALL' for findings without market scope"
    ),
    layer: str | None = None,
    kind: str | None = None,
    domain: str | None = None,
    status: str | None = None,
    limit: int = Query(200, le=2000),
    session: Session = Depends(get_session),
) -> list[dict[str, Any]]:
    stmt = select(Finding)
    if vehicle:
        stmt = stmt.where(Finding.vehicle_code == vehicle)
    if market:
        stmt = (
            stmt.where(Finding.market_code.is_(None))
            if market == "ALL"
            else stmt.where(Finding.market_code == market)
        )
    if layer:
        stmt = stmt.where(Finding.layer == layer)
    if kind:
        stmt = stmt.where(Finding.kind == kind)
    if domain:
        stmt = stmt.where(Finding.domain_key == domain)
    if status:
        stmt = stmt.where(Finding.status == status)
    else:
        stmt = stmt.where(Finding.status != "withdrawn")
    rows = session.scalars(
        stmt.order_by(Finding.severity_score.desc().nulls_last(), Finding.id).limit(limit)
    ).all()
    return [
        _row(
            f,
            [
                "id",
                "vehicle_code",
                "market_code",
                "powertrain",
                "layer",
                "kind",
                "domain_key",
                "theme_level2_id",
                "attribute_key",
                "title",
                "statement",
                "quantification",
                "severity_score",
                "evidence_level",
                "evidence_count",
                "status",
                "version",
                "created_by",
                "created_run_id",
            ],
        )
        for f in rows
    ]


@app.get("/findings/{finding_id}")
def get_finding(finding_id: str, session: Session = Depends(get_session)) -> dict[str, Any]:
    f = session.get(Finding, finding_id)
    if f is None:
        raise HTTPException(404, "finding not found")
    evidence = session.scalars(
        select(FindingEvidence).where(FindingEvidence.finding_id == f.id)
    ).all()
    links_out = session.scalars(
        select(FindingLink).where(FindingLink.from_finding_id == f.id)
    ).all()
    links_in = session.scalars(select(FindingLink).where(FindingLink.to_finding_id == f.id)).all()
    return {
        **_row(
            f,
            [
                "id",
                "vehicle_code",
                "market_code",
                "powertrain",
                "layer",
                "kind",
                "domain_key",
                "theme_level2_id",
                "attribute_key",
                "title",
                "statement",
                "quantification",
                "severity_score",
                "evidence_level",
                "evidence_count",
                "status",
                "version",
                "created_by",
                "created_run_id",
                "updated_run_id",
            ],
        ),
        "evidence": [_row(e, ["evidence_ref", "role", "weight", "note"]) for e in evidence],
        "links_out": [_row(x, ["to_finding_id", "kind", "rationale"]) for x in links_out],
        "links_in": [_row(x, ["from_finding_id", "kind", "rationale"]) for x in links_in],
        "events": [
            event_to_dict(e)
            for e in session.scalars(
                select(AuditEvent)
                .where(AuditEvent.entity_type == "finding", AuditEvent.entity_id == f.id)
                .order_by(AuditEvent.id)
            )
        ],
    }
