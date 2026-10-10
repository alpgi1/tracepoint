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
from tracepoint.reports.baseline import build_baseline

CONTEXT_PACK_VERSION = "context-pack-v1"
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
    session: Session, vehicle_code: str, market_code: str | None, *, top: int = 8
) -> dict[str, Any]:
    rep = build_baseline(session, vehicle_code, market_code)
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
    return {
        "pack": CONTEXT_PACK_VERSION,
        "generated_at": datetime.now(UTC).isoformat(timespec="seconds"),
        "vehicle": rep["vehicle"],
        "market": rep["market"],
        "coverage": {
            k: cov[k] for k in ("verbatims", "by_source", "by_powertrain", "by_feedback_type")
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
        f"# Context pack – {v['name']} ({v['code']}), market {pack['market']}",
        f"{pack['pack']}, generated {pack['generated_at']}. "
        f"Verbatims: {pack['coverage']['verbatims']}.",
        "",
        "## Domains (complaint share of classified rows)",
    ]
    for d in pack["domains"]:
        share = "–" if d["complaint_share"] is None else f"{d['complaint_share']:.0%}"
        out.append(f"- {d['name']}: {d['complaints']} complaints, {d['likes']} likes ({share})")
    out += ["", "## Top complaint themes"]
    for t in pack["top_complaints"]:
        out.append(
            f"- **{t['theme']}** ({t['domain']}): {t['complaints']} complaints "
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
    out += ["", "## Strongest findings"]
    out += [
        f"- [{f['evidence_level']}] {f['title']} ({f['kind']}, {f['evidence_count']} evidence) `{f['id']}`"
        for f in pack["findings"]
    ]
    return "\n".join(out) + "\n"
