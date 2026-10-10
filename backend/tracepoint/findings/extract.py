"""Deterministic finding extraction per vehicle × market (Phase 3, first iteration).

Layers covered without any LLM: voice of customer (recurring complaints, unmet needs, strengths),
quantitative metrics (metric gaps and strengths with peer / cross-market comparison) and portfolio
offering (equipment gaps: wished or criticised themes versus what the catalogue offers). Cross-layer
links connect VoC findings with study metrics through the authored theme → attribute map. Findings
are upserted with stable identifiers; changes bump the version and are logged with before / after.
"""

from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.core.ids import slug
from tracepoint.db.models import (
    EquipmentAvailability,
    EquipmentItem,
    Finding,
    FindingEvidence,
    FindingLink,
    Market,
    Run,
    StudyMetric,
    TaxonomyLevel2,
    Vehicle,
    VehicleVariant,
    Verbatim,
    VerbatimClassification,
)
from tracepoint.findings.config import FindingConfig, load_config

ACTOR = "agent:finding-extractor"
COMPLAINT_TYPES = ("Defect", "Difficult to Use", "Wants")


@dataclass
class Draft:
    id: str
    layer: str
    kind: str
    title: str
    statement: str
    quantification: dict[str, Any]
    severity: float | None
    evidence: list[tuple[str, str, float | None, str | None]]  # (ref, role, weight, note)
    domain_key: str | None = None
    theme_level2_id: str | None = None
    attribute_key: str | None = None
    powertrain: str | None = None
    evidence_level: str | None = None
    links: list[tuple[str, str, str]] = field(default_factory=list)  # (to_id, kind, rationale)


def _pct(a: float, b: float) -> float:
    return round(100.0 * a / b, 1) if b else 0.0


# --------------------------------------------------------------------------------------------
# Voice of customer
# --------------------------------------------------------------------------------------------


