"""Registry of the internal input files and their evidence sources."""

from __future__ import annotations

import hashlib
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.core.settings import REPO_ROOT, get_settings
from tracepoint.db.models import Run, Source


@dataclass(frozen=True)
class InternalFile:
    key: str
    filename: str
    fmt: str
    layer: str
    description: str
    vehicle_code: str | None = None


INTERNAL_FILES: dict[str, InternalFile] = {
    "feedback_f70": InternalFile(
        "feedback_f70",
        "F70_feedback_hackathon.xlsx",
        "xlsx",
        "voice_of_customer",
        "Customer verbatims BMW 1 Series (F70) with VFC classification",
        "F70",
    ),
    "feedback_g60": InternalFile(
        "feedback_g60",
        "G60_feedback_hackathon.xlsx",
        "xlsx",
        "voice_of_customer",
        "Customer verbatims BMW 5 Series (G60) with VFC classification",
        "G60",
    ),
    "feedback_g70": InternalFile(
        "feedback_g70",
        "G70_feedback_hackathon.xlsx",
        "xlsx",
        "voice_of_customer",
        "Customer verbatims BMW 7 Series (G70) with VFC classification",
        "G70",
    ),
    "studies": InternalFile(
        "studies",
        "F70_G60_G68_G70_customer_studies.xlsx",
        "xlsx",
        "quantitative_metrics",
        "Customer studies: CN/EU 2025 attribute means and US 2025 rating distributions",
    ),
    "sales": InternalFile(
        "sales",
        "sales_volumes.xlsx",
        "xlsx",
        "portfolio_offering",
        "Sales volumes by market: 2024, 2025 actual and 2030 forecast",
    ),
    "optionlist_f70": InternalFile(
        "optionlist_f70",
        "F70_OptionList.PDF",
        "pdf",
        "portfolio_offering",
        "German price and equipment catalogue BMW 1 Series (July 2026)",
        "F70",
    ),
    "optionlist_g60": InternalFile(
        "optionlist_g60",
        "G60_OptionList.PDF",
        "pdf",
        "portfolio_offering",
        "German price and equipment catalogue BMW 5 Series Sedan (July 2026)",
        "G60",
    ),
    "optionlist_g70": InternalFile(
        "optionlist_g70",
        "G70_OptionList.PDF",
        "pdf",
        "portfolio_offering",
        "German price and equipment catalogue BMW 7 Series (July 2026)",
        "G70",
    ),
}


def source_id_for(key: str) -> str:
    return "SRC-" + key.upper().replace("_", "-")


def file_path(key: str) -> Path:
    return get_settings().docs_dir / INTERNAL_FILES[key].filename


def sha256_of(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _display_path(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return str(path)


def register_source(session: Session, run: Run, key: str) -> Source:
    """Create or refresh the Source row for an internal file (checksum, size, timestamp)."""
    spec = INTERNAL_FILES[key]
    path = file_path(key)
    if not path.exists():
        raise FileNotFoundError(path)
    checksum = sha256_of(path)
    size = path.stat().st_size
    sid = source_id_for(key)
    src = session.get(Source, sid)
    now = datetime.now(UTC)
    if src is None:
        src = Source(
            id=sid,
            kind="internal_file",
            name=spec.description,
            path_or_url=_display_path(path),
            format=spec.fmt,
            layer=spec.layer,
            checksum=checksum,
            size_bytes=size,
            fetched_at=now,
            reliability="internal",
            notes=f"vehicle={spec.vehicle_code}" if spec.vehicle_code else None,
            created_run_id=run.id,
        )
        session.add(src)
        session.flush()
        record_event(
            session,
            actor_type="system",
            actor_id="ingest.registry",
            action="source.registered",
            entity_type="source",
            entity_id=sid,
            run_id=run.id,
            after={"path": src.path_or_url, "checksum": checksum, "size_bytes": size},
        )
    elif src.checksum != checksum:
        before = {"checksum": src.checksum, "size_bytes": src.size_bytes}
        src.checksum = checksum
        src.size_bytes = size
        src.fetched_at = now
        record_event(
            session,
            actor_type="system",
            actor_id="ingest.registry",
            action="source.updated",
            entity_type="source",
            entity_id=sid,
            run_id=run.id,
            before=before,
            after={"checksum": checksum, "size_bytes": size},
            rationale="Input file content changed since the previous registration",
        )
    return src
