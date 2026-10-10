"""Blind validation of the gap classifier against verbatims that already carry given labels."""

from __future__ import annotations

import json
import random
from collections import Counter, defaultdict
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import yaml
from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.classify.gap import TaxonomyIndex, build_request
from tracepoint.classify.prompts import GAP_PROMPT_VERSION
from tracepoint.classify.schemas import GapClassification
from tracepoint.core.audit import record_event
from tracepoint.core.settings import REPO_ROOT, get_settings
from tracepoint.db.models import Run, Verbatim, VerbatimClassification
from tracepoint.llm.gateway import LlmGateway

ACTOR = "agent:classifier-validation"


def _display(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def sample_path(vehicle_code: str) -> Path:
    return get_settings().config_dir / "validation" / f"blind_sample_{vehicle_code}.yaml"


def prepare_sample(
    session: Session, vehicle_code: str, n: int = 300, seed: int = 42
) -> dict[str, Any]:
    """Stratified sample (by primary feedback type) of fully classified verbatims; written to config/."""
    unclassified = select(VerbatimClassification.verbatim_id).where(
        VerbatimClassification.status == "unclassified"
    )
    verbatims = session.scalars(
        select(Verbatim).where(
            Verbatim.vehicle_code == vehicle_code,
            Verbatim.id.notin_(unclassified),
            Verbatim.char_len.between(30, 600),
        )
    ).all()
    classes = session.scalars(
        select(VerbatimClassification).where(
            VerbatimClassification.verbatim_id.in_([v.id for v in verbatims]),
            VerbatimClassification.status == "canonical",
        )
    ).all()
    primary: dict[str, str] = {}
    for c in classes:
        if c.feedback_type and c.verbatim_id not in primary:
            primary[c.verbatim_id] = c.feedback_type
    strata: dict[str, list[str]] = defaultdict(list)
    for vid, ft in primary.items():
        strata[ft].append(vid)
    rng = random.Random(seed)
    total = sum(len(v) for v in strata.values())
    chosen: dict[str, list[str]] = {}
    for ft, ids in strata.items():
        ids = sorted(ids)
        rng.shuffle(ids)
        share = max(5, round(n * len(ids) / total)) if total else 0
        chosen[ft] = sorted(ids[:share])
    payload = {
        "vehicle": vehicle_code,
        "created": datetime.now(UTC).isoformat(),
        "seed": seed,
        "requested": n,
        "strata": {
            ft: {"population": len(strata[ft]), "sampled": len(chosen[ft])} for ft in strata
        },
        "ids": sorted(i for ids in chosen.values() for i in ids),
    }
    path = sample_path(vehicle_code)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as fh:
        fh.write(
            "# Blind validation sample: verbatims with given labels, re-classified without them.\n"
        )
        yaml.safe_dump(payload, fh, sort_keys=False, width=100)
    return {
        "vehicle": vehicle_code,
        "sampled": len(payload["ids"]),
        "strata": payload["strata"],
        "path": _display(path),
    }


def _given_labels(
    session: Session, index: TaxonomyIndex, ids: list[str]
) -> dict[str, list[tuple[str, str, str]]]:
    l2 = {t.id: t.name for t in index.level2_by_name.values()}
    l3 = {t.id: t.name for t in index.level3_by_name.values()}
    out: dict[str, list[tuple[str, str, str]]] = defaultdict(list)
    for c in session.scalars(
        select(VerbatimClassification).where(
            VerbatimClassification.verbatim_id.in_(ids),
            VerbatimClassification.status == "canonical",
            VerbatimClassification.origin == "given",
        )
    ):
        if c.level2_id and c.feedback_type:
            out[c.verbatim_id].append(
                (c.feedback_type, l2[c.level2_id], l3.get(c.level3_id or "", c.level3_raw or ""))
            )
    return out


def run_validation(
    session: Session,
    run: Run,
    vehicle_code: str,
    gateway: LlmGateway | None,
    *,
    limit: int | None = None,
    dry_run: bool = False,
) -> dict[str, Any]:
    path = sample_path(vehicle_code)
    if not path.exists():
        raise FileNotFoundError(
            f"{path} missing: run `tracepoint classify prepare-sample --vehicle {vehicle_code}` first"
        )
    with path.open(encoding="utf-8") as fh:
        ids: list[str] = (yaml.safe_load(fh) or {}).get("ids", [])
    if limit:
        ids = ids[:limit]
    index = TaxonomyIndex.load(session)
    system_prompt = index.system_prompt()
    verbatims = {v.id: v for v in session.scalars(select(Verbatim).where(Verbatim.id.in_(ids)))}
    given = _given_labels(session, index, ids)
    if dry_run or gateway is None:
        return {"vehicle": vehicle_code, "sample": len(ids), "dry_run": True}
    requests = [
        build_request(session, verbatims[i], system_prompt, exclude_self=True)
        for i in ids
        if i in verbatims
    ]
    results = gateway.complete_many(requests, GapClassification)
    agree = Counter()
    per_domain: dict[str, Counter] = defaultdict(Counter)
    details = []
    for vid, res in zip([i for i in ids if i in verbatims], results, strict=True):
        if isinstance(res, Exception):
            agree["errors"] += 1
            continue
        parsed: GapClassification = res.parsed
        pred = [(lab.feedback_type, lab.level2, lab.level3) for lab in parsed.labels]
        gold = given.get(vid, [])
        agree["evaluated"] += 1
        ft_ok = any(p[0] in {g[0] for g in gold} for p in pred)
        l2_ok = any(
            index.resolve_level2(p[1]) is not None
            and index.resolve_level2(p[1]).name in {g[1] for g in gold}
            for p in pred
        )
        pair_ok = any(
            index.resolve_level2(p[1]) is not None
            and (index.resolve_level2(p[1]).name, p[2]) in {(g[1], g[2]) for g in gold}
            for p in pred
        )
        l3_ok = any(p[2] in {g[2] for g in gold} for p in pred)
        agree["feedback_type"] += ft_ok
        agree["level2"] += l2_ok
        agree["level3"] += l3_ok
        agree["level2_level3_pair"] += pair_ok
        domains = {
            index.level2_by_name[g[1]].domain_key or "general"
            for g in gold
            if g[1] in index.level2_by_name
        }
        for d in domains:
            per_domain[d]["n"] += 1
            per_domain[d]["level2"] += l2_ok
        details.append(
            {
                "id": vid,
                "gold": gold,
                "pred": pred,
                "feedback_type": ft_ok,
                "level2": l2_ok,
                "level3": l3_ok,
                "pair": pair_ok,
            }
        )
    n = max(1, agree["evaluated"])
    summary = {
        "vehicle": vehicle_code,
        "prompt_version": GAP_PROMPT_VERSION,
        "evaluated": agree["evaluated"],
        "errors": agree["errors"],
        "agreement": {
            k: round(agree[k] / n, 3)
            for k in ("feedback_type", "level2", "level3", "level2_level3_pair")
        },
        "per_domain_level2": {
            d: round(c["level2"] / max(1, c["n"]), 3) for d, c in sorted(per_domain.items())
        },
        "cost_usd": round(gateway.spent_usd, 4),
    }
    out_dir = REPO_ROOT / "reports" / "validation"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / f"{vehicle_code}_{GAP_PROMPT_VERSION}.json").write_text(
        json.dumps({"summary": summary, "details": details}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    md = [
        f"# Blind classification validation – {vehicle_code} ({GAP_PROMPT_VERSION})",
        "",
        f"Evaluated {summary['evaluated']} verbatims, {summary['errors']} errors.",
        "",
        "| Metric | Agreement |",
        "|---|---|",
    ]
    md += [f"| {k} | {v} |" for k, v in summary["agreement"].items()]
    md += [
        "",
        "Level-2 agreement by domain: "
        + ", ".join(f"{d} {v}" for d, v in summary["per_domain_level2"].items()),
        "",
    ]
    (out_dir / f"{vehicle_code}_{GAP_PROMPT_VERSION}.md").write_text(
        "\n".join(md), encoding="utf-8"
    )
    record_event(
        session,
        actor_type="agent",
        actor_id=ACTOR,
        action="classification.validated",
        entity_type="vehicle",
        entity_id=vehicle_code,
        run_id=run.id,
        after=summary,
        prompt_version=GAP_PROMPT_VERSION,
    )
    return summary