def _voc_drafts(
    session: Session,
    cfg: FindingConfig,
    vehicle: Vehicle,
    market: str | None,
    l2: dict[str, TaxonomyLevel2],
) -> list[Draft]:
    voc = cfg.voc
    weights = voc.get("severity_weights", {})
    stmt = (
        select(VerbatimClassification, Verbatim)
        .join(Verbatim, Verbatim.id == VerbatimClassification.verbatim_id)
        .where(
            Verbatim.vehicle_code == vehicle.code,
            VerbatimClassification.status == "canonical",
            VerbatimClassification.level2_id.isnot(None),
        )
    )
    if market:
        stmt = stmt.where(Verbatim.market_code == market)
    rows = session.execute(stmt.order_by(VerbatimClassification.id)).all()
    per_theme: dict[str, dict[str, Any]] = defaultdict(
        lambda: {
            "rows": 0,
            "ft": Counter(),
            "sources": Counter(),
            "pt": Counter(),
            "countries": Counter(),
            "examples": [],
        }
    )
    total_complaints = 0
    total_rows = 0
    for c, v in rows:
        t = per_theme[c.level2_id]
        t["rows"] += 1
        total_rows += 1
        ft = c.feedback_type or "unclassified"
        t["ft"][ft] += 1
        t["sources"][v.source_label] += 1
        t["pt"][v.powertrain or "unknown"] += 1
        t["countries"][v.country_code or "unknown"] += 1
        if ft in COMPLAINT_TYPES:
            total_complaints += 1
        t["examples"].append((c, v))
    drafts: list[Draft] = []
    mkt = market or "ALL"
    market_name = market or "all markets"
    for theme_id, t in per_theme.items():
        theme = l2[theme_id]
        ft = t["ft"]
        complaints = sum(ft[k] for k in COMPLAINT_TYPES)
        likes = ft.get("Likes", 0)
        n_sources = len(t["sources"])
        if complaints >= voc.get("min_complaint_rows", 5):
            weighted = sum(ft[k] * weights.get(k, 1.0) for k in COMPLAINT_TYPES)
            wants_share = ft["Wants"] / complaints if complaints else 0
            kind = (
                "unmet_need"
                if wants_share >= voc.get("unmet_need_wants_share", 0.5)
                else "recurring_complaint"
            )
            examples = sorted(
                [(c, v) for c, v in t["examples"] if c.feedback_type in COMPLAINT_TYPES],
                key=lambda cv: (
                    -weights.get(cv[0].feedback_type, 1.0),
                    abs(cv[1].char_len - 150),
                    cv[0].id,
                ),
            )[: voc.get("example_quotes", 8)]
            quant = {
                "rows": t["rows"],
                "complaints": complaints,
                "defects": ft["Defect"],
                "difficult_to_use": ft["Difficult to Use"],
                "wants": ft["Wants"],
                "likes": likes,
                "complaint_share_of_theme": round(complaints / t["rows"], 3),
                "share_of_market_complaints_pct": _pct(complaints, total_complaints),
                "weighted_severity": round(weighted, 1),
                "by_source": dict(sorted(t["sources"].items())),
                "by_powertrain": dict(sorted(t["pt"].items())),
                "by_country": dict(
                    sorted(t["countries"].most_common(8), key=lambda kv: (-kv[1], kv[0]))
                ),
                "total_market_complaint_rows": total_complaints,
            }
            statement = (
                f"Customers of the {vehicle.name} ({market_name}) raise {complaints} complaint rows about "
                f"'{theme.name}' ({ft['Defect']} defects, {ft['Difficult to Use']} usability problems, {ft['Wants']} wishes) "
                f"from {n_sources} source type(s); that is {quant['share_of_market_complaints_pct']}% of all complaint rows in this market "
                f"and {round(100 * quant['complaint_share_of_theme'])}% of what customers say about this theme."
            )
            evidence = [
                (
                    f"vclass:{c.id}",
                    "example",
                    weights.get(c.feedback_type, 1.0),
                    f"{c.feedback_type} | {v.source_label} | {v.country_code} | {v.powertrain}",
                )
                for c, v in examples
            ]
            evidence.append(
                (
                    f"aggregate:verbatim_classification:{vehicle.code}:{mkt}:{theme.id}",
                    "quantifies",
                    None,
                    f"{t['rows']} classification rows for theme {theme.name}",
                )
            )
            drafts.append(
                Draft(
                    id=f"FND-{vehicle.code}-{mkt}-VOC-{slug(theme.name)}",
                    layer="voice_of_customer",
                    kind=kind,
                    title=f"{theme.name}: {complaints} complaints ({kind.replace('_', ' ')})",
                    statement=statement,
                    quantification=quant,
                    severity=round(weighted, 1),
                    evidence=evidence,
                    domain_key=theme.domain_key,
                    theme_level2_id=theme.id,
                    evidence_level=_voc_level(cfg, n_sources, complaints),
                )
            )
        if (
            likes >= voc.get("min_strength_rows", 15)
            and t["rows"]
            and likes / t["rows"] >= voc.get("min_strength_share", 0.7)
        ):
            examples = sorted(
                [(c, v) for c, v in t["examples"] if c.feedback_type == "Likes"],
                key=lambda cv: abs(cv[1].char_len - 150),
            )[: voc.get("example_quotes", 8)]
            quant = {
                "rows": t["rows"],
                "likes": likes,
                "like_share": round(likes / t["rows"], 3),
                "by_source": dict(t["sources"]),
                "by_powertrain": dict(t["pt"]),
            }
            drafts.append(
                Draft(
                    id=f"FND-{vehicle.code}-{mkt}-VOC-STRENGTH-{slug(theme.name)}",
                    layer="voice_of_customer",
                    kind="strength",
                    title=f"{theme.name}: strength to keep ({likes} likes)",
                    statement=f"'{theme.name}' is praised in {likes} of {t['rows']} rows ({round(100 * likes / t['rows'])}%) by customers of the {vehicle.name} ({market_name}); a strength to protect in the next decision.",
                    quantification=quant,
                    severity=None,
                    evidence=[
                        (
                            f"vclass:{c.id}",
                            "example",
                            1.0,
                            f"Likes | {v.source_label} | {v.country_code} | {v.powertrain}",
                        )
                        for c, v in examples
                    ],
                    domain_key=theme.domain_key,
                    theme_level2_id=theme.id,
                    evidence_level=_voc_level(cfg, n_sources, likes),
                )
            )
    return drafts


def _voc_level(cfg: FindingConfig, n_sources: int, rows: int) -> str:
    lv = cfg.evidence_levels
    b = lv.get("B", {})
    c = lv.get("C", {})
    if n_sources >= b.get("min_source_labels", 1) and rows >= b.get("min_rows", 10):
        return "B"
    if rows >= c.get("min_rows", 5):
        return "C"
    return "D"


# --------------------------------------------------------------------------------------------
# Quantitative metrics
# --------------------------------------------------------------------------------------------


