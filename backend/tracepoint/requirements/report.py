"""Requirement list exports (deliverable D2): Markdown for reading, CSV for spreadsheets.

Since step 19 an exported row also carries the requirement's effort estimate and its latest gate
G2 decision (``export_rows``), so the list a product manager downloads from the workspace and the
one the CLI writes are the same file."""

from __future__ import annotations

import csv
import io
from typing import Any

from sqlalchemy import case, select
from sqlalchemy.orm import Session

from tracepoint.db.models import AuditEvent, Finding, Requirement

_LEVEL = case({"A": 0, "B": 1, "C": 2}, value=Requirement.evidence_level, else_=3)


def list_requirements(
    session: Session,
    vehicle: str | None = None,
    market: str | None = None,
    include_withdrawn: bool = False,
) -> list[dict[str, Any]]:
    stmt = select(Requirement)
    if vehicle:
        stmt = stmt.where(Requirement.vehicle_code == vehicle)
    if market:
        stmt = stmt.where(Requirement.market_code == market)
    if not include_withdrawn:
        stmt = stmt.where(Requirement.status != "withdrawn")
    rows = session.scalars(
        stmt.order_by(Requirement.priority_score.desc().nulls_last(), _LEVEL, Requirement.id)
    ).all()
    titles = {
        f.id: f.title
        for f in session.scalars(
            select(Finding).where(Finding.id.in_([x.finding_id for r in rows for x in r.findings]))
        )
    }
    return [
        {
            "id": r.id,
            "vehicle": r.vehicle_code,
            "market": r.market_code,
            "domain": r.domain_key,
            "title": r.title,
            "statement": r.statement,
            "recommend": r.recommend,
            "recommend_rationale": r.recommend_rationale,
            "horizon": r.horizon,
            "horizon_rationale": r.horizon_rationale,
            "markets": r.markets,
            "criteria": r.criteria,
            "assumptions": r.assumptions,
            "uncertainties": r.uncertainties,
            "evidence_level": r.evidence_level,
            "priority_score": r.priority_score,
            "status": r.status,
            "version": r.version,
            "findings": [
                {"id": x.finding_id, "role": x.role, "title": titles.get(x.finding_id)}
                for x in r.findings
            ],
        }
        for r in rows
    ]


DECIDED = "requirement.decided"


def export_rows(
    session: Session, vehicle: str | None = None, market: str | None = None
) -> list[dict[str, Any]]:
    """The requirement list with each requirement's effort estimate and latest G2 decision."""
    from tracepoint.effort.store import list_efforts

    rows = list_requirements(session, vehicle, market)
    efforts = {e["id"]: e for e in list_efforts(session, vehicle, market)}
    latest: dict[str, AuditEvent] = {}
    if rows:
        for e in session.scalars(
            select(AuditEvent)
            .where(
                AuditEvent.action == DECIDED,
                AuditEvent.entity_id.in_([r["id"] for r in rows]),
            )
            .order_by(AuditEvent.id)
        ):
            latest[e.entity_id] = e
    for r in rows:
        e = efforts.get(r["id"])
        r["effort"] = (
            {k: e[k] for k in ("effort_pct", "p5", "p95", "decision", "layer", "model_hash")}
            if e and e["kind"] == "change"
            else None
        )
        d = latest.get(r["id"])
        r["decision"] = (
            {
                "status": (d.after or {}).get("status"),
                "by": d.actor_id,
                "at": d.ts.isoformat(),
                "note": d.rationale,
                "version": (d.after or {}).get("version"),
            }
            if d
            else None
        )
    return rows


def render_markdown(reqs: list[dict[str, Any]], heading: str) -> str:
    out = [f"# {heading}", "", f"{len(reqs)} requirements. Priority scores follow in Phase 5.", ""]
    for r in reqs:
        out += [
            f"## {r['id']} – {r['title']}",
            "",
            f"*{r['domain']} · {r['horizon']} · markets {', '.join(r['markets'])} · evidence "
            f"{r['evidence_level']} · {'recommended' if r['recommend'] else 'not recommended'} · "
            f"status {r['status']} (v{r['version']})*",
            "",
            r["statement"],
            "",
            f"**Why:** {r['recommend_rationale']}",
            f"**Horizon:** {r['horizon_rationale']}",
            "",
            "| Market | Metric | Target | Method | Basis |",
            "|---|---|---|---|---|",
        ]
        out += [
            f"| {c['market']} | {c['metric']} | {c['target']} | {c['method']} | {c['basis']} |"
            for c in r["criteria"]
        ]
        out += [
            "",
            "**Findings:** " + "; ".join(f"`{f['id']}` ({f['role']})" for f in r["findings"]),
        ]
        if r["assumptions"]:
            out.append("**Assumptions:** " + "; ".join(r["assumptions"]))
        if r["uncertainties"]:
            out.append("**Uncertainties:** " + "; ".join(r["uncertainties"]))
        if e := r.get("effort"):
            out.append(
                f"**Effort:** {e['effort_pct']} % of a new vehicle generation ({e['decision']}, "
                f"P5 to P95 {e['p5']} to {e['p95']}, layer {e['layer']}), effort model "
                f"{e['model_hash']}, assumptions not calibrated"
            )
        if d := r.get("decision"):
            out.append(
                f"**Decision:** {d['status']} by {d['by']} on {d['at'][:10]} (version "
                f"{d['version']}): {d['note'] or ''}"
            )
        out.append("")
    return "\n".join(out)


def render_csv(reqs: list[dict[str, Any]]) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(
        [
            "id",
            "vehicle",
            "market",
            "domain",
            "title",
            "statement",
            "recommend",
            "rationale",
            "horizon",
            "horizon_rationale",
            "markets",
            "acceptance_criteria",
            "findings",
            "evidence_level",
            "priority_score",
            "assumptions",
            "uncertainties",
            "status",
            "version",
            "effort_pct",
            "effort_p5",
            "effort_p95",
            "effort_decision",
            "effort_layer",
            "effort_model_hash",
            "decision",
            "decided_by",
            "decided_at",
            "decision_note",
        ]
    )
    for r in reqs:
        e, d = r.get("effort") or {}, r.get("decision") or {}
        w.writerow(
            [
                r["id"],
                r["vehicle"],
                r["market"],
                r["domain"],
                r["title"],
                r["statement"],
                int(r["recommend"]),
                r["recommend_rationale"],
                r["horizon"],
                r["horizon_rationale"],
                " ".join(r["markets"]),
                " | ".join(
                    f"{c['market']}: {c['metric']} {c['target']} ({c['basis']})"
                    for c in r["criteria"]
                ),
                " ".join(f["id"] for f in r["findings"]),
                r["evidence_level"],
                r["priority_score"],
                " | ".join(r["assumptions"]),
                " | ".join(r["uncertainties"]),
                r["status"],
                r["version"],
                e.get("effort_pct", ""),
                e.get("p5", ""),
                e.get("p95", ""),
                e.get("decision", ""),
                e.get("layer", ""),
                e.get("model_hash", ""),
                d.get("status", ""),
                d.get("by", ""),
                d.get("at", ""),
                d.get("note", "") or "",
            ]
        )
    return buf.getvalue()
