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


@ingest_app.command("documents")
def ingest_documents_cmd() -> None:
    """Ingest the BMW Group Report (PDF) page by page; skipped when the file is unchanged."""
    from tracepoint.ingest.documents import ingest_document

    with Session(make_engine()) as session, start_run(session, "ingest.documents") as run:
        _echo("group report", ingest_document(session, run))


@ingest_app.command("all")
def ingest_all() -> None:
    """Run the complete internal ingestion in order."""
    ingest_reference()
    ingest_verbatims_cmd(VEHICLES_WITH_FEEDBACK)
    ingest_studies_cmd()
    ingest_sales_cmd()
    ingest_optionlists_cmd(VEHICLES_WITH_CATALOGUE)
    ingest_documents_cmd()
    classify_import(VEHICLES_WITH_FEEDBACK)


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


classify_app = typer.Typer(help="LLM classification jobs (OpenAI gateway).", no_args_is_help=True)
app.add_typer(classify_app, name="classify")
findings_app = typer.Typer(help="Finding extraction (Phase 3).", no_args_is_help=True)
app.add_typer(findings_app, name="findings")


def _gateway(session: Session, run_id: str, dry_run: bool):
    from tracepoint.llm.gateway import LlmGateway, make_provider

    if dry_run:
        return None
    return LlmGateway(session, make_provider(), run_id)


@classify_app.command("gaps")
def classify_gaps(
    vehicle: str = typer.Option(..., "--vehicle", "-v"),
    limit: int | None = typer.Option(None, "--limit"),
    dry_run: bool = typer.Option(
        False, "--dry-run", help="Build prompts and estimate tokens without calling the provider"
    ),
) -> None:
    """Fill unclassified verbatim rows from the canonical taxonomy (LLM)."""
    from tracepoint.classify.gap import run_gap_classification

    with (
        Session(make_engine()) as session,
        start_run(
            session,
            f"classify.gaps.{vehicle}",
            {"vehicle": vehicle, "limit": limit, "dry_run": dry_run},
        ) as run,
    ):
        _echo(
            "gap classification",
            run_gap_classification(
                session,
                run,
                vehicle,
                _gateway(session, run.id, dry_run),
                limit=limit,
                dry_run=dry_run,
            ),
        )


@classify_app.command("import")
def classify_import(
    vehicle: list[str] = typer.Option(VEHICLES_WITH_FEEDBACK, "--vehicle", "-v"),
) -> None:
    """Apply the committed gap classifications in config/classifications/ (no API call)."""
    from tracepoint.classify.gap import import_gap_file

    with Session(make_engine()) as session:
        for code in vehicle:
            with start_run(session, f"classify.import.{code}", {"vehicle": code}) as run:
                _echo(f"gap import {code}", import_gap_file(session, run, code))


@classify_app.command("segments")
def classify_segments(
    vehicle: str = typer.Option(..., "--vehicle", "-v"),
    limit: int | None = typer.Option(None, "--limit"),
    dry_run: bool = typer.Option(False, "--dry-run"),
) -> None:
    """Split Source B call-centre notes into product and process statements (LLM)."""
    from tracepoint.classify.segment import run_segmentation

    with (
        Session(make_engine()) as session,
        start_run(
            session,
            f"classify.segments.{vehicle}",
            {"vehicle": vehicle, "limit": limit, "dry_run": dry_run},
        ) as run,
    ):
        _echo(
            "segmentation",
            run_segmentation(
                session,
                run,
                vehicle,
                _gateway(session, run.id, dry_run),
                limit=limit,
                dry_run=dry_run,
            ),
        )


@classify_app.command("prepare-sample")
def classify_prepare_sample(
    vehicle: str = typer.Option(..., "--vehicle", "-v"),
    n: int = typer.Option(300, "--n"),
    seed: int = typer.Option(42, "--seed"),
) -> None:
    """Write the stratified blind-validation sample to config/validation/."""
    from tracepoint.classify.validation import prepare_sample

    with Session(make_engine()) as session:
        _echo("sample", prepare_sample(session, vehicle, n=n, seed=seed))


@classify_app.command("validate")
def classify_validate(
    vehicle: str = typer.Option(..., "--vehicle", "-v"),
    limit: int | None = typer.Option(None, "--limit"),
    dry_run: bool = typer.Option(False, "--dry-run"),
) -> None:
    """Blind re-classification of the sample; writes reports/validation/."""
    from tracepoint.classify.validation import run_validation

    with (
        Session(make_engine()) as session,
        start_run(
            session, f"classify.validate.{vehicle}", {"vehicle": vehicle, "limit": limit}
        ) as run,
    ):
        _echo(
            "validation",
            run_validation(
                session,
                run,
                vehicle,
                _gateway(session, run.id, dry_run),
                limit=limit,
                dry_run=dry_run,
            ),
        )