def _metric_drafts(
    session: Session, cfg: FindingConfig, vehicle: Vehicle, market: str | None
) -> list[Draft]:
    m = cfg.metrics
    metrics = list(session.scalars(select(StudyMetric)))
    own = [
        x
        for x in metrics
        if x.vehicle_code == vehicle.code
        and (market is None or x.market_code == market)
        and x.mean is not None
    ]
    drafts: list[Draft] = []
    mkt = market or "ALL"
    by_study_market: dict[tuple[str, str], list[StudyMetric]] = defaultdict(list)
    for x in own:
        by_study_market[(x.study, x.market_code)].append(x)
    for (study, mcode), rows in by_study_market.items():
        ranked = sorted(rows, key=lambda r: r.mean)
        rank_of = {r.id: i + 1 for i, r in enumerate(ranked)}
        n = len(ranked)
        for r in rows:
            peers = [
                p
                for p in metrics
                if p.study == study
                and p.market_code == mcode
                and p.attribute_key == r.attribute_key
                and p.vehicle_code != vehicle.code
                and p.mean is not None
            ]
            others = [
                p
                for p in metrics
                if p.study == study
                and p.vehicle_code == vehicle.code
                and p.attribute_key == r.attribute_key
                and p.market_code != mcode
                and p.mean is not None
            ]
            peer_mean = sum(p.mean for p in peers) / len(peers) if peers else None
            other_mean = sum(p.mean for p in others) / len(others) if others else None
            bottom3 = (r.distribution or {}).get("bottom3") if r.distribution else None
            reasons = []
            if rank_of[r.id] <= m.get("weakest_rank", 8):
                reasons.append(f"rank {rank_of[r.id]} of {n} weakest attributes in {study}")
            if peer_mean is not None and r.mean <= peer_mean - m.get("gap_vs_peer_mean", 0.3):
                reasons.append(
                    f"{round(peer_mean - r.mean, 2)} below the peer mean of other BMW models in the same market"
                )
            if other_mean is not None and r.mean <= other_mean - m.get("gap_vs_other_market", 0.5):
                reasons.append(
                    f"{round(other_mean - r.mean, 2)} below the same vehicle in other markets"
                )
            if bottom3 is not None and bottom3 >= m.get("bottom3_share", 0.10):
                reasons.append(
                    f"{round(100 * bottom3)}% of respondents rate it in the bottom three boxes"
                )
            is_strength = rank_of[r.id] > n - m.get("strongest_rank", 5)
            if not reasons and not is_strength:
                continue
            quant = {
                "study": study,
                "score": round(r.mean, 3),
                "scale": "1-10 mean" if r.stat_kind == "mean" else "1-7 derived mean",
                "rank_weakest_first": rank_of[r.id],
                "attributes_in_study": n,
                "peer_mean": round(peer_mean, 3) if peer_mean is not None else None,
                "peers": {p.vehicle_code: round(p.mean, 3) for p in peers},
                "other_markets": {p.market_code: round(p.mean, 3) for p in others},
                "bottom3": bottom3,
                "top2": (r.distribution or {}).get("top2") if r.distribution else None,
                "scope": "context_only"
                if r.domain_key == "general"
                and r.attribute_key
                in {
                    "value_for_money",
                    "price_deal",
                    "affordability",
                    "cost_of_ownership",
                    "resale_value",
                    "warranty",
                }
                else "in_scope",
            }
            evidence = [
                (f"metric:{r.id}", "quantifies", 1.0, f"{r.attribute_raw} = {round(r.mean, 2)}")
            ]
            evidence += [
                (f"metric:{p.id}", "compares", None, f"peer {p.vehicle_code} = {round(p.mean, 2)}")
                for p in peers
            ]
            evidence += [
                (f"metric:{p.id}", "compares", None, f"{p.market_code} = {round(p.mean, 2)}")
                for p in others
            ]
            if reasons:
                drafts.append(
                    Draft(
                        id=f"FND-{vehicle.code}-{mkt}-MET-{slug(study)}-{r.attribute_key}",
                        layer="quantitative_metrics",
                        kind="metric_gap",
                        title=f"{r.attribute_raw}: weak study rating ({round(r.mean, 2)})",
                        statement=f"In the {study} study, '{r.attribute_raw}' scores {round(r.mean, 2)} ({quant['scale']}) for the {vehicle.name} in {mcode}: "
                        + "; ".join(reasons)
                        + ".",
                        quantification=quant,
                        severity=round((n - rank_of[r.id] + 1) / n * 10, 2),
                        evidence=evidence,
                        domain_key=r.domain_key,
                        attribute_key=r.attribute_key,
                        evidence_level="B",
                    )
                )
            elif is_strength:
                drafts.append(
                    Draft(
                        id=f"FND-{vehicle.code}-{mkt}-MET-STRENGTH-{slug(study)}-{r.attribute_key}",
                        layer="quantitative_metrics",
                        kind="metric_strength",
                        title=f"{r.attribute_raw}: strong study rating ({round(r.mean, 2)})",
                        statement=f"In the {study} study, '{r.attribute_raw}' is among the {m.get('strongest_rank', 5)} strongest attributes for the {vehicle.name} in {mcode} with {round(r.mean, 2)} ({quant['scale']}).",
                        quantification=quant,
                        severity=None,
                        evidence=evidence,
                        domain_key=r.domain_key,
                        attribute_key=r.attribute_key,
                        evidence_level="B",
                    )
                )
    return drafts


