"""Gap classification: fill verbatims that carry unclassified rows, from the canonical taxonomy."""

from __future__ import annotations

import hashlib
import json
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.classify.fewshot import nearest_examples
from tracepoint.classify.prompts import GAP_PROMPT_VERSION, gap_system_prompt, gap_user_prompt
from tracepoint.classify.schemas import GapClassification
from tracepoint.core.audit import record_event
from tracepoint.core.settings import get_settings
from tracepoint.db.models import (
    Run,
    TaxonomyLevel2,
    TaxonomyLevel3,
    Verbatim,
    VerbatimClassification,
)
from tracepoint.llm.gateway import LlmGateway, LlmRequest, LlmResult
from tracepoint.llm.pricing import estimate_tokens
from tracepoint.taxonomy.extract import normalise_name

ACTOR = "agent:classifier"


@dataclass
class TaxonomyIndex:
    level2_by_name: dict[str, TaxonomyLevel2]
    level3_by_name: dict[str, TaxonomyLevel3]
    level2_lower: dict[str, TaxonomyLevel2]
    level3_lower: dict[str, TaxonomyLevel3]

    @classmethod
    def load(cls, session: Session) -> TaxonomyIndex:
        l2 = list(session.scalars(select(TaxonomyLevel2)))
        l3 = list(session.scalars(select(TaxonomyLevel3)))
        return cls(
            {t.name: t for t in l2},
            {t.name: t for t in l3},
            {t.name.lower(): t for t in l2},
            {t.name.lower(): t for t in l3},
        )

    def system_prompt(self) -> str:
        l2 = sorted(
            (
                (t.name, t.domain_key)
                for t in self.level2_by_name.values()
                if t.status == "canonical"
            ),
            key=lambda x: x[0].lower(),
        )
        l3 = sorted(
            ((t.name, t.polarity) for t in self.level3_by_name.values() if t.status == "canonical"),
            key=lambda x: x[0].lower(),
        )
        return gap_system_prompt(l2, l3)

    def resolve_level2(self, name: str) -> TaxonomyLevel2 | None:
        n = normalise_name(name)
        return self.level2_by_name.get(n) or self.level2_lower.get(n.lower())

    def resolve_level3(self, name: str) -> TaxonomyLevel3 | None:
        n = normalise_name(name)
        return self.level3_by_name.get(n) or self.level3_lower.get(n.lower())


def select_targets(session: Session, vehicle_code: str, limit: int | None = None) -> list[Verbatim]:
    """Verbatims of the vehicle that carry at least one unclassified row and no LLM labels yet."""
    unclassified = select(VerbatimClassification.verbatim_id).where(
        VerbatimClassification.status == "unclassified"
    )
    already = select(VerbatimClassification.verbatim_id).where(
        VerbatimClassification.origin == "llm"
    )
    stmt = (
        select(Verbatim)
        .where(
            Verbatim.vehicle_code == vehicle_code,
            Verbatim.id.in_(unclassified),
            Verbatim.id.notin_(already),
        )
        .order_by(Verbatim.id)
    )
    if limit:
        stmt = stmt.limit(limit)
    return list(session.scalars(stmt))


def build_request(
    session: Session,
    verbatim: Verbatim,
    system_prompt: str,
    k: int = 8,
    *,
    exclude_self: bool = True,
) -> LlmRequest:
    examples = nearest_examples(
        session,
        verbatim.vehicle_code,
        verbatim.text,
        k=k,
        exclude_ids={verbatim.id} if exclude_self else None,
    )
    return LlmRequest(
        purpose="gap_classification",
        system=system_prompt,
        user=gap_user_prompt(verbatim.text, examples),
        prompt_version=GAP_PROMPT_VERSION,
        schema_name="gap_classification",
        tier="bulk",
        max_output_tokens=800,
        metadata={"verbatim_id": verbatim.id, "examples": len(examples)},
    )


def existing_pairs(
    session: Session, verbatim_id: str
) -> set[tuple[str | None, str | None, str | None]]:
    rows = session.scalars(
        select(VerbatimClassification).where(VerbatimClassification.verbatim_id == verbatim_id)
    ).all()
    return {(c.feedback_type, c.level2_id, c.level3_id) for c in rows if c.level2_id}


