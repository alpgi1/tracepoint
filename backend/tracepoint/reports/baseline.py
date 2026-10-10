"""Baseline situation-analysis report per vehicle × market (no LLM involved).

The report is the first tangible artefact for the PM and a validation of the ingestion: coverage,
theme landscape by domain, strengths and complaints, study weak and strong attributes with
comparisons, equipment summary and sales weight. Output: JSON structure plus a Markdown rendering.
"""

from __future__ import annotations

import json
from collections import Counter, defaultdict
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.db.models import (
    EquipmentAvailability,
    EquipmentItem,
    SalesVolume,
    StudyMetric,
    TaxonomyLevel2,
    Vehicle,
    VehicleVariant,
    Verbatim,
    VerbatimClassification,
)

COMPLAINT_TYPES = ("Defect", "Difficult to Use", "Wants")
LIKE_TYPE = "Likes"


def _domain_names(session: Session) -> dict[str, str]:
    import yaml

    from tracepoint.core.settings import get_settings

    path = get_settings().config_dir / "taxonomy" / "domains.yaml"
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as fh:
        data = yaml.safe_load(fh) or {}
    return {k: v.get("name", k) for k, v in (data.get("domains") or {}).items()}


def _pick_quotes(verbatims: list[Verbatim], n: int = 3) -> list[dict[str, Any]]:
    """Prefer informative but short quotes (60–320 characters)."""
    ranked = sorted(verbatims, key=lambda v: (not (60 <= v.char_len <= 320), v.char_len))
    out = []
    for v in ranked[:n]:
        out.append(
            {
                "id": v.id,
                "source": v.source_label,
                "country": v.country_code,
                "powertrain": v.powertrain,
                "text": v.text if v.char_len <= 400 else v.text[:400] + " …",
                "evidence_ref": f"verbatim:{v.id}",
            }
        )
    return out