@findings_app.command("extract")
def findings_extract(
    vehicle: str = typer.Option(..., "--vehicle", "-v"),
    market: str | None = typer.Option(
        None, "--market", "-m", help="EU / US / CN / RoW; omit for all markets"
    ),
) -> None:
    """Deterministic finding extraction for a vehicle (and market)."""
    from tracepoint.findings.extract import extract_findings

    with (
        Session(make_engine()) as session,
        start_run(session, "findings.extract", {"vehicle": vehicle, "market": market}) as run,
    ):
        _echo("findings", extract_findings(session, run, vehicle, market))


@findings_app.command("report")
def findings_report(
    vehicle: str = typer.Option(..., "--vehicle", "-v"),
    market: str | None = typer.Option(None, "--market", "-m"),
    out_dir: Path | None = typer.Option(None, "--out-dir"),
) -> None:
    """Render the finding list as Markdown."""
    from tracepoint.findings.report import render_findings

    with Session(make_engine()) as session:
        md = render_findings(session, vehicle, market)
    if out_dir is None:
        typer.echo(md)
        return
    out_dir.mkdir(parents=True, exist_ok=True)
    path = out_dir / f"{vehicle}_{market or 'ALL'}.md"
    path.write_text(md, encoding="utf-8")
    typer.echo(f"wrote {path}")


req_app = typer.Typer(help="Requirements (Phase 4) and gate G2 decisions.", no_args_is_help=True)
app.add_typer(req_app, name="requirements")


@req_app.command("import")
def requirements_import() -> None:
    """Import config/requirements/*.yaml and replay config/decisions/requirements.jsonl."""
    from tracepoint.requirements.store import import_all

    with Session(make_engine()) as session, start_run(session, "requirements.import") as run:
        for name, stats in import_all(session, run).items():
            _echo(f"requirements {name}", stats)


@req_app.command("decide")
def requirements_decide(
    requirement_id: str = typer.Argument(...),
    decision: str = typer.Argument(..., help="approve / reject / defer"),
    note: str = typer.Option(..., "--note", help="Rationale (mandatory)"),
    actor: str = typer.Option(None, "--actor", help="Default: human:<TRACEPOINT_HUMAN_ACTOR_ID>"),
) -> None:
    """Gate G2: decide on the current version of one requirement (logged and persisted)."""
    from tracepoint.requirements.store import decide

    with Session(make_engine()) as session:
        req = decide(
            session,
            requirement_id,
            decision,
            note=note,
            actor=actor or f"human:{get_settings().human_actor_id}",
        )
        session.commit()
        typer.echo(f"{req.id} v{req.version}: {req.status}")


@req_app.command("export")
def requirements_export(
    vehicle: str | None = typer.Option(None, "--vehicle", "-v"),
    market: str | None = typer.Option(None, "--market", "-m"),
    out_dir: Path = typer.Option(None, "--out-dir", help="Default: data/requirements"),
) -> None:
    """Write the requirement list (deliverable D2) as Markdown and CSV."""
    from tracepoint.requirements.report import list_requirements, render_csv, render_markdown

    out = out_dir or get_settings().data_dir / "requirements"
    out.mkdir(parents=True, exist_ok=True)
    with Session(make_engine()) as session:
        reqs = list_requirements(session, vehicle, market)
    stem = out / f"requirements_{vehicle or 'ALL'}_{market or 'ALL'}"
    title = f"Requirement list – {vehicle or 'all vehicles'}, {market or 'all markets'}"
    stem.with_suffix(".md").write_text(render_markdown(reqs, title), encoding="utf-8")
    stem.with_suffix(".csv").write_text(render_csv(reqs), encoding="utf-8")
    typer.echo(f"wrote {len(reqs)} requirements to {stem}.md and .csv")


agent_app = typer.Typer(
    help="Agent data access: context packs and drill-down tools.", no_args_is_help=True
)
app.add_typer(agent_app, name="agent")


