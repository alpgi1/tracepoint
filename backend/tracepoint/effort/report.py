"""Markdown report of the effort estimates: variations, requirement table, flags, subsystems."""

from __future__ import annotations

from typing import Any


def _range(r: dict[str, Any]) -> str:
    return f"{r['p5']:.1f}–{r['p95']:.1f}" if r["kind"] == "change" else "–"


def _subsystems(r: dict[str, Any], n: int = 4) -> str:
    parts = []
    for s in r["subsystems"][:n]:
        via = f" via {' → '.join(s['path'])}" if s["path"] and len(s["path"]) > 2 else ""
        parts.append(f"{s['name']} {s['effort_pct']:.1f}{via}")
    return "; ".join(parts) or "–"


def render_markdown(
    rows: list[dict[str, Any]],
    variations: list[dict[str, Any]],
    title: str,
    backtest: dict[str, Any] | None = None,
) -> str:
    mhash = rows[0]["model_hash"] if rows else "–"
    out = [
        f"# {title}",
        "",
        "Effort is a share of a new vehicle generation (new vehicle = 100), not money (rule 49). "
        f"CPM model `{mhash}` (`config/effort/model.yaml`), every weight and link is an "
        "assumption, not calibrated (rule 50). Ranges are P5–P95 of the sensitivity runs "
        "(rule 51). Decision: < 15 adapt, 15–50 major revision, ≥ 50 or a K3 platform change "
        "new generation (rule 47).",
        "",
    ]
    if backtest:
        out += [
            f"Back-test: {backtest['hits']}/{backtest['anchors']} documented BMW decisions "
            f"classified correctly ({backtest['independent_hits']}/"
            f"{backtest['independent_anchors']} independent), {backtest['runs']} sensitivity "
            f"runs, scope `{backtest['scope']}`.",
            "",
        ]
    if variations:
        out += [
            "## Variations",
            "",
            "Changes of all recommended, not rejected requirements combined per subsystem "
            "(rule 45): shared work is counted once, the certification add-on once per package.",
            "",
            "| Scenario | Requirements | Effort % | P5–P95 | Decision | Stable % | Sum of single % | Main subsystems |",
            "|---|---|---|---|---|---|---|---|",
        ]
        for v in variations:
            out.append(
                f"| {v['label']} | {v['requirements']} | {v['effort_pct']:.1f} | {_range(v)} | "
                f"{v['decision']} | {v['decision_stable_pct']:.0f} | {v['sum_of_single_pct']:.1f} "
                f"| {_subsystems(v, 3)} |"
            )
        out.append("")
    out += [
        "## Requirements",
        "",
        "| ID | Title | H | Effort % | P5–P95 | Size | Layer | Decision | Flags |",
        "|---|---|---|---|---|---|---|---|---|",
    ]
    for r in sorted(rows, key=lambda x: -x["effort_pct"]):
        flags = ", ".join(sorted({f["level"] for f in r["flags"]})) or "–"
        title_ = r["title"] + ("" if r["recommend"] else " (not recommended)")
        out.append(
            f"| {r['id']} | {title_} | {r['horizon']} | {r['effort_pct']:.1f} | {_range(r)} | "
            f"{r['size']} | {r['layer'] if r['kind'] == 'change' else r['kind']} | "
            f"{r['decision']} | {flags} |"
        )
    flagged = [(r, f) for r in rows for f in r["flags"]]
    order = {"conflict": 0, "warning": 1, "info": 2}
    if flagged:
        out += ["", "## Flags for the PM", ""]
        for r, f in sorted(flagged, key=lambda x: (order[x[1]["level"]], x[0]["id"])):
            out.append(f"* **{f['level']}** {r['id']} (rule {f['rule']}): {f['text']}")
    out += ["", "## Why: affected subsystems (rule 52)", ""]
    for r in sorted(rows, key=lambda x: -x["effort_pct"]):
        if r["kind"] != "change":
            out.append(f"* {r['id']}: {r['kind'].replace('_', ' ')} – {r['note']}")
            continue
        why = "; ".join(
            f"{c['subsystem']} {c['own_impact']:.0%} {c['layer']}" for c in r["changes"]
        )
        cert = ", certification add-on" if r["certification"] else ""
        out.append(f"* {r['id']}: {_subsystems(r)}{cert}. Changes: {why}")
    out.append("")
    return "\n".join(out)