def build_baseline(
    session: Session, vehicle_code: str, market_code: str | None = None
) -> dict[str, Any]:
    vehicle = session.get(Vehicle, vehicle_code)
    if vehicle is None:
        raise ValueError(f"unknown vehicle {vehicle_code}")
    domain_names = _domain_names(session)

    # ---- verbatims and classifications -------------------------------------------------------
    stmt = select(Verbatim).where(Verbatim.vehicle_code == vehicle_code)
    if market_code:
        stmt = stmt.where(Verbatim.market_code == market_code)
    verbatims = list(session.scalars(stmt))
    v_ids = {v.id for v in verbatims}
    by_id = {v.id: v for v in verbatims}
    classes = (
        [
            c
            for c in session.scalars(
                select(VerbatimClassification).where(VerbatimClassification.verbatim_id.in_(v_ids))
            )
        ]
        if v_ids
        else []
    )
    l2 = {t.id: t for t in session.scalars(select(TaxonomyLevel2))}

    coverage = {
        "verbatims": len(verbatims),
        "classification_rows": len(classes),
        "by_source": dict(Counter(v.source_label for v in verbatims)),
        "by_powertrain": dict(Counter(v.powertrain or "unknown" for v in verbatims)),
        "by_country": dict(Counter(v.country_code or "unknown" for v in verbatims)),
        "by_feedback_type": dict(Counter(c.feedback_type or "unclassified" for c in classes)),
        "unclassified_rows": sum(1 for c in classes if c.status == "unclassified"),
    }

    # theme landscape
    theme_rows: dict[str, dict[str, Any]] = {}
    domain_rows: dict[str, dict[str, Any]] = defaultdict(
        lambda: {"rows": 0, "likes": 0, "complaints": 0, "themes": set()}
    )
    theme_verbatims: dict[str, dict[str, list[Verbatim]]] = defaultdict(lambda: defaultdict(list))
    for c in classes:
        if c.level2_id is None:
            continue
        t = l2[c.level2_id]
        row = theme_rows.setdefault(
            t.id,
            {
                "theme_id": t.id,
                "theme": t.name,
                "domain": t.domain_key,
                "rows": 0,
                "likes": 0,
                "defects": 0,
                "difficult_to_use": 0,
                "wants": 0,
                "complaints": 0,
                "by_powertrain": Counter(),
            },
        )
        row["rows"] += 1
        ft = c.feedback_type
        if ft == LIKE_TYPE:
            row["likes"] += 1
        elif ft == "Defect":
            row["defects"] += 1
            row["complaints"] += 1
        elif ft == "Difficult to Use":
            row["difficult_to_use"] += 1
            row["complaints"] += 1
        elif ft == "Wants":
            row["wants"] += 1
            row["complaints"] += 1
        v = by_id[c.verbatim_id]
        row["by_powertrain"][v.powertrain or "unknown"] += 1
        d = domain_rows[t.domain_key or "unmapped"]
        d["rows"] += 1
        d["likes"] += 1 if ft == LIKE_TYPE else 0
        d["complaints"] += 1 if ft in COMPLAINT_TYPES else 0
        d["themes"].add(t.name)
        bucket = "complaints" if ft in COMPLAINT_TYPES else "likes" if ft == LIKE_TYPE else "other"
        theme_verbatims[t.id][bucket].append(v)

    for row in theme_rows.values():
        row["complaint_share"] = round(row["complaints"] / row["rows"], 3) if row["rows"] else None
        row["by_powertrain"] = dict(row["by_powertrain"])
    domains = []
    for key, d in sorted(domain_rows.items(), key=lambda kv: -kv[1]["rows"]):
        domains.append(
            {
                "domain": key,
                "name": domain_names.get(key, key),
                "rows": d["rows"],
                "likes": d["likes"],
                "complaints": d["complaints"],
                "complaint_share": round(d["complaints"] / d["rows"], 3) if d["rows"] else None,
                "themes": len(d["themes"]),
            }
        )
    top_complaints = sorted(theme_rows.values(), key=lambda r: -r["complaints"])[:15]
    top_likes = sorted(theme_rows.values(), key=lambda r: -r["likes"])[:10]
    for row in top_complaints:
        row["quotes"] = _pick_quotes(theme_verbatims[row["theme_id"]]["complaints"])
    for row in top_likes:
        row.setdefault("quotes", _pick_quotes(theme_verbatims[row["theme_id"]]["likes"]))

    # ---- studies ------------------------------------------------------------------------------
    metrics = list(session.scalars(select(StudyMetric)))
    own = [
        m
        for m in metrics
        if m.vehicle_code == vehicle_code and (market_code is None or m.market_code == market_code)
    ]
    study_blocks = []
    for study in sorted({m.study for m in own}):
        rows = []
        for m in [x for x in own if x.study == study]:
            peers = [
                p
                for p in metrics
                if p.study == study
                and p.attribute_key == m.attribute_key
                and p.market_code == m.market_code
                and p.vehicle_code != m.vehicle_code
            ]
            other_markets = [
                p
                for p in metrics
                if p.study == study
                and p.attribute_key == m.attribute_key
                and p.vehicle_code == m.vehicle_code
                and p.market_code != m.market_code
            ]
            rows.append(
                {
                    "attribute": m.attribute_raw,
                    "key": m.attribute_key,
                    "domain": m.domain_key,
                    "market": m.market_code,
                    "score": round(m.mean, 3) if m.mean is not None else None,
                    "scale": "1-10 mean" if m.stat_kind == "mean" else "1-7 derived mean",
                    "bottom3": (m.distribution or {}).get("bottom3") if m.distribution else None,
                    "top2": (m.distribution or {}).get("top2") if m.distribution else None,
                    "peers_same_market": {
                        p.vehicle_code: round(p.mean, 3) for p in peers if p.mean is not None
                    },
                    "same_vehicle_other_markets": {
                        p.market_code: round(p.mean, 3) for p in other_markets if p.mean is not None
                    },
                    "evidence_ref": f"metric:{m.id}",
                }
            )
        scored = [r for r in rows if r["score"] is not None]
        study_blocks.append(
            {
                "study": study,
                "attributes": len(rows),
                "weakest": sorted(scored, key=lambda r: r["score"])[:10],
                "strongest": sorted(scored, key=lambda r: -r["score"])[:10],
            }
        )

    # ---- equipment ----------------------------------------------------------------------------
    variants = list(
        session.scalars(
            select(VehicleVariant)
            .where(VehicleVariant.vehicle_code == vehicle_code)
            .order_by(VehicleVariant.column_order)
        )
    )
    items = list(
        session.scalars(select(EquipmentItem).where(EquipmentItem.vehicle_code == vehicle_code))
    )
    avail = (
        list(
            session.scalars(
                select(EquipmentAvailability).where(
                    EquipmentAvailability.equipment_item_id.in_([i.id for i in items])
                )
            )
        )
        if items
        else []
    )
    status_by_item: dict[str, Counter] = defaultdict(Counter)
    for a in avail:
        status_by_item[a.equipment_item_id][a.status] += 1
    n_variants = len(variants)
    group_summary: dict[str, Counter] = defaultdict(Counter)
    optional_everywhere = []
    for it in items:
        st = status_by_item.get(it.id, Counter())
        g = it.group_key or "other"
        if st.get("standard", 0) == n_variants and n_variants:
            group_summary[g]["standard_on_all"] += 1
        elif st.get("standard", 0) > 0:
            group_summary[g]["standard_on_some"] += 1
        elif st.get("optional", 0) + st.get("no_cost_option", 0) > 0:
            group_summary[g]["optional"] += 1
            if st.get("optional", 0) == n_variants and it.price_eur:
                optional_everywhere.append(
                    {
                        "item": it.name_en or it.name_de,
                        "sa_code": it.sa_code,
                        "price_eur": float(it.price_eur),
                        "group": g,
                        "evidence_ref": f"equipment:{it.id}",
                    }
                )
        else:
            group_summary[g]["package_or_unknown"] += 1
    equipment = {
        "catalogue": "German price list July 2026 (Germany only)",
        "variants": [
            {
                "name": v.name,
                "powertrain": v.powertrain,
                "power_kw": v.power_kw,
                "base_price_eur": float(v.base_price_eur) if v.base_price_eur else None,
            }
            for v in variants
        ],
        "items": len(items),
        "by_group": {g: dict(c) for g, c in sorted(group_summary.items())},
        "optional_on_all_variants": sorted(optional_everywhere, key=lambda r: -r["price_eur"])[:25],
    }

    # ---- sales --------------------------------------------------------------------------------
    sales = list(
        session.scalars(select(SalesVolume).where(SalesVolume.vehicle_code == vehicle_code))
    )
    by_year_market: dict[int, dict[str, int]] = defaultdict(dict)
    for s in sales:
        by_year_market[s.year][s.market_code] = s.units
    sales_block = {"by_year": {y: m for y, m in sorted(by_year_market.items())}}
    if market_code and by_year_market:
        for y, m in by_year_market.items():
            total = sum(m.values())
            sales_block.setdefault("market_share_of_vehicle", {})[y] = (
                round(m.get(market_code, 0) / total, 3) if total else None
            )
        u25 = by_year_market.get(2025, {}).get(market_code)
        u30 = by_year_market.get(2030, {}).get(market_code)
        sales_block["growth_2025_2030"] = (
            round((u30 - u25) / u25, 3) if u25 and u30 is not None else None
        )
        sales_block["note"] = next((s.note for s in sales if s.note), None)

    quality_notes = []
    if coverage["unclassified_rows"]:
        quality_notes.append(
            f"{coverage['unclassified_rows']} classification rows are unclassified (to be filled by the LLM classifier in a later step)"
        )
    if "unknown" in coverage["by_country"]:
        quality_notes.append(
            f"{coverage['by_country']['unknown']} verbatims without a known country"
        )
    inherited = sum(1 for it in items if it.price_note == "inherited")
    if inherited:
        quality_notes.append(
            f"{inherited} equipment rows inherit price / availability from merged catalogue cells"
        )
    if market_code == "CN":
        quality_notes.append("No verbatims exist for China; only study means and sales")

    return {
        "report": "baseline_situation_analysis",
        "generated_at": datetime.now(UTC).isoformat(),
        "vehicle": {
            "code": vehicle.code,
            "name": vehicle.name,
            "segment": vehicle.segment,
            "tier": vehicle.tier,
        },
        "market": market_code or "ALL",
        "coverage": coverage,
        "domains": domains,
        "top_complaint_themes": [
            {k: v for k, v in r.items() if k != "by_powertrain" or True} for r in top_complaints
        ],
        "top_strength_themes": top_likes,
        "studies": study_blocks,
        "equipment": equipment,
        "sales": sales_block,
        "data_quality_notes": quality_notes,
    }


