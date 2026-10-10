# Tracepoint backend

Python 3.12+ application: ingestion of the internal BMW input files into a PostgreSQL evidence
store, canonical taxonomy, audit log, baseline reports and a read API.

## Quick start (development container)

```bash
make db-start      # start the local PostgreSQL 16 cluster
make db-create     # create role and databases (tracepoint, tracepoint_test)
make setup         # uv sync (creates backend/.venv)
make db-init       # create the schema
cd backend && uv run tracepoint taxonomy extract   # (re)build config/taxonomy/*.yaml from docs/
make ingest        # ingest all internal files from docs/
make test          # pytest against tracepoint_test
make api           # http://localhost:8000/docs
```

Settings are read from environment variables with the `TRACEPOINT_` prefix or a `.env` file at the
repository root (see `.env.example`).

## Commands

| Command | Purpose |
|---|---|
| `tracepoint db init` / `db reset --yes` | create / recreate the schema |
| `tracepoint taxonomy extract` | extract the canonical VFC lists and apply the authored domain map and polarity rules |
| `tracepoint ingest reference` | load vehicles, markets, countries and the taxonomy from `config/` |
| `tracepoint ingest verbatims` / `studies` / `sales` / `optionlists` / `all` | ingest the input files (idempotent per vehicle) |
| `tracepoint report baseline --vehicle G60 --market US --out-dir ../reports/baseline` | baseline situation-analysis report (Markdown + JSON) |
| `tracepoint audit export --format json\|csv [--out file]` | export the audit event log |
| `tracepoint settings` | print the effective settings |

## Layout

```
tracepoint/
  core/       settings, identifiers, audit event log, run registry
  db/         SQLAlchemy models and session helpers
  ingest/     registry of input files, reference loader, parsers (verbatims, studies, sales, option lists)
  taxonomy/   canonical taxonomy extraction and enrichment
  reports/    baseline situation-analysis report
  api/        FastAPI read API
  cli.py      Typer command line interface
tests/        pytest suite (ingests docs/ into the test database once per session)
```

## Evidence references

Every evidence row has a `locator` (file, sheet / page, row / position) and a `created_run_id`.
Findings and requirements (later phases) reference evidence with strings such as
`verbatim:G60-0123`, `metric:MET-US-US-G60-voice_recognition`, `equipment:EQ-F70-0112`,
`sales:SAL-G60-US-2030`, `spec:SPEC-G60-i5_edrive40-electric_range_wltp_km`.
