"""Append-only audit event log.

Every ingestion, classification, translation, tool call and human decision is recorded here with
actor, time, entity, before / after state and rationale. Events are never updated or deleted.
"""

from __future__ import annotations

import csv
import io
import json
from datetime import UTC, datetime
from typing import Any, Literal

from sqlalchemy import select
from sqlalchemy.orm import Session

from tracepoint.db.models import AuditEvent

ActorType = Literal["human", "agent", "system"]


def record_event(
    session: Session,
    *,
    actor_type: ActorType,
    actor_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    run_id: str | None = None,
    before: dict[str, Any] | None = None,
    after: dict[str, Any] | None = None,
    rationale: str | None = None,
    model_id: str | None = None,
    prompt_version: str | None = None,
    parent_event_id: int | None = None,
) -> AuditEvent:
    event = AuditEvent(
        ts=datetime.now(UTC),
        run_id=run_id,
        actor_type=actor_type,
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        before=before,
        after=after,
        rationale=rationale,
        model_id=model_id,
        prompt_version=prompt_version,
        parent_event_id=parent_event_id,
    )
    session.add(event)
    session.flush()
    return event


def event_to_dict(event: AuditEvent) -> dict[str, Any]:
    return {
        "id": event.id,
        "ts": event.ts.isoformat(),
        "run_id": event.run_id,
        "actor_type": event.actor_type,
        "actor_id": event.actor_id,
        "action": event.action,
        "entity_type": event.entity_type,
        "entity_id": event.entity_id,
        "before": event.before,
        "after": event.after,
        "rationale": event.rationale,
        "model_id": event.model_id,
        "prompt_version": event.prompt_version,
        "parent_event_id": event.parent_event_id,
    }


def export_events(
    session: Session,
    fmt: Literal["json", "csv"] = "json",
    *,
    entity_type: str | None = None,
    entity_id: str | None = None,
    run_id: str | None = None,
) -> str:
    stmt = select(AuditEvent).order_by(AuditEvent.id)
    if entity_type:
        stmt = stmt.where(AuditEvent.entity_type == entity_type)
    if entity_id:
        stmt = stmt.where(AuditEvent.entity_id == entity_id)
    if run_id:
        stmt = stmt.where(AuditEvent.run_id == run_id)
    rows = [event_to_dict(e) for e in session.scalars(stmt)]
    if fmt == "json":
        return json.dumps(rows, ensure_ascii=False, indent=2)
    buf = io.StringIO()
    fields = [
        "id",
        "ts",
        "run_id",
        "actor_type",
        "actor_id",
        "action",
        "entity_type",
        "entity_id",
        "before",
        "after",
        "rationale",
        "model_id",
        "prompt_version",
        "parent_event_id",
    ]
    writer = csv.DictWriter(buf, fieldnames=fields)
    writer.writeheader()
    for row in rows:
        row = dict(row)
        row["before"] = json.dumps(row["before"], ensure_ascii=False) if row["before"] else ""
        row["after"] = json.dumps(row["after"], ensure_ascii=False) if row["after"] else ""
        writer.writerow(row)
    return buf.getvalue()