def render_markdown(rep: dict[str, Any]) -> str:
    v = rep["vehicle"]
    out = [f"# Baseline situation analysis – {v['name']} ({v['code']}), market {rep['market']}", ""]
    out.append(
        f"Generated {rep['generated_at'][:19]} UTC. Segment: {v.get('segment')}; tier: {v.get('tier')}."
    )
    out.append("")
    c = rep["coverage"]
    out += [
        "## 1. Evidence coverage",
        "",
        f"- Verbatims: {c['verbatims']} ({c['classification_rows']} classification rows, {c['unclassified_rows']} unclassified)",
    ]
    out.append(f"- By source: {c['by_source']}")
    out.append(f"- By powertrain: {c['by_powertrain']}")
    out.append(f"- By feedback type: {c['by_feedback_type']}")
    out.append("")
    out += [
        "## 2. Theme landscape by vehicle domain",
        "",
        "| Domain | Rows | Likes | Complaints | Complaint share | Themes |",
        "|---|---|---|---|---|---|",
    ]
    for d in rep["domains"]:
        out.append(
            f"| {d['name']} | {d['rows']} | {d['likes']} | {d['complaints']} | {d['complaint_share']} | {d['themes']} |"
        )
    out.append("")
    out += ["## 3. Top complaint themes (Defect + Difficult to use + Wants)", ""]
    for r in rep["top_complaint_themes"]:
        out.append(
            f"### {r['theme']} ({r['domain']}) – {r['complaints']} complaints of {r['rows']} rows (defects {r['defects']}, difficult to use {r['difficult_to_use']}, wants {r['wants']})"
        )
        for q in r.get("quotes", []):
            out.append(
                f"- [{q['evidence_ref']} | {q['source']} | {q['country']} | {q['powertrain']}] {q['text']}"
            )
        out.append("")
    out += ["## 4. Top strengths (Likes)", ""]
    for r in rep["top_strength_themes"]:
        out.append(f"- **{r['theme']}** ({r['domain']}): {r['likes']} likes of {r['rows']} rows")
    out.append("")
    out += ["## 5. Customer studies", ""]
    for s in rep["studies"]:
        out.append(f"### {s['study']} ({s['attributes']} attributes)")
        out.append("")
        out.append("Weakest attributes:")
        out.append("")
        out.append(
            "| Attribute | Domain | Score | Peers (same market) | Same vehicle, other markets |"
        )
        out.append("|---|---|---|---|---|")
        for r in s["weakest"]:
            out.append(
                f"| {r['attribute']} | {r['domain']} | {r['score']} ({r['scale']}) | {r['peers_same_market']} | {r['same_vehicle_other_markets']} |"
            )
        out.append("")
        out.append(
            "Strongest attributes: "
            + ", ".join(f"{r['attribute']} ({r['score']})" for r in s["strongest"][:6])
        )
        out.append("")
    e = rep["equipment"]
    out += [
        "## 6. Equipment offering (German catalogue)",
        "",
        "Variants: "
        + ", ".join(
            f"{x['name']} ({x['powertrain']}, {x['base_price_eur']} EUR)" for x in e["variants"]
        ),
        "",
        f"Items parsed: {e['items']}. By group: {e['by_group']}",
        "",
    ]
    out.append(
        "Priced options available on every variant (candidates for standard-fit discussion):"
    )
    out.append("")
    for r in e["optional_on_all_variants"][:15]:
        out.append(
            f"- {r['item']} ({r['sa_code']}, {r['price_eur']} EUR, {r['group']}) [{r['evidence_ref']}]"
        )
    out.append("")
    s = rep["sales"]
    out += ["## 7. Sales weight", "", f"Units by year and market: {s['by_year']}"]
    if "market_share_of_vehicle" in s:
        out.append(
            f"Share of this market in the vehicle's volume: {s['market_share_of_vehicle']}; growth 2025→2030: {s.get('growth_2025_2030')}"
        )
    if s.get("note"):
        out.append(f"Note: {s['note']}")
    out.append("")
    out += ["## 8. Data-quality notes", ""] + [f"- {n}" for n in rep["data_quality_notes"]] + [""]
    return "\n".join(out)


def to_json(rep: dict[str, Any]) -> str:
    return json.dumps(rep, ensure_ascii=False, indent=2, default=str)
