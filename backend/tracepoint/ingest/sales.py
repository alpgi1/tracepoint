"""Ingest the sales volume workbook (units by market; 2024, 2025 actual and 2030 forecast)."""

from __future__ import annotations

import openpyxl
from sqlalchemy import delete
from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.db.models import Run, SalesVolume
from tracepoint.ingest.registry import file_path, register_source

SHEET_TO_VEHICLE = {
    "F70": ("F70", None),
    "G60_G68": (
        "G60",
        "Sheet G60_G68 reports the combined volume of G60 and G68 (China long-wheelbase); the G68 share is not given (assumption D-015 area)",
    ),
    "G70": ("G70", None),
}
FORECAST_YEARS = {2030}


def ingest_sales(session: Session, run: Run) -> dict[str, int]:
    source = register_source(session, run, "sales")
    path = file_path("sales")
    session.execute(delete(SalesVolume))
    wb = openpyxl.load_workbook(path, read_only=True, data_only=True)
    rows_out: list[SalesVolume] = []
    for ws in wb.worksheets:
        if ws.title not in SHEET_TO_VEHICLE:
            continue
        vehicle, note = SHEET_TO_VEHICLE[ws.title]
        rows = list(ws.iter_rows(values_only=True))
        header = [str(h).strip() if h is not None else "" for h in rows[0]]
        year_cols = {
            i: int(h.split("_")[1]) for i, h in enumerate(header) if h.startswith("volume_")
        }
        code_col = header.index("market_code")
        for r_idx, row in enumerate(rows[1:], start=2):
            market = str(row[code_col]).strip()
            for col, year in year_cols.items():
                units = int(float(row[col]))
                rows_out.append(
                    SalesVolume(
                        id=f"SAL-{vehicle}-{market}-{year}",
                        vehicle_code=vehicle,
                        market_code=market,
                        year=year,
                        units=units,
                        kind="forecast" if year in FORECAST_YEARS else "actual",
                        note=note,
                        source_id=source.id,
                        locator={"sheet": ws.title, "row": r_idx, "col": col + 1},
                        created_run_id=run.id,
                    )
                )
    session.add_all(rows_out)
    session.flush()
    stats = {"rows": len(rows_out), "sheets": len(SHEET_TO_VEHICLE)}
    record_event(
        session,
        actor_type="system",
        actor_id="ingest.sales",
        action="sales.ingested",
        entity_type="source",
        entity_id=source.id,
        run_id=run.id,
        after=stats,
        rationale=f"Parsed {path.name}; sheet G60_G68 attached to G60 with a combined-volume note",
    )
    return stats