# --------------------------------------------------------------------------------------------
# Portfolio offering: equipment gaps
# --------------------------------------------------------------------------------------------


def _equipment_drafts(
    session: Session,
    cfg: FindingConfig,
    vehicle: Vehicle,
    market: str | None,
    voc_drafts: list[Draft],
    l2: dict[str, TaxonomyLevel2],
) -> list[Draft]:
    variants = list(
        session.scalars(
            select(VehicleVariant)
            .where(VehicleVariant.vehicle_code == vehicle.code)
            .order_by(VehicleVariant.column_order)
        )
    )
    if not variants:
        return []
    vname = {v.id: v.name for v in variants}
    items = list(
        session.scalars(select(EquipmentItem).where(EquipmentItem.vehicle_code == vehicle.code))
    )
    avail: dict[str, dict[str, str]] = defaultdict(dict)
    for a in session.scalars(
        select(EquipmentAvailability).where(
            EquipmentAvailability.equipment_item_id.in_([i.id for i in items])
        )
    ):
        avail[a.equipment_item_id][vname[a.variant_id]] = a.status
    drafts: list[Draft] = []
    mkt = market or "ALL"
    for d in voc_drafts:
        if d.kind not in ("recurring_complaint", "unmet_need") or not d.theme_level2_id:
            continue
        theme = l2[d.theme_level2_id]
        terms = cfg.theme_equipment.get(theme.name)
        if not terms:
            continue
        matched = [
            i
            for i in items
            if avail.get(i.id)
            and any(
                t.lower() in (i.name_de or "").lower() or t.lower() in (i.name_en or "").lower()
                for t in terms
            )
        ]
        if not matched:
            continue
        rows = []
        for i in matched:
            st = avail[i.id]
            std = [v for v, s in st.items() if s == "standard"]
            opt = [v for v, s in st.items() if s in ("optional", "no_cost_option")]
            rows.append(
                {
                    "item": i.name_en or i.name_de,
                    "sa_code": i.sa_code,
                    "price_eur": float(i.price_eur) if i.price_eur is not None else None,
                    "standard_on": std,
                    "optional_on": opt,
                    "not_available_on": [v for v, s in st.items() if s == "not_available"],
                    "evidence_ref": f"equipment:{i.id}",
                }
            )
        all_standard = all(len(r["standard_on"]) == len(variants) for r in rows)
        if all_standard:
            continue
        n_opt = sum(1 for r in rows if r["optional_on"])
        quant = {
            "theme_complaints": d.quantification.get("complaints"),
            "theme_wants": d.quantification.get("wants"),
            "catalogue_items": rows,
            "variants": len(variants),
            "items_optional_somewhere": n_opt,
        }
        statement = (
            f"'{theme.name}' draws {d.quantification.get('complaints')} complaint rows ({d.quantification.get('wants')} explicit wishes) for the {vehicle.name} ({market or 'all markets'}), "
            f"while the German catalogue (July 2026) offers {len(rows)} related item(s) that are not standard on every variant: "
            + "; ".join(
                f"{r['item']} (standard on {len(r['standard_on'])}/{len(variants)} variants"
                + (f", {r['price_eur']:.0f} EUR" if r["price_eur"] else "")
                + ")"
                for r in rows[:6]
            )
            + ". Catalogue coverage is Germany-only and serves as a proxy for the offering."
        )
        evidence = [
            (
                r["evidence_ref"],
                "supports",
                None,
                f"{r['item']}: standard on {len(r['standard_on'])}, optional on {len(r['optional_on'])}",
            )
            for r in rows
        ]
        evidence.append((f"finding:{d.id}", "supports", None, "customer voice finding"))
        drafts.append(
            Draft(
                id=f"FND-{vehicle.code}-{mkt}-EQ-{slug(theme.name)}",
                layer="portfolio_offering",
                kind="equipment_gap",
                title=f"{theme.name}: wished or criticised, related equipment is optional or missing",
                statement=statement,
                quantification=quant,
                severity=d.severity,
                evidence=evidence,
                domain_key=theme.domain_key,
                theme_level2_id=theme.id,
                evidence_level="C",
                links=[
                    (
                        d.id,
                        "explains",
                        "Catalogue status of the related equipment explains or contextualises the customer complaint",
                    )
                ],
            )
        )
    return drafts


