"""The analyses as a product manager reads them (D-100).

``tracepoint agent analyze`` and ``agent series`` store everything a run produced: the model's
answer, the effort engine's estimates, the citations, the trace. The Markdown brief beside the
JSON is written for reading in a file. These views are the same briefs as data for a screen:
sorted into the groups a product manager decides in (change now, change with the next
generation, keep; complaints, wishes, weak study scores; the five decisions of a series), every
code in words (``labels``), every sentence of the agent in plain words (``text.plain``), every
reference resolved against the evidence store (``refs.describe``). Nothing is computed here that
the run did not compute: the figures are the effort engine's, the decisions the agent's.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

from sqlalchemy.orm import Session

from tracepoint.briefs import store
from tracepoint.briefs.labels import (
    BORDERLINE_BELOW,
    CONFIDENCE,
    EFFORT_STATUS,
    FLAG_LEVEL,
    FLAG_RULE,
    HORIZON_SHORT,
    INSIGHT_GROUP,
    INSIGHT_GROUPS,
    LAYER_SHORT,
    MARKET,
    PROPOSAL_GROUPS,
    REGION_WEIGHT,
    SERIES_DECISION,
    SERIES_DECISION_EXPLAIN,
    domain_names,
    effort_decisions,
)
from tracepoint.briefs.refs import describe, evidence
from tracepoint.briefs.text import plain, plain_list
from tracepoint.effort.subsystems import subsystem_names


def _check(flag: dict[str, Any]) -> dict[str, Any]:
    rule = str(flag["rule"])
    return {
        "level": flag["level"],
        "levelLabel": FLAG_LEVEL.get(flag["level"], flag["level"]),
        "rule": rule,
        "ruleLabel": FLAG_RULE.get(rule, f"rule {rule}"),
        "text": plain(flag["text"]),
    }


def _checks(flags: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """What the product manager has to look at; informational notes stay in the stored run."""
    return [_check(f) for f in flags if f["level"] in ("warning", "conflict")]


def _footprint(subsystems: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [
        {
            "key": s["subsystem"],
            "name": s["name"],
            "effortPct": s["effort_pct"],
            "risk": s["risk"],
            "path": s["path"],
        }
        for s in subsystems
    ]


def _estimate(e: dict[str, Any]) -> dict[str, Any]:
    """The figures of one estimate or package, with their words."""
    stable = e["decision_stable_pct"]
    return {
        "effortPct": e["effort_pct"],
        "p5": e["p5"],
        "p95": e["p95"],
        "decision": e["decision"],
        "decisionLabel": effort_decisions().get(e["decision"], e["decision"]),
        "stablePct": stable,
        "borderline": stable < BORDERLINE_BELOW,
        "layer": e["layer"],
        "layerLabel": LAYER_SHORT.get(e["layer"], e["layer"]),
        "size": e["size"],
        "certification": bool(e.get("certification", e.get("certification_add_on", False))),
        "subsystems": _footprint(e.get("subsystems", [])),
    }


def effort_view(e: dict[str, Any]) -> dict[str, Any]:
    """The effort engine's answer for one proposal or topic."""
    source = e.get("source")
    view: dict[str, Any] = {
        "status": e["status"],
        "statusLabel": EFFORT_STATUS.get(e["status"], e["status"]),
        "basis": f"from the {source}" if source else None,
        "analystProfile": bool(source and "analyst" in source),
        "checks": _checks(e.get("flags", [])),
    }
    if e["status"] == "estimated":
        view |= _estimate(e)
    return view


def package_view(p: dict[str, Any]) -> dict[str, Any]:
    """A horizon's proposals combined per subsystem by the engine, so shared work counts once."""
    return {
        "horizon": p["horizon"],
        "label": HORIZON_SHORT.get(p["horizon"], p["horizon"]),
        "proposals": p["proposals"],
        "sumOfSinglePct": p["sum_of_single_pct"],
        **_estimate(p),
        "notCounted": plain_list(p.get("not_counted")),
        "checks": _checks(p.get("flags", [])),
    }


