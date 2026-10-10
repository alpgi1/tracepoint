"""Tracepoint command line interface."""

from __future__ import annotations

import json
from pathlib import Path

import typer
from sqlalchemy.orm import Session

from tracepoint.core.audit import export_events
from tracepoint.core.runs import start_run
from tracepoint.core.settings import get_settings
from tracepoint.db.session import drop_schema, init_schema, make_engine

app = typer.Typer(
    help="Tracepoint: AI-powered customer requirements platform (prototype).", no_args_is_help=True
)
db_app = typer.Typer(help="Database schema commands.", no_args_is_help=True)
ingest_app = typer.Typer(help="Ingest internal input files from docs/.", no_args_is_help=True)
taxonomy_app = typer.Typer(help="Canonical taxonomy commands.", no_args_is_help=True)
audit_app = typer.Typer(help="Audit trail commands.", no_args_is_help=True)
app.add_typer(db_app, name="db")
app.add_typer(ingest_app, name="ingest")
app.add_typer(taxonomy_app, name="taxonomy")
app.add_typer(audit_app, name="audit")

VEHICLES_WITH_FEEDBACK = ["F70", "G60", "G70"]
VEHICLES_WITH_CATALOGUE = ["F70", "G60", "G70"]


def _echo(label: str, stats: dict) -> None:
    typer.echo(f"{label}: {json.dumps(stats, ensure_ascii=False, default=str)}")


@db_app.command("init")
def db_init() -> None:
    """Create all tables in the configured database."""
    engine = make_engine()
    init_schema(engine)
    typer.echo(f"schema created on {engine.url.render_as_string(hide_password=True)}")


@db_app.command("reset")
def db_reset(yes: bool = typer.Option(False, "--yes", help="Confirm dropping all tables.")) -> None:
    """Drop and recreate all tables (destroys data)."""
    if not yes:
        raise typer.BadParameter("pass --yes to confirm")
    engine = make_engine()
    drop_schema(engine)
    init_schema(engine)
    typer.echo("schema reset")


@taxonomy_app.command("extract")
def taxonomy_extract() -> None:
    """Extract the canonical VFC lists from the feedback workbooks into config/taxonomy/."""
    from tracepoint.taxonomy.extract import apply_enrichment, extract_taxonomy

    _echo("taxonomy", extract_taxonomy())
    _echo("enrichment", apply_enrichment())


@ingest_app.command("reference")
def ingest_reference() -> None:
    """Load vehicles, markets, countries and the taxonomy from config/."""
    from tracepoint.ingest.reference import load_taxonomy, load_vehicles_and_markets

    with Session(make_engine()) as session, start_run(session, "ingest.reference") as run:
        _echo("reference", load_vehicles_and_markets(session, run))
        _echo("taxonomy", load_taxonomy(session, run))


@ingest_app.command("verbatims")
def ingest_verbatims_cmd(
    vehicle: list[str] = typer.Option(VEHICLES_WITH_FEEDBACK, "--vehicle", "-v"),
) -> None:
    """Ingest the customer verbatim workbooks."""
    from tracepoint.ingest.verbatims import ingest_verbatims

    with Session(make_engine()) as session:
        for code in vehicle:
            with start_run(session, f"ingest.verbatims.{code}", {"vehicle": code}) as run:
                _echo(f"verbatims {code}", ingest_verbatims(session, run, code))


@ingest_app.command("studies")
def ingest_studies_cmd() -> None:
    """Ingest the customer study workbook."""
    from tracepoint.ingest.studies import ingest_studies

    with Session(make_engine()) as session, start_run(session, "ingest.studies") as run:
        _echo("studies", ingest_studies(session, run))


@ingest_app.command("sales")
def ingest_sales_cmd() -> None:
    """Ingest the sales volume workbook."""
    from tracepoint.ingest.sales import ingest_sales

    with Session(make_engine()) as session, start_run(session, "ingest.sales") as run:
        _echo("sales", ingest_sales(session, run))