@agent_app.command("packs")
def agent_packs(
    vehicle: list[str] = typer.Option([], "--vehicle", "-v", help="Default: every vehicle"),
    out_dir: Path = typer.Option(
        None, "--out-dir", help="Default: data/context_packs under the repository root"
    ),
) -> None:
    """Build the context pack (JSON + Markdown) of every vehicle × market that has evidence."""
    from sqlalchemy import select

    from tracepoint.agent.context_pack import build_context_pack, render_markdown
    from tracepoint.db.models import Market
    from tracepoint.db.models import Vehicle as VehicleRow

    out = out_dir or get_settings().data_dir / "context_packs"
    out.mkdir(parents=True, exist_ok=True)
    with Session(make_engine()) as session, start_run(session, "agent.packs") as run:
        codes = vehicle or [v.code for v in session.scalars(select(VehicleRow))]
        markets = [m.code for m in session.scalars(select(Market))]
        written = []
        for code in codes:
            for market in markets:
                pack = build_context_pack(session, code, market)
                if not pack["coverage"]["verbatims"] and not pack["studies"]:
                    continue
                pack["run_id"] = run.id
                stem = out / f"{code}_{market}"
                stem.with_suffix(".json").write_text(
                    json.dumps(pack, ensure_ascii=False, indent=1, default=str), encoding="utf-8"
                )
                stem.with_suffix(".md").write_text(render_markdown(pack), encoding="utf-8")
                written.append(f"{code}_{market}")
    typer.echo(f"wrote {len(written)} context packs to {out}: {', '.join(written)}")


@agent_app.command("tools")
def agent_tools() -> None:
    """Print the tool definitions (name, description, JSON input schema)."""
    from tracepoint.agent.tools import tool_schemas

    typer.echo(json.dumps(tool_schemas(), indent=1))


@agent_app.command("call")
def agent_call(
    name: str = typer.Argument(..., help="Tool name, see `tracepoint agent tools`"),
    args: str = typer.Argument("{}", help="JSON object with the tool arguments"),
    actor: str = typer.Option("human:pm", "--actor"),
) -> None:
    """Call one tool (logged in the audit trail) and print the JSON result."""
    from tracepoint.agent.tools import call_tool

    with Session(make_engine()) as session:
        result = call_tool(session, name, json.loads(args), actor_id=actor)
        session.commit()
    typer.echo(json.dumps(result, ensure_ascii=False, indent=1, default=str))


@agent_app.command("analyze")
def agent_analyze(
    vehicle: str = typer.Option(..., "--vehicle", "-v"),
    market: str | None = typer.Option(None, "--market", "-m", help="EU, US, CN or RoW"),
    country: str | None = typer.Option(
        None, "--country", "-c", help="Country code, e.g. GB; narrows the customer verbatims"
    ),
    max_steps: int = typer.Option(12, "--max-steps", help="Agent turns before it has to answer"),
    no_cache: bool = typer.Option(False, "--no-cache", help="Do not reuse stored LLM answers"),
    out_dir: Path = typer.Option(
        None, "--out-dir", help="Default: data/analyses under the repository root"
    ),
) -> None:
    """Situation analysis of one vehicle in a market or country by the analyst agent (LLM with
    tool calls); writes Markdown and JSON."""
    from tracepoint.agent.analysis import PROMPT_VERSION, render_analysis, run_analysis

    out = out_dir or get_settings().data_dir / "analyses"
    out.mkdir(parents=True, exist_ok=True)
    scope = country.upper() if country else market
    config = {
        "vehicle": vehicle,
        "market": market,
        "country": country,
        "max_steps": max_steps,
        "prompt_version": PROMPT_VERSION,
    }
    with (
        Session(make_engine()) as session,
        start_run(session, f"agent.analyze.{vehicle}.{scope}", config) as run,
    ):
        result = run_analysis(
            session,
            run,
            _gateway(session, run.id, False),
            vehicle,
            market,
            country,
            max_steps=max_steps,
            use_cache=not no_cache,
        )
    stem = out / f"{vehicle}_{scope}"
    stem.with_suffix(".json").write_text(
        json.dumps(result, ensure_ascii=False, indent=1, default=str), encoding="utf-8"
    )
    stem.with_suffix(".md").write_text(render_analysis(result), encoding="utf-8")
    trace = result["trace"]
    typer.echo(
        f"wrote {stem}.md and .json: {trace['steps']} steps ({trace['cached_steps']} cached), "
        f"{len(trace['tool_calls'])} tool calls, USD {trace['cost_usd']}, "
        f"{result['citations']['cited']} references, "
        f"{len(result['citations']['unknown'])} not verified, "
        f"{len(result['citations']['unverified_quotes'])} quotes not found"
    )


