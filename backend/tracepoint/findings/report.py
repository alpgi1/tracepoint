"""Markdown rendering of the finding list for a vehicle × market."""

from __future__ import annotations

from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.db.models import Finding, FindingEvidence, FindingLink


def render_findings(session: Session, vehicle_code: str, market: str | None) -> str:
    findings = list(
        session.scalars(
            select(Finding)
            .where(
                Finding.vehicle_code == vehicle_code,
                Finding.market_code == market,
                Finding.status != "withdrawn",
            )
            .order_by(Finding.layer, Finding.severity_score.desc().nulls_last())
        )
    )
    evidence = defaultdict(list)
    for e in session.scalars(
        select(FindingEvidence).where(FindingEvidence.finding_id.in_([f.id for f in findings]))
    ):
        evidence[e.finding_id].append(e)
    links = defaultdict(list)
    for ln in session.scalars(
        select(FindingLink).where(FindingLink.from_finding_id.in_([f.id for f in findings]))
    ):
        links[ln.from_finding_id].append(ln)
    out = [
        f"# Findings – {vehicle_code}, market {market or 'ALL'}",
        "",
        f"{len(findings)} findings (status, evidence level, version in brackets). Evidence references resolve through the API (`/verbatims/{{id}}`, `/studies`, `/equipment`).",
        "",
    ]
    by_layer: dict[str, list[Finding]] = defaultdict(list)
    for f in findings:
        by_layer[f.layer].append(f)
    for layer, items in by_layer.items():
        out += [f"## {layer.replace('_', ' ').title()} ({len(items)})", ""]
        for f in items:
            out.append(f"### {f.id}")
            out.append(
                f"**{f.title}** [{f.status}, level {f.evidence_level}, v{f.version}, domain {f.domain_key}, severity {f.severity_score}]"
            )
            out.append("")
            out.append(f.statement)
            out.append("")
            ev = evidence.get(f.id, [])
            out.append(
                "Evidence: "
                + ", ".join(f"`{e.evidence_ref}`" for e in ev[:12])
                + (f" … (+{len(ev) - 12})" if len(ev) > 12 else "")
            )
            for ln in links.get(f.id, []):
                out.append(f"- link **{ln.kind}** → `{ln.to_finding_id}`: {ln.rationale}")
            out.append("")
    return "\n".join(out)