# --------------------------------------------------------------------------------------------
# Cross-layer links and evidence-level upgrade
# --------------------------------------------------------------------------------------------


def _link_voc_metrics(
    cfg: FindingConfig, voc: list[Draft], met: list[Draft], l2: dict[str, TaxonomyLevel2]
) -> None:
    by_attr: dict[str, list[Draft]] = defaultdict(list)
    for d in met:
        if d.attribute_key:
            by_attr[d.attribute_key].append(d)
    a_rule = cfg.evidence_levels.get("A", {})
    for d in voc:
        if not d.theme_level2_id or d.kind == "strength":
            continue
        keys = cfg.theme_attributes.get(l2[d.theme_level2_id].name, [])
        supporting = 0
        for key in keys:
            for m in by_attr.get(key, []):
                if m.kind == "metric_gap":
                    d.links.append(
                        (
                            m.id,
                            "supports",
                            f"Study attribute '{m.quantification.get('study')}: {key}' is weak ({m.quantification.get('score')}), consistent with the complaints",
                        )
                    )
                    supporting += 1
                else:
                    d.links.append(
                        (
                            m.id,
                            "contradicts",
                            f"Study attribute '{m.quantification.get('study')}: {key}' is strong ({m.quantification.get('score')}) although customers complain; the complaint may be specific to a sub-group",
                        )
                    )
        n_sources = len(d.quantification.get("by_source", {}))
        rows = d.quantification.get("complaints", 0)
        if (
            supporting
            and n_sources >= a_rule.get("min_source_labels", 2)
            and rows >= a_rule.get("min_rows", 20)
        ):
            d.evidence_level = "A"


# --------------------------------------------------------------------------------------------
# Persistence
# --------------------------------------------------------------------------------------------


def _upsert(
    session: Session, run: Run, d: Draft, vehicle_code: str, market: str | None, stats: Counter
) -> Finding:
    existing = session.get(Finding, d.id)
    payload = {
        "title": d.title,
        "statement": d.statement,
        "quantification": d.quantification,
        "severity_score": d.severity,
        "evidence_level": d.evidence_level,
        "kind": d.kind,
    }
    if existing is None:
        f = Finding(
            id=d.id,
            vehicle_code=vehicle_code,
            market_code=market,
            powertrain=d.powertrain,
            layer=d.layer,
            kind=d.kind,
            domain_key=d.domain_key,
            theme_level2_id=d.theme_level2_id,
            attribute_key=d.attribute_key,
            title=d.title[:300],
            statement=d.statement,
            quantification=d.quantification,
            severity_score=d.severity,
            evidence_level=d.evidence_level,
            evidence_count=len(d.evidence),
            status="proposed",
            version=1,
            created_by=ACTOR,
            created_run_id=run.id,
            updated_run_id=run.id,
        )
        session.add(f)
        session.flush()
        record_event(
            session,
            actor_type="agent",
            actor_id=ACTOR,
            action="finding.created",
            entity_type="finding",
            entity_id=f.id,
            run_id=run.id,
            after=payload,
            rationale="Deterministic extraction from the evidence store",
        )
        stats["created"] += 1
    else:
        before = {
            "title": existing.title,
            "statement": existing.statement,
            "quantification": existing.quantification,
            "severity_score": existing.severity_score,
            "evidence_level": existing.evidence_level,
            "kind": existing.kind,
        }
        if before != payload:
            existing.title, existing.statement, existing.quantification = (
                d.title[:300],
                d.statement,
                d.quantification,
            )
            existing.severity_score, existing.evidence_level, existing.kind = (
                d.severity,
                d.evidence_level,
                d.kind,
            )
            existing.evidence_count = len(d.evidence)
            existing.version += 1
            existing.updated_run_id = run.id
            record_event(
                session,
                actor_type="agent",
                actor_id=ACTOR,
                action="finding.updated",
                entity_type="finding",
                entity_id=existing.id,
                run_id=run.id,
                before=before,
                after=payload,
                rationale="Re-extraction changed the quantification or wording; version incremented",
            )
            stats["updated"] += 1
        else:
            stats["unchanged"] += 1
        f = existing
        session.execute(delete(FindingEvidence).where(FindingEvidence.finding_id == f.id))
    seen: set[str] = set()
    for ref, role, weight, note in d.evidence:
        if ref in seen:
            continue
        seen.add(ref)
        session.add(
            FindingEvidence(finding_id=f.id, evidence_ref=ref, role=role, weight=weight, note=note)
        )
    session.flush()
    return f


