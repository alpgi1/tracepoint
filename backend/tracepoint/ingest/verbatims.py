"""Ingest the customer verbatim workbooks (one row per verbatim × classification)."""

from __future__ import annotations

from collections import Counter

import pandas as pd
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.db.models import (
    Country,
    Run,
    TaxonomyLevel2,
    TaxonomyLevel3,
    Verbatim,
    VerbatimClassification,
    VerbatimSegment,
)
from tracepoint.ingest.registry import file_path, register_source
from tracepoint.taxonomy.extract import normalise_name

SHEET = "Feedback_Explorer"
EXPECTED_COLUMNS = [
    "ID",
    "Source",
    "Brand",
    "Sales Description",
    "Country",
    "Derivate (e-code)",
    "Engine Type",
    "Feedback Type",
    "Customer Feedback",
    "Vfc level2 3 Name",
    "Vfc level2 Name",
    "Vfc level3 Name",
]
ENGINE_MAP = {"ICE": "ICE", "BEVE": "BEV", "BEV": "BEV", "PHEV": "PHEV", "MHEV": "MHEV"}
UNCLASSIFIED = {"", "no_class_found"}


def _clear_vehicle(session: Session, vehicle_code: str) -> int:
    ids = select(Verbatim.id).where(Verbatim.vehicle_code == vehicle_code)
    session.execute(delete(VerbatimSegment).where(VerbatimSegment.verbatim_id.in_(ids)))
    n = session.execute(
        delete(VerbatimClassification).where(VerbatimClassification.verbatim_id.in_(ids))
    ).rowcount
    session.execute(delete(Verbatim).where(Verbatim.vehicle_code == vehicle_code))
    return n


def ingest_verbatims(session: Session, run: Run, vehicle_code: str) -> dict[str, int]:
    key = f"feedback_{vehicle_code.lower()}"
    source = register_source(session, run, key)
    path = file_path(key)
    df = pd.read_excel(path, sheet_name=SHEET, dtype=str).fillna("")
    if list(df.columns)[: len(EXPECTED_COLUMNS)] != EXPECTED_COLUMNS:
        raise ValueError(f"Unexpected columns in {path.name}: {list(df.columns)}")

    l2_by_name = {t.name: t.id for t in session.scalars(select(TaxonomyLevel2))}
    l3_by_name = {t.name: t.id for t in session.scalars(select(TaxonomyLevel3))}
    if not l2_by_name:
        raise RuntimeError(
            "Taxonomy is empty: run `tracepoint taxonomy extract` and `ingest reference` first"
        )
    market_by_country = {c.code: c.market_code for c in session.scalars(select(Country))}

    removed = _clear_vehicle(session, vehicle_code)
    session.flush()

    verbatims: dict[str, Verbatim] = {}
    classifications: list[VerbatimClassification] = []
    per_id = Counter()
    dq = Counter()
    unknown_countries: Counter = Counter()

    for idx, row in enumerate(df.to_dict(orient="records")):
        excel_row = idx + 2
        vid = str(row["ID"]).strip()
        text = str(row["Customer Feedback"]).strip()
        country = str(row["Country"]).strip().upper() or None
        engine_raw = str(row["Engine Type"]).strip()
        powertrain = ENGINE_MAP.get(engine_raw, engine_raw or None)
        if engine_raw and engine_raw not in ENGINE_MAP:
            dq["unknown_engine_type"] += 1
        if country and country not in market_by_country:
            unknown_countries[country] += 1
        market = market_by_country.get(country) if country else None
        derivate = str(row["Derivate (e-code)"]).strip()
        if derivate and derivate != vehicle_code:
            dq["derivate_mismatch"] += 1

        v = verbatims.get(vid)
        if v is None:
            v = Verbatim(
                id=vid,
                vehicle_code=vehicle_code,
                source_label=str(row["Source"]).strip(),
                country_code=country if country in market_by_country else None,
                market_code=market,
                powertrain=powertrain,
                brand=str(row["Brand"]).strip() or None,
                sales_description=str(row["Sales Description"]).strip() or None,
                text=text,
                char_len=len(text),
                source_id=source.id,
                locator={"file": path.name, "sheet": SHEET, "row": excel_row, "id": vid},
                created_run_id=run.id,
            )
            verbatims[vid] = v
            if not text:
                dq["empty_text"] += 1
        elif v.text != text:
            dq["text_mismatch_same_id"] += 1

        per_id[vid] += 1
        l2_raw = normalise_name(row["Vfc level2 Name"])
        l3_raw = normalise_name(row["Vfc level3 Name"])
        fb_type = str(row["Feedback Type"]).strip() or None
        if l2_raw in UNCLASSIFIED:
            status = "unclassified"
            l2_id = None
        elif l2_raw in l2_by_name:
            status = "canonical"
            l2_id = l2_by_name[l2_raw]
        else:
            status = "unresolved"
            l2_id = None
            dq["unresolved_level2"] += 1
        l3_id = l3_by_name.get(l3_raw) if l3_raw not in UNCLASSIFIED else None
        if l3_raw not in UNCLASSIFIED and l3_id is None:
            dq["unresolved_level3"] += 1
        classifications.append(
            VerbatimClassification(
                id=f"{vid}#{per_id[vid]}",
                verbatim_id=vid,
                row_no=excel_row,
                feedback_type=fb_type,
                level2_id=l2_id,
                level3_id=l3_id,
                level2_raw=l2_raw or None,
                level3_raw=l3_raw or None,
                combined_raw=str(row["Vfc level2 3 Name"]).strip() or None,
                origin="given",
                status=status,
                run_id=run.id,
                locator={"file": path.name, "sheet": SHEET, "row": excel_row},
            )
        )

    session.add_all(verbatims.values())
    session.flush()
    for i in range(0, len(classifications), 2000):
        session.add_all(classifications[i : i + 2000])
        session.flush()

    stats = {
        "rows": len(df),
        "verbatims": len(verbatims),
        "classifications": len(classifications),
        "canonical": sum(1 for c in classifications if c.status == "canonical"),
        "unclassified": sum(1 for c in classifications if c.status == "unclassified"),
        "removed_previous": removed,
        **{f"dq_{k}": v for k, v in dq.items()},
    }
    if unknown_countries:
        stats["dq_unknown_countries"] = sum(unknown_countries.values())
    record_event(
        session,
        actor_type="system",
        actor_id="ingest.verbatims",
        action="verbatims.ingested",
        entity_type="source",
        entity_id=source.id,
        run_id=run.id,
        after={**stats, "unknown_countries": dict(unknown_countries)},
        rationale=f"Parsed {path.name}, sheet {SHEET}; one classification row per Excel row",
    )
    return stats