def apply_result(
    session: Session,
    run: Run,
    index: TaxonomyIndex,
    verbatim: Verbatim,
    result: LlmResult,
) -> dict[str, int]:
    parsed: GapClassification = result.parsed
    stats = Counter()
    pairs = existing_pairs(session, verbatim.id)
    count_existing = len(
        session.scalars(
            select(VerbatimClassification.id).where(
                VerbatimClassification.verbatim_id == verbatim.id
            )
        ).all()
    )
    added: list[dict[str, Any]] = []
    for label in parsed.labels:
        l2 = index.resolve_level2(label.level2)
        l3 = index.resolve_level3(label.level3)
        status = "canonical"
        proposal_name = None
        if label.new_theme is not None or l2 is None:
            proposal_name = normalise_name(
                label.new_theme.name if label.new_theme else label.level2
            )
            l2 = index.resolve_level2(proposal_name)
            if l2 is None:
                l2 = TaxonomyLevel2(
                    id=f"L2-P{len(index.level2_by_name) + 1:03d}",
                    name=proposal_name,
                    domain_key=None,
                    origin="llm",
                    status="proposed",
                    notes=(
                        label.new_theme.reason
                        if label.new_theme
                        else "proposed by the classifier (no canonical match)"
                    )[:2000],
                )
                session.add(l2)
                session.flush()
                index.level2_by_name[l2.name] = l2
                index.level2_lower[l2.name.lower()] = l2
                record_event(
                    session,
                    actor_type="agent",
                    actor_id=ACTOR,
                    action="taxonomy.proposed",
                    entity_type="taxonomy_level2",
                    entity_id=l2.id,
                    run_id=run.id,
                    after={
                        "name": l2.name,
                        "closest_existing": label.new_theme.closest_existing
                        if label.new_theme
                        else None,
                        "reason": l2.notes,
                    },
                    model_id=result.model,
                    prompt_version=GAP_PROMPT_VERSION,
                    rationale="New theme proposal: needs human approval before it counts in aggregates",
                )
                stats["proposals"] += 1
            status = "proposed" if l2.status != "canonical" else status
        if l3 is None:
            status = "proposed"
        key = (label.feedback_type, l2.id, l3.id if l3 else None)
        if key in pairs:
            stats["duplicates_skipped"] += 1
            continue
        pairs.add(key)
        count_existing += 1
        row = VerbatimClassification(
            id=f"{verbatim.id}#L{count_existing}",
            verbatim_id=verbatim.id,
            row_no=None,
            feedback_type=label.feedback_type,
            level2_id=l2.id,
            level3_id=l3.id if l3 else None,
            level2_raw=label.level2,
            level3_raw=label.level3,
            combined_raw=f"{l2.name} : {label.level3}",
            origin="llm",
            status=status,
            confidence=max(0.0, min(1.0, float(label.confidence))),
            rationale=label.rationale[:2000],
            model_id=result.model,
            prompt_version=GAP_PROMPT_VERSION,
            run_id=run.id,
            locator={"llm_call_id": result.llm_call_id, "input_hash": result.input_hash},
        )
        session.add(row)
        added.append(
            {
                "id": row.id,
                "feedback_type": label.feedback_type,
                "level2": l2.name,
                "level3": label.level3,
                "status": status,
                "confidence": row.confidence,
            }
        )
        stats["labels_added"] += 1
    session.flush()
    record_event(
        session,
        actor_type="agent",
        actor_id=ACTOR,
        action="classification.llm_added",
        entity_type="verbatim",
        entity_id=verbatim.id,
        run_id=run.id,
        after={
            "is_product_feedback": parsed.is_product_feedback,
            "labels": added,
            "note": parsed.note,
            "llm_call_id": result.llm_call_id,
            "cached": result.cached,
        },
        model_id=result.model,
        prompt_version=GAP_PROMPT_VERSION,
        rationale="Gap classification from the canonical taxonomy; given labels are never overwritten",
    )
    if not parsed.is_product_feedback:
        stats["not_product_feedback"] += 1
    return dict(stats)