def _run(data: dict[str, Any]) -> dict[str, Any]:
    trace = data.get("trace", {})
    return {
        "id": data["run_id"],
        "ranAt": store.run_time(data["run_id"]),
        "model": data["model"],
        "promptVersion": data["prompt_version"],
        "steps": trace.get("steps"),
        "toolCalls": len(trace.get("tool_calls", [])),
        "costUsd": trace.get("cost_usd"),
    }


def _subsystems(counts: dict[str, int]) -> list[dict[str, Any]]:
    names = subsystem_names()
    return [
        {"key": k, "name": names.get(k, k), "references": n}
        for k, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    ]


def _origin(path: Path, origin: str) -> dict[str, str]:
    return {"origin": origin, "file": store.summary_file(path)}


def situation_brief(
    session: Session, key: str, data: dict[str, Any], path: Path, origin: str
) -> dict[str, Any]:
    """One vehicle in one market or country: the answer, the proposals grouped by what they ask
    of the vehicle, what customers say grouped by kind, what stays open."""
    a, effort = data["analysis"], data["effort"]
    recs = list(zip(a["recommendations"], effort["recommendations"], strict=True))
    insights = list(zip(a["insights"], data["subsystems"]["insights"], strict=True))
    described = describe(
        session, [r for x in a["recommendations"] + a["insights"] for r in x["evidence_refs"]]
    )
    loose = set(data["citations"].get("unverified_quotes", []))
    domains = domain_names()

    proposals = []
    for n, (r, e) in enumerate(recs, 1):
        keep = not r["changes_vehicle"] or e["status"] == "no_vehicle_change"
        proposals.append(
            {
                "n": n,
                "group": "keep" if keep else ("now" if r["horizon"] == "H1" else "next"),
                "title": plain(r["title"]),
                "proposal": plain(r["proposal"]),
                "why": plain(r["rationale"]),
                "horizon": r["horizon"],
                "horizonLabel": HORIZON_SHORT[r["horizon"]],
                "requirement": r["related_requirement"],
                "effort": effort_view(e),
                "evidence": evidence(r["evidence_refs"], described),
            }
        )
    customers = []
    for group, label in INSIGHT_GROUPS:
        items = [
            {
                "title": plain(i["title"]),
                "statement": plain(i["statement"]),
                # a customer's words, as written; a quote not found in its verbatim is left out
                "quote": i["customer_quote"] if i["customer_quote"] not in loose else None,
                "domain": i["domain"],
                "domainLabel": domains.get(i["domain"], i["domain"]),
                "confidence": i["confidence"],
                "confidenceLabel": CONFIDENCE.get(i["confidence"], i["confidence"]),
                "subsystems": _subsystems(sub),
                "evidence": evidence(i["evidence_refs"], described),
            }
            for i, sub in insights
            if INSIGHT_GROUP.get(i["kind"], "context") == group
        ]
        if items:
            customers.append({"group": group, "label": label, "items": items})
    return {
        "key": key,
        "kind": "situation",
        "title": data["scope"],
        "vehicle": data["vehicle"],
        "market": data["market"],
        "country": data.get("country"),
        **_origin(path, origin),
        "run": _run(data) | {"contextPack": data.get("context_pack")},
        "headline": plain(a["headline"]),
        "summary": plain(a["summary"]),
        "coverage": plain(a["data_coverage"]),
        "proposalGroups": [
            {
                "group": g,
                "label": label,
                "proposals": [p["n"] for p in proposals if p["group"] == g],
            }
            for g, label in PROPOSAL_GROUPS
            if any(p["group"] == g for p in proposals)
        ],
        "proposals": proposals,
        "packages": [package_view(p) for p in effort["packages"]],
        "customers": customers,
        "assumptions": plain_list(a["assumptions_and_gaps"]),
        "openChecks": plain_list(effort["open_faults"]),
        "effortMethod": effort["method"],
        "modelHash": effort["model_hash"],
        "citations": {
            "cited": data["citations"]["cited"],
            "unknown": data["citations"]["unknown"],
            "quotesLeftOut": len(loose),
        },
    }