effort_app = typer.Typer(
    help="CPM effort estimates (rules 41-52): back-test, estimates, variations.",
    no_args_is_help=True,
)
app.add_typer(effort_app, name="effort")
_SCOPE_HELP = "all: W, L, I, certification add-on, carryover factor, own impacts; matrix: W, L, I"


@effort_app.command("backtest")
def effort_backtest(
    runs: int = typer.Option(2000, "--runs"),
    scope: str = typer.Option("all", "--scope", help=_SCOPE_HELP),
    seed: int = typer.Option(42, "--seed"),
    as_json: bool = typer.Option(False, "--json"),
) -> None:
    """Classify the documented BMW decisions in config/effort/anchors.yaml (no database)."""
    from tracepoint.effort.cpm import backtest, load_anchors, load_model, render_backtest

    result = backtest(load_model(), load_anchors(), n=runs, scope=scope, seed=seed)
    typer.echo(json.dumps(result, indent=1) if as_json else render_backtest(result))
    if result["hits"] != result["anchors"]:
        raise typer.Exit(1)


@effort_app.command("estimate")
def effort_estimate(
    runs: int = typer.Option(2000, "--runs"),
    scope: str = typer.Option("all", "--scope", help=_SCOPE_HELP),
) -> None:
    """Estimate every requirement from config/effort/requirements/*.yaml (logged, versioned)."""
    from tracepoint.effort.cpm import load_model, model_hash
    from tracepoint.effort.store import estimate_all

    snapshot = {"model_hash": model_hash(load_model()), "runs": runs, "scope": scope}
    with Session(make_engine()) as session, start_run(session, "effort.estimate", snapshot) as run:
        _echo("effort", estimate_all(session, run, runs=runs, scope=scope))


@effort_app.command("report")
def effort_report(
    vehicle: str | None = typer.Option(None, "--vehicle", "-v"),
    market: str | None = typer.Option(None, "--market", "-m"),
    out_dir: Path = typer.Option(None, "--out-dir", help="Default: data/effort"),
) -> None:
    """Markdown report per vehicle × market: variations, requirements, flags, subsystems."""
    from tracepoint.effort.cpm import backtest, load_anchors, load_model
    from tracepoint.effort.report import render_markdown
    from tracepoint.effort.store import list_efforts, scenarios

    out = out_dir or get_settings().data_dir / "effort"
    out.mkdir(parents=True, exist_ok=True)
    bt = backtest(load_model(), load_anchors())
    with Session(make_engine()) as session:
        rows = list_efforts(session, vehicle, market)
        scopes = sorted({(r["vehicle"], r["market"]) for r in rows})
        for v, m in scopes:
            sel = [r for r in rows if (r["vehicle"], r["market"]) == (v, m)]
            md = render_markdown(sel, scenarios(session, v, m), f"Effort estimate – {v} {m}", bt)
            path = out / f"effort_{v}_{m}.md"
            path.write_text(md, encoding="utf-8")
            typer.echo(f"wrote {path} ({len(sel)} requirements)")


@app.command("status")
def status() -> None:
    """Print row counts of the main tables and the last runs."""
    from sqlalchemy import func, select

    from tracepoint.db import models as m

    tables = [
        ("vehicles", m.Vehicle),
        ("variants", m.VehicleVariant),
        ("sources", m.Source),
        ("verbatims", m.Verbatim),
        ("classifications", m.VerbatimClassification),
        ("segments", m.VerbatimSegment),
        ("taxonomy_level2", m.TaxonomyLevel2),
        ("study_metrics", m.StudyMetric),
        ("sales_rows", m.SalesVolume),
        ("equipment_items", m.EquipmentItem),
        ("tech_specs", m.TechSpec),
        ("document_pages", m.DocumentPage),
        ("findings", m.Finding),
        ("requirements", m.Requirement),
        ("efforts", m.RequirementEffort),
        ("finding_links", m.FindingLink),
        ("llm_calls", m.LlmCall),
        ("runs", m.Run),
        ("audit_events", m.AuditEvent),
    ]
    engine = make_engine()
    with Session(engine) as session:
        typer.echo(f"database: {engine.url.render_as_string(hide_password=True)}")
        for name, model in tables:
            n = session.scalar(select(func.count()).select_from(model))
            typer.echo(f"  {name:18s} {n:>8}")
        last = session.scalars(select(m.Run).order_by(m.Run.started_at.desc()).limit(5)).all()
        if last:
            typer.echo("last runs:")
            for r in last:
                typer.echo(f"  {r.id}  {r.status}")


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