def run_gap_classification(
    session: Session,
    run: Run,
    vehicle_code: str,
    gateway: LlmGateway | None,
    *,
    limit: int | None = None,
    dry_run: bool = False,
    batch_size: int = 50,
) -> dict[str, Any]:
    index = TaxonomyIndex.load(session)
    system_prompt = index.system_prompt()
    targets = select_targets(session, vehicle_code, limit)
    stats: Counter = Counter({"targets": len(targets)})
    if dry_run or gateway is None:
        requests = [
            build_request(session, v, system_prompt) for v in targets[: min(len(targets), 25)]
        ]
        est_user = (
            sum(estimate_tokens(r.user) for r in requests) / max(1, len(requests))
            if requests
            else 0
        )
        out_dir = get_settings().data_dir / "llm" / "dry_run"
        out_dir.mkdir(parents=True, exist_ok=True)
        if requests:
            sample = Path(out_dir / f"{vehicle_code}_gap_sample.txt")
            sample.write_text(
                f"=== SYSTEM ===\n{requests[0].system}\n\n=== USER ===\n{requests[0].user}\n",
                encoding="utf-8",
            )
            stats["sample_prompt"] = str(sample)  # type: ignore[assignment]
        stats["system_tokens_est"] = estimate_tokens(system_prompt)
        stats["avg_user_tokens_est"] = int(est_user)
        stats["total_input_tokens_est"] = int(
            len(targets) * (estimate_tokens(system_prompt) + est_user)
        )
        record_event(
            session,
            actor_type="agent",
            actor_id=ACTOR,
            action="classification.dry_run",
            entity_type="vehicle",
            entity_id=vehicle_code,
            run_id=run.id,
            after=dict(stats),
        )
        return dict(stats)
    for start in range(0, len(targets), batch_size):
        batch = targets[start : start + batch_size]
        requests = [build_request(session, v, system_prompt) for v in batch]
        results = gateway.complete_many(requests, GapClassification)
        for verbatim, res in zip(batch, results, strict=True):
            if isinstance(res, Exception):
                stats["errors"] += 1
                record_event(
                    session,
                    actor_type="agent",
                    actor_id=ACTOR,
                    action="classification.failed",
                    entity_type="verbatim",
                    entity_id=verbatim.id,
                    run_id=run.id,
                    after={"error": str(res)[:500]},
                )
                continue
            stats["cached"] += int(res.cached)
            for k, v in apply_result(session, run, index, verbatim, res).items():
                stats[k] += v
            stats["classified"] += 1
        session.commit()
    stats["cost_usd"] = round(gateway.spent_usd, 4)  # type: ignore[assignment]
    record_event(
        session,
        actor_type="agent",
        actor_id=ACTOR,
        action="classification.run_finished",
        entity_type="vehicle",
        entity_id=vehicle_code,
        run_id=run.id,
        after=dict(stats),
    )
    return dict(stats)


OFFLINE_MODEL = "assistant:claude-opus-5-5"


def gap_file(vehicle_code: str) -> Path:
    return get_settings().config_dir / "classifications" / f"{vehicle_code}_gaps.jsonl"


def import_gap_file(
    session: Session, run: Run, vehicle_code: str, path: Path | None = None
) -> dict[str, Any]:
    """Apply gap classifications authored offline: one JSON object per line, ``{"id": <verbatim
    id>, **GapClassification}``. The file is committed, so the labels survive re-ingestion (which
    deletes all classification rows of the vehicle) and a fresh database on another machine."""
    path = path or gap_file(vehicle_code)
    stats: Counter = Counter()
    if not path.exists():
        return {"file": None}
    index = TaxonomyIndex.load(session)
    targets = {v.id: v for v in select_targets(session, vehicle_code)}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        data = json.loads(line)
        verbatim = targets.get(data.pop("id"))
        if verbatim is None:
            stats["skipped"] += 1  # unknown id or already imported
            continue
        parsed = GapClassification.model_validate(data)
        if not parsed.labels:
            stats["no_labels"] += 1
            continue
        result = LlmResult(
            parsed=parsed,
            text=line,
            model=OFFLINE_MODEL,
            input_tokens=None,
            cached_tokens=None,
            output_tokens=None,
            cost_estimate_usd=None,
            cached=False,
            llm_call_id=None,
            input_hash=hashlib.sha256(line.encode()).hexdigest(),
        )
        for k, v in apply_result(session, run, index, verbatim, result).items():
            stats[k] += v
        stats["classified"] += 1
    stats["file"] = path.name  # type: ignore[assignment]
    record_event(
        session,
        actor_type="agent",
        actor_id=ACTOR,
        action="classification.import_finished",
        entity_type="vehicle",
        entity_id=vehicle_code,
        run_id=run.id,
        after=dict(stats),
        model_id=OFFLINE_MODEL,
        prompt_version=GAP_PROMPT_VERSION,
    )
    return dict(stats)