def series_brief(
    session: Session, key: str, data: dict[str, Any], path: Path, origin: str
) -> dict[str, Any]:
    """One series across its regions: what to change, for which regions, now or with the next
    generation; the topics sorted into the five decisions."""
    a, effort = data["analysis"], data["effort"]
    rows = list(zip(a["topics"], data["topics"], effort["recommendations"], strict=True))
    described = describe(session, [r for t in a["topics"] for r in t["evidence_refs"]])
    labels = [r["label"] for r in data["regions"]]
    expects = {x["region"]: x["expects"] for x in a["regions"]}
    regions = [
        {
            "label": r["label"],
            "name": MARKET.get(r["label"], r["name"]),
            "vehicle": r["vehicle"],
            "market": r["market"],
            "verbatims": r["verbatims"],
            "sales2025": r["sales_2025"],
            "sales2030": r["sales_2030"],
            "complaintRows": r.get("complaint_rows"),
            "likeRows": r.get("like_rows"),
            "findings": r.get("findings"),
            "requirements": r.get("requirements"),
            "study": r.get("study"),
            "expects": plain_list(expects.get(r["label"])),
        }
        for r in data["regions"]
    ]
    topics = []
    for n, (t, computed, e) in enumerate(rows, 1):
        targets = list(t["target_regions"])
        everywhere = bool(targets) and set(targets) >= set(labels)
        topics.append(
            {
                "n": n,
                "title": plain(t["title"]),
                "decision": t["decision"],
                "decisionLabel": SERIES_DECISION[t["decision"]],
                "targetRegions": targets,
                "everywhere": everywhere,
                "action": plain(t["action"]),
                "why": plain(t["why"]),
                "ourOffer": plain(t["our_offer"]),
                "rivals": plain(t["rivals"]),
                "confidence": t["confidence"],
                "confidenceLabel": CONFIDENCE.get(t["confidence"], t["confidence"]),
                "regions": [
                    {
                        "region": s["region"],
                        "customers": plain(s["customers"]),
                        "market": plain(s["market"]),
                        "weight": s["weight"],
                        "weightLabel": REGION_WEIGHT.get(s["weight"], s["weight"]),
                    }
                    for s in t["regions"]
                ],
                "requirement": t["related_requirement"],
                "effort": effort_view(e),
                "subsystems": _subsystems(computed.get("subsystems", {})),
                "evidence": evidence(t["evidence_refs"], described)
                | {"byRegion": computed.get("evidence_by_region", {})},
            }
        )
    o = a["optimum_version"]
    regional = {x["region"]: plain_list(x["items"]) for x in o["regional"]}
    return {
        "key": key,
        "kind": "series",
        "title": f"BMW {data['series']}: what to change, for whom, and when",
        "series": data["series"],
        "vehicle": data["lead_vehicle"],
        **_origin(path, origin),
        "run": _run(data) | {"packVersion": data.get("pack_version")},
        "headline": plain(a["headline"]),
        "answer": plain(a["answer"]),
        "regions": regions,
        "decisions": [
            {
                "decision": d,
                "label": label,
                "explain": SERIES_DECISION_EXPLAIN[d],
                "topics": [t["n"] for t in topics if t["decision"] == d],
            }
            for d, label in SERIES_DECISION.items()
            if any(t["decision"] == d for t in topics)
        ],
        "topics": topics,
        "packages": [package_view(p) for p in effort["packages"]],
        "optimum": {
            "everyMarket": plain_list(o["every_market"]),
            "regional": [{"region": label, "items": regional.get(label, [])} for label in labels],
            "nextGeneration": plain_list(o["next_generation"]),
            "keep": plain_list(o["keep"]),
        },
        "unknowns": plain_list(a["unknowns"]),
        "openChecks": plain_list(effort["open_faults"]),
        "effortMethod": effort["method"],
        "modelHash": effort["model_hash"],
        "citations": {
            "cited": data["citations"]["cited"],
            "unknown": data["citations"]["unknown"],
        },
    }


def brief(session: Session, key: str) -> dict[str, Any] | None:
    """The brief of a stored analysis, None for a key that is not stored."""
    hit = store.load(key)
    if hit is None:
        return None
    data, path, origin = hit
    build = series_brief if store.is_series(data) else situation_brief
    return build(session, key, data, path, origin)
