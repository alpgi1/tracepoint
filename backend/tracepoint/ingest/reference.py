"""Load reference data (vehicles, markets, countries, taxonomy) from config/ into the database."""

from __future__ import annotations

from typing import Any

import yaml
from sqlalchemy.orm import Session

from tracepoint.core.audit import record_event
from tracepoint.core.settings import get_settings
from tracepoint.db.models import Country, Market, Run, TaxonomyLevel2, TaxonomyLevel3, Vehicle


def _read_yaml(name: str) -> dict[str, Any]:
    path = get_settings().config_dir / name
    with path.open(encoding="utf-8") as fh:
        return yaml.safe_load(fh) or {}


def load_vehicles_and_markets(session: Session, run: Run) -> dict[str, int]:
    vehicles = _read_yaml("vehicles.yaml").get("vehicles", [])
    for v in vehicles:
        row = session.get(Vehicle, v["code"]) or Vehicle(code=v["code"])
        row.name = v["name"]
        row.series = v["series"]
        row.generation = v.get("generation")
        row.segment = v.get("segment")
        row.tier = v.get("tier")
        row.notes = (v.get("notes") or "").strip() or None
        session.add(row)

    markets_cfg = _read_yaml("markets.yaml")
    markets = markets_cfg.get("markets", [])
    for m in markets:
        row = session.get(Market, m["code"]) or Market(code=m["code"])
        row.name = m["name"]
        row.notes = m.get("notes")
        session.add(row)
    countries = markets_cfg.get("countries", {})
    for raw_code, c in countries.items():
        code = str(raw_code).upper()
        row = session.get(Country, code) or Country(code=code)
        row.name = c["name"]
        row.market_code = c["market"]
        session.add(row)
    session.flush()
    counts = {"vehicles": len(vehicles), "markets": len(markets), "countries": len(countries)}
    record_event(
        session,
        actor_type="system",
        actor_id="ingest.reference",
        action="reference.loaded",
        entity_type="config",
        entity_id="vehicles+markets",
        run_id=run.id,
        after=counts,
    )
    return counts


def load_taxonomy(session: Session, run: Run) -> dict[str, int]:
    """Load the canonical VFC taxonomy (config/taxonomy/*.yaml). Missing files load nothing."""
    cfg = get_settings().config_dir / "taxonomy"
    counts = {"level2": 0, "level3": 0}
    l2_path = cfg / "vfc_level2.yaml"
    l3_path = cfg / "vfc_level3.yaml"
    if l2_path.exists():
        with l2_path.open(encoding="utf-8") as fh:
            entries = (yaml.safe_load(fh) or {}).get("entries", [])
        for e in entries:
            row = session.get(TaxonomyLevel2, e["id"]) or TaxonomyLevel2(id=e["id"])
            row.name = e["name"]
            row.domain_key = e.get("domain")
            row.origin = e.get("origin", "given")
            row.status = e.get("status", "canonical")
            row.notes = e.get("notes")
            session.add(row)
        counts["level2"] = len(entries)
    if l3_path.exists():
        with l3_path.open(encoding="utf-8") as fh:
            entries = (yaml.safe_load(fh) or {}).get("entries", [])
        for e in entries:
            row = session.get(TaxonomyLevel3, e["id"]) or TaxonomyLevel3(id=e["id"])
            row.name = e["name"]
            row.polarity = e.get("polarity")
            row.origin = e.get("origin", "given")
            row.status = e.get("status", "canonical")
            row.notes = e.get("notes")
            session.add(row)
        counts["level3"] = len(entries)
    session.flush()
    record_event(
        session,
        actor_type="system",
        actor_id="ingest.reference",
        action="taxonomy.loaded",
        entity_type="config",
        entity_id="taxonomy",
        run_id=run.id,
        after=counts,
    )
    return counts