@ingest_app.command("optionlists")
def ingest_optionlists_cmd(
    vehicle: list[str] = typer.Option(VEHICLES_WITH_CATALOGUE, "--vehicle", "-v"),
) -> None:
    """Ingest the German price and equipment catalogues (PDF)."""
    from tracepoint.ingest.optionlists import ingest_optionlist

    with Session(make_engine()) as session:
        for code in vehicle:
            with start_run(session, f"ingest.optionlist.{code}", {"vehicle": code}) as run:
                _echo(f"optionlist {code}", ingest_optionlist(session, run, code))


@ingest_app.command("all")
def ingest_all() -> None:
    """Run the complete internal ingestion in order."""
    ingest_reference()
    ingest_verbatims_cmd(VEHICLES_WITH_FEEDBACK)
    ingest_studies_cmd()
    ingest_sales_cmd()
    ingest_optionlists_cmd(VEHICLES_WITH_CATALOGUE)


@audit_app.command("export")
def audit_export(
    fmt: str = typer.Option("json", "--format", help="json or csv"),
    out: Path | None = typer.Option(
        None, "--out", help="Output file; prints to stdout when omitted"
    ),
    entity_type: str | None = typer.Option(None, "--entity-type"),
    entity_id: str | None = typer.Option(None, "--entity-id"),
    run_id: str | None = typer.Option(None, "--run-id"),
) -> None:
    """Export the audit event log."""
    if fmt not in ("json", "csv"):
        raise typer.BadParameter("format must be json or csv")
    with Session(make_engine()) as session:
        payload = export_events(
            session, fmt, entity_type=entity_type, entity_id=entity_id, run_id=run_id
        )  # type: ignore[arg-type]
    if out is None:
        typer.echo(payload)
    else:
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(payload, encoding="utf-8")
        typer.echo(f"wrote {out}")


report_app = typer.Typer(help="Reports.", no_args_is_help=True)
app.add_typer(report_app, name="report")


@report_app.command("baseline")
def report_baseline(
    vehicle: str = typer.Option(..., "--vehicle", "-v"),
    market: str | None = typer.Option(
        None, "--market", "-m", help="EU / US / CN / RoW; omit for all"
    ),
    out_dir: Path | None = typer.Option(
        None, "--out-dir", help="Write <vehicle>_<market>.md and .json here"
    ),
) -> None:
    """Generate the baseline situation-analysis report for a vehicle (and market)."""
    from tracepoint.reports.baseline import build_baseline, render_markdown, to_json

    with Session(make_engine()) as session:
        with start_run(session, "report.baseline", {"vehicle": vehicle, "market": market}) as run:
            rep = build_baseline(session, vehicle, market)
            rep["run_id"] = run.id
            from tracepoint.core.audit import record_event

            record_event(
                session,
                actor_type="system",
                actor_id="reports.baseline",
                action="report.generated",
                entity_type="report",
                entity_id=f"baseline:{vehicle}:{market or 'ALL'}",
                run_id=run.id,
                after={"verbatims": rep["coverage"]["verbatims"], "domains": len(rep["domains"])},
            )
    md = render_markdown(rep)
    if out_dir is None:
        typer.echo(md)
        return
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{vehicle}_{market or 'ALL'}"
    (out_dir / f"{stem}.md").write_text(md, encoding="utf-8")
    (out_dir / f"{stem}.json").write_text(to_json(rep), encoding="utf-8")
    typer.echo(f"wrote {out_dir / stem}.md and .json")


@app.command("settings")
def show_settings() -> None:
    """Print the effective settings (secrets masked)."""
    s = get_settings()
    data = s.model_dump()
    for k in list(data):
        if "key" in k and data[k]:
            data[k] = "***"
    typer.echo(json.dumps(data, indent=2, default=str))


if __name__ == "__main__":
    app()
