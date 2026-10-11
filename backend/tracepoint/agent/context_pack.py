"""Context packs: compact, prompt-sized summaries per vehicle × market for the agents (WP1.9).

A pack is a projection of the baseline report plus the strongest findings. It is rebuilt on
demand (a few seconds per pack), so there is no cache invalidation to get wrong; the version
string changes whenever the structure changes.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from typing import Any

from sqlalchemy import case, select
from sqlalchemy.orm import Session

from tracepoint.db.models import Finding
from tracepoint.effort.subsystems import (
    external_rows,
    external_summary,
    load_market_rows,
    subsystem_view,
    summary_rows,
    theme_subsystem,
)
from tracepoint.reports.baseline import build_baseline

CONTEXT_PACK_VERSION = "context-pack-v4"  # v4: what the external evidence of the scope holds
_LEVEL_ORDER = case({"A": 0, "B": 1, "C": 2}, value=Finding.evidence_level, else_=3)


def _quotes(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "evidence_ref": q["evidence_ref"],
            "powertrain": q["powertrain"],
            "text": q["text"] if len(q["text"]) <= 300 else q["text"][:300] + " …",
        }
        for q in rows
    ]


def _metric(m: dict[str, Any]) -> dict[str, Any]:
    return {k: m[k] for k in ("attribute", "domain", "score", "scale", "evidence_ref")}


def build_context_pack(
    session: Session,
    vehicle_code: str,
    market_code: str | None,
    *,
    country_code: str | None = None,
    top: int = 8,
) -> dict[str, Any]:
    """With ``country_code`` the customer voice (coverage, domains, themes, quotes) is that
    country's; studies, equipment, sales and findings stay those of the market."""
    rep = build_baseline(session, vehicle_code, market_code, country_code)
    stmt = select(Finding).where(
        Finding.vehicle_code == vehicle_code, Finding.status != "withdrawn"
    )
    if market_code:
        stmt = stmt.where(Finding.market_code == market_code)
    findings = session.scalars(
        stmt.order_by(_LEVEL_ORDER, Finding.severity_score.desc().nulls_last(), Finding.id).limit(
            15
        )
    ).all()
    cov = rep["coverage"]
    # the engineering view of the same rows; the counting basis is the baseline's (all labels)
    view = (
        subsystem_view(session, vehicle_code, market_code, country_code, labels="all")
        if market_code
        else None
    )
    return {
        "pack": CONTEXT_PACK_VERSION,
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "vehicle": rep["vehicle"],
        "market": rep["market"],
        "country": country_code,
        "coverage": {
            k: cov[k]
            for k in ("verbatims", "by_source", "by_powertrain", "by_country", "by_feedback_type")
        },
        "domains": [
            {k: d[k] for k in ("domain", "name", "rows", "likes", "complaints", "complaint_share")}
            for d in rep["domains"]
        ],
        "top_complaints": [
            {
                **{
                    k: r[k]
                    for k in (
                        "theme",
                        "domain",
                        "complaints",
                        "defects",
                        "difficult_to_use",
                        "wants",
                    )
                },
                "subsystem": theme_subsystem(r["theme"]),
                "quotes": _quotes(r["quotes"]),
            }
            for r in rep["top_complaint_themes"][:top]
        ],
        "top_strengths": [
            {
                "theme": r["theme"],
                "domain": r["domain"],
                "likes": r["likes"],
                "quotes": _quotes(r["quotes"]),
            }
            for r in rep["top_strength_themes"][: top // 2 + 1]
        ],
        "studies": [
            {
                "study": s["study"],
                "weakest": [_metric(m) for m in s["weakest"][:5]],
                "strongest": [_metric(m) for m in s["strongest"][:5]],
            }
            for s in rep["studies"]
        ],
        "equipment": {
            "catalogue": rep["equipment"]["catalogue"],
            "variants": rep["equipment"]["variants"],
            "optional_on_all_variants": rep["equipment"]["optional_on_all_variants"][:10],
        },
        "sales": rep["sales"],
        "subsystems": summary_rows(view) if view else [],
        "subsystem_rows_unassigned": view["unassignedRows"] if view else 0,
        "subsystems_absent": view["absent"] if view else [],
        "market_evidence": load_market_rows(market_code) if market_code else [],
        "external_evidence": external_summary(
            external_rows(session, market_code, vehicle_code), vehicle_code
        )
        if market_code
        else None,
        "findings": [
            {
                "id": f.id,
                "kind": f.kind,
                "layer": f.layer,
                "domain": f.domain_key,
                "title": f.title,
                "evidence_level": f.evidence_level,
                "evidence_count": f.evidence_count,
            }
            for f in findings
        ],
    }


def render_markdown(pack: dict[str, Any]) -> str:
    v = pack["vehicle"]
    out = [
        f"# Context pack – {v['name']} ({v['code']}), market {pack['market']}"
        + (f", customer voice of country {pack['country']} only" if pack.get("country") else ""),
        f"{pack['pack']}, generated {pack['generated_at']}. "
        f"Verbatims: {pack['coverage']['verbatims']} "
        f"(by country {json.dumps(pack['coverage']['by_country'])}).",
        "",
        "## Domains (complaint share of classified rows)",
    ]
    for d in pack["domains"]:
        share = "–" if d["complaint_share"] is None else f"{d['complaint_share']:.0%}"
        out.append(f"- {d['name']}: {d['complaints']} complaints, {d['likes']} likes ({share})")
    out += ["", "## Top complaint themes"]
    for t in pack["top_complaints"]:
        out.append(
            f"- **{t['theme']}** ({t['domain']}, subsystem {t['subsystem'] or 'none'}): "
            f"{t['complaints']} complaints "
            f"(defect {t['defects']}, difficult {t['difficult_to_use']}, wants {t['wants']})"
        )
        out += [f'  - "{q["text"]}" [{q["evidence_ref"]}]' for q in t["quotes"]]
    out += ["", "## Top strengths"]
    for t in pack["top_strengths"]:
        out.append(f"- **{t['theme']}** ({t['domain']}): {t['likes']} likes")
        out += [f'  - "{q["text"]}" [{q["evidence_ref"]}]' for q in t["quotes"][:1]]
    for s in pack["studies"]:
        out += ["", f"## Study {s['study']}"]
        out.append("Weakest: " + "; ".join(f"{m['attribute']} {m['score']}" for m in s["weakest"]))
        out.append(
            "Strongest: " + "; ".join(f"{m['attribute']} {m['score']}" for m in s["strongest"])
        )
    out += ["", "## Equipment optional on every variant (Germany catalogue)"]
    out += [
        f"- {e['item']} ({e['price_eur']:.0f} EUR) [{e['evidence_ref']}]"
        for e in pack["equipment"]["optional_on_all_variants"]
    ]
    out += ["", "## Sales (units)", "```", json.dumps(pack["sales"]["by_year"]), "```"]
    out += [
        "",
        "## CPM subsystems: the same customer rows in the engineering view",
        "Theme to subsystem mapping and weights (share of the development effort of a new "
        f"generation) are assumptions. {pack['subsystem_rows_unassigned']} rows belong to no "
        "subsystem."
        + "".join(
            f" {a['name']} is not on this vehicle ({a['rows']} rows fall there)."
            for a in pack["subsystems_absent"]
        ),
    ]
    out += [
        f"- {s['name']} `{s['subsystem']}` (weight {s['weight']}): {s['complaints']} complaints, "
        f"{s['likes']} likes"
        + (f"; most criticised: {', '.join(s['top_criticised'])}" if s["top_criticised"] else "")
        for s in pack["subsystems"]
    ]
    out += ["", f"## Market and competition evidence (market {pack['market']})"]
    for m in pack["market_evidence"]:
        src = m["source"]
        out.append(
            f"- [{m['kind']}, level {m['level']}, {m['basis']}, {src['type']} source] "
            f"{m['statement']} ({src['title']}, {src['date']}; subsystem {m['subsystem']}) "
            f"[{m['evidence_ref']}]" + (f" Note: {m['note']}" if m["note"] else "")
        )
        if m["contradiction"]:
            c = m["contradiction"]
            out.append(f"  - contradiction, for: {c['for']} Against: {c['against']}")
    if not pack["market_evidence"]:
        out.append("- None stored for this market.")
    ext = pack["external_evidence"]
    if ext:
        out += [
            "",
            f"## External evidence (market {pack['market']} and worldwide rows; the rows come "
            "from get_external_evidence)",
            f"- {ext['rows']} rows, {ext['about_this_vehicle']} about this vehicle, "
            f"{ext['worldwide_only']} worldwide only, {ext['not_confirmed_on_the_page']} not "
            "confirmed on the fetched page.",
            "- Rows per subsystem: "
            + (", ".join(f"{k} {n}" for k, n in ext["by_subsystem"].items()) or "none")
            + ".",
            "- Topics: " + (", ".join(ext["topics"]) or "none") + ".",
        ]
    out += ["", f"## Strongest findings (market {pack['market']})"]
    out += [
        f"- [{f['evidence_level']}] {f['title']} ({f['kind']}, {f['evidence_count']} evidence) `{f['id']}`"
        for f in pack["findings"]
    ]
    return "\n".join(out) + "\n"
