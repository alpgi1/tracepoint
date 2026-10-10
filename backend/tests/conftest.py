"""Test fixtures: a dedicated test database, ingested once per test session from docs/."""

from __future__ import annotations

import os

import pytest
from sqlalchemy.orm import Session

from tracepoint.core.runs import start_run
from tracepoint.core.settings import get_settings
from tracepoint.db.session import drop_schema, init_schema, make_engine


@pytest.fixture(scope="session")
def engine():
    url = os.environ.get("TRACEPOINT_TEST_DATABASE_URL") or get_settings().test_database_url
    eng = make_engine(url)
    drop_schema(eng)
    init_schema(eng)
    yield eng
    eng.dispose()


@pytest.fixture(scope="session")
def ingested(engine):
    """Run the complete internal ingestion once; returns the stats per step."""
    from tracepoint.ingest.optionlists import ingest_optionlist
    from tracepoint.ingest.reference import load_taxonomy, load_vehicles_and_markets
    from tracepoint.ingest.sales import ingest_sales
    from tracepoint.ingest.studies import ingest_studies
    from tracepoint.ingest.verbatims import ingest_verbatims

    stats: dict[str, dict] = {}
    with Session(engine) as session:
        with start_run(session, "test.ingest.reference") as run:
            stats["reference"] = load_vehicles_and_markets(session, run)
            stats["taxonomy"] = load_taxonomy(session, run)
        for code in ("F70", "G60", "G70"):
            with start_run(session, f"test.ingest.verbatims.{code}") as run:
                stats[f"verbatims_{code}"] = ingest_verbatims(session, run, code)
        with start_run(session, "test.ingest.studies") as run:
            stats["studies"] = ingest_studies(session, run)
        with start_run(session, "test.ingest.sales") as run:
            stats["sales"] = ingest_sales(session, run)
        for code in ("F70", "G60", "G70"):
            with start_run(session, f"test.ingest.optionlist.{code}") as run:
                stats[f"optionlist_{code}"] = ingest_optionlist(session, run, code)
    return stats


@pytest.fixture
def session(engine, ingested):
    with Session(engine) as s:
        yield s
