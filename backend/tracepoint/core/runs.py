"""Run registry: every pipeline command executes inside a run with a configuration snapshot."""

from __future__ import annotations

import subprocess
from contextlib import contextmanager
from datetime import UTC, datetime
from typing import Any

from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.core.ids import new_run_id
from tracepoint.core.settings import REPO_ROOT
from tracepoint.db.models import Run


def code_version() -> str:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            cwd=REPO_ROOT,
            capture_output=True,
            text=True,
            check=True,
            timeout=5,
        )
        return out.stdout.strip()
    except Exception:  # noqa: BLE001 - version is informational only
        return "unknown"


@contextmanager
def start_run(session: Session, kind: str, config_snapshot: dict[str, Any] | None = None):
    """Open a run, yield it, and close it as finished or failed. Commits on success."""
    run = Run(
        id=new_run_id(kind),
        kind=kind,
        started_at=datetime.now(UTC),
        status="running",
        config_snapshot=config_snapshot or {},
        code_version=code_version(),
        model_ids={},
    )
    session.add(run)
    session.flush()
    record_event(
        session,
        actor_type="system",
        actor_id="run-registry",
        action="run.started",
        entity_type="run",
        entity_id=run.id,
        run_id=run.id,
        after={"kind": kind, "config_snapshot": run.config_snapshot},
    )
    try:
        yield run
    except Exception as exc:
        run.status = "failed"
        run.finished_at = datetime.now(UTC)
        run.notes = f"{type(exc).__name__}: {exc}"[:2000]
        record_event(
            session,
            actor_type="system",
            actor_id="run-registry",
            action="run.failed",
            entity_type="run",
            entity_id=run.id,
            run_id=run.id,
            after={"error": run.notes},
        )
        session.commit()
        raise
    run.status = "finished"
    run.finished_at = datetime.now(UTC)
    record_event(
        session,
        actor_type="system",
        actor_id="run-registry",
        action="run.finished",
        entity_type="run",
        entity_id=run.id,
        run_id=run.id,
    )
    session.commit()