def extract_findings(
    session: Session, run: Run, vehicle_code: str, market: str | None = None
) -> dict[str, Any]:
    cfg = load_config()
    vehicle = session.get(Vehicle, vehicle_code)
    if vehicle is None:
        raise ValueError(f"unknown vehicle {vehicle_code}")
    if market and session.get(Market, market) is None:
        raise ValueError(f"unknown market {market}")
    l2 = {t.id: t for t in session.scalars(select(TaxonomyLevel2))}
    voc = _voc_drafts(session, cfg, vehicle, market, l2)
    met = _metric_drafts(session, cfg, vehicle, market)
    eq = _equipment_drafts(session, cfg, vehicle, market, voc, l2)
    _link_voc_metrics(cfg, voc, met, l2)
    drafts = voc + met + eq
    stats: Counter = Counter(
        {"created": 0, "updated": 0, "unchanged": 0, "withdrawn": 0, "links": 0}
    )
    ids = [d.id for d in drafts]
    # remove links owned by this extractor for the scope, then re-create
    scope_ids = select(Finding.id).where(
        Finding.vehicle_code == vehicle_code,
        Finding.market_code == market,
        Finding.created_by == ACTOR,
    )
    session.execute(
        delete(FindingLink).where(
            FindingLink.created_by == ACTOR, FindingLink.from_finding_id.in_(scope_ids)
        )
    )
    for d in drafts:
        _upsert(session, run, d, vehicle_code, market, stats)
    # findings of this scope that are no longer produced are withdrawn (kept for the audit trail)
    stale = session.scalars(
        select(Finding).where(
            Finding.vehicle_code == vehicle_code,
            Finding.market_code == market,
            Finding.created_by == ACTOR,
            Finding.status != "withdrawn",
            Finding.id.notin_(ids),
        )
    ).all()
    for f in stale:
        before = {"status": f.status, "version": f.version}
        f.status = "withdrawn"
        f.version += 1
        f.updated_run_id = run.id
        record_event(
            session,
            actor_type="agent",
            actor_id=ACTOR,
            action="finding.withdrawn",
            entity_type="finding",
            entity_id=f.id,
            run_id=run.id,
            before=before,
            after={"status": "withdrawn", "version": f.version},
            rationale="No longer produced by the extraction (thresholds or mappings changed)",
        )
        stats["withdrawn"] += 1
    for d in drafts:
        for to_id, kind, rationale in d.links:
            if to_id in ids:
                session.add(
                    FindingLink(
                        from_finding_id=d.id,
                        to_finding_id=to_id,
                        kind=kind,
                        rationale=rationale,
                        created_by=ACTOR,
                        run_id=run.id,
                    )
                )
                stats["links"] += 1
    session.flush()
    stats.update(
        {
            "findings": len(drafts),
            "voice_of_customer": len(voc),
            "quantitative_metrics": len(met),
            "portfolio_offering": len(eq),
            "level_A": sum(1 for d in drafts if d.evidence_level == "A"),
            "level_B": sum(1 for d in drafts if d.evidence_level == "B"),
            "level_C": sum(1 for d in drafts if d.evidence_level == "C"),
        }
    )
    record_event(
        session,
        actor_type="agent",
        actor_id=ACTOR,
        action="findings.extracted",
        entity_type="vehicle",
        entity_id=f"{vehicle_code}:{market or 'ALL'}",
        run_id=run.id,
        after=dict(stats),
        rationale="Thresholds from config/findings/findings.yaml",
    )
    return dict(stats)
