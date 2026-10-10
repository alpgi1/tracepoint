"""Requirement list exports (deliverable D2): Markdown for reading, CSV for spreadsheets."""

from __future__ import annotations

import csv
import io
from typing import Any

from sqlalchemy import case, select
from sqlalchemy.orm import Session

from tracepoint.db.models import Finding, Requirement

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
        ]
    )
    for r in reqs:
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
            ]
        )
    return buf.getvalue()
