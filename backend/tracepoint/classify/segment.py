"""Source B segmentation: split call-centre notes into product and process statements."""

from __future__ import annotations

from collections import Counter
from typing import Any

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from tracepoint.classify.prompts import SEG_PROMPT_VERSION, seg_system_prompt, seg_user_prompt
from tracepoint.classify.schemas import Segmentation
from tracepoint.core.audit import record_event
from tracepoint.db.models import Run, Verbatim, VerbatimSegment
from tracepoint.llm.gateway import LlmGateway, LlmRequest
from tracepoint.llm.pricing import estimate_tokens

ACTOR = "agent:segmenter"
LONG_TEXT = 600


def select_targets(session: Session, vehicle_code: str, limit: int | None = None) -> list[Verbatim]:
    done = select(VerbatimSegment.verbatim_id)
    stmt = (
        select(Verbatim)
        .where(
            Verbatim.vehicle_code == vehicle_code,
            Verbatim.id.notin_(done),
            (Verbatim.source_label == "Source B") | (Verbatim.char_len >= LONG_TEXT),
        )
        .order_by(Verbatim.id)
    )
    if limit:
        stmt = stmt.limit(limit)
    return list(session.scalars(stmt))


def build_request(verbatim: Verbatim) -> LlmRequest:
    return LlmRequest(
        purpose="source_b_segmentation",
        system=seg_system_prompt(),
        user=seg_user_prompt(verbatim.text),
        prompt_version=SEG_PROMPT_VERSION,
        schema_name="segmentation",
        tier="bulk",
        max_output_tokens=1200,
        metadata={"verbatim_id": verbatim.id},
    )


def run_segmentation(
    session: Session,
    run: Run,
    vehicle_code: str,
    gateway: LlmGateway | None,
    *,
    limit: int | None = None,
    dry_run: bool = False,
    batch_size: int = 50,
) -> dict[str, Any]:
    targets = select_targets(session, vehicle_code, limit)
    stats: Counter = Counter({"targets": len(targets)})
    if dry_run or gateway is None:
        sys_tokens = estimate_tokens(seg_system_prompt())
        stats["total_input_tokens_est"] = sum(
            sys_tokens + estimate_tokens(v.text) + 20 for v in targets
        )
        record_event(
            session,
            actor_type="agent",
            actor_id=ACTOR,
            action="segmentation.dry_run",
            entity_type="vehicle",
            entity_id=vehicle_code,
            run_id=run.id,
            after=dict(stats),
        )
        return dict(stats)
    for start in range(0, len(targets), batch_size):
        batch = targets[start : start + batch_size]
        results = gateway.complete_many([build_request(v) for v in batch], Segmentation)
        for verbatim, res in zip(batch, results, strict=True):
            if isinstance(res, Exception):
                stats["errors"] += 1
                record_event(
                    session,
                    actor_type="agent",
                    actor_id=ACTOR,
                    action="segmentation.failed",
                    entity_type="verbatim",
                    entity_id=verbatim.id,
                    run_id=run.id,
                    after={"error": str(res)[:500]},
                )
                continue
            parsed: Segmentation = res.parsed
            session.execute(
                delete(VerbatimSegment).where(VerbatimSegment.verbatim_id == verbatim.id)
            )
            rows = []
            for seq, seg in enumerate(parsed.segments, start=1):
                rows.append(
                    VerbatimSegment(
                        id=f"{verbatim.id}#S{seq}",
                        verbatim_id=verbatim.id,
                        seq=seq,
                        text=seg.text[:4000],
                        is_product_feedback=seg.is_product_feedback,
                        reason=seg.reason[:1000],
                        model_id=res.model,
                        run_id=run.id,
                    )
                )
            session.add_all(rows)
            session.flush()
            stats["segmented"] += 1
            stats["segments"] += len(rows)
            stats["product_segments"] += sum(1 for r in rows if r.is_product_feedback)
            stats["cached"] += int(res.cached)
            record_event(
                session,
                actor_type="agent",
                actor_id=ACTOR,
                action="segmentation.llm_added",
                entity_type="verbatim",
                entity_id=verbatim.id,
                run_id=run.id,
                after={
                    "segments": [
                        {"id": r.id, "is_product_feedback": r.is_product_feedback} for r in rows
                    ],
                    "llm_call_id": res.llm_call_id,
                },
                model_id=res.model,
                prompt_version=SEG_PROMPT_VERSION,
            )
        session.commit()
    stats["cost_usd"] = round(gateway.spent_usd, 4)  # type: ignore[assignment]
    record_event(
        session,
        actor_type="agent",
        actor_id=ACTOR,
        action="segmentation.run_finished",
        entity_type="vehicle",
        entity_id=vehicle_code,
        run_id=run.id,
        after=dict(stats),
    )
    return dict(stats)
