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

LLM jobs need `TRACEPOINT_OPENAI_API_KEY`, `TRACEPOINT_OPENAI_MODEL` (reasoning) and optionally
`TRACEPOINT_OPENAI_MODEL_BULK` (classification, segmentation); without them use `--dry-run`.

Settings are read from environment variables with the `TRACEPOINT_` prefix or a `.env` file at the
repository root (see `.env.example`).

## Commands

| Command | Purpose |
|---|---|
| `tracepoint db init` / `db reset --yes` | create / recreate the schema |
| `tracepoint taxonomy extract` | extract the canonical VFC lists and apply the authored domain map and polarity rules |
| `tracepoint ingest reference` | load vehicles, markets, countries and the taxonomy from `config/` |
| `tracepoint ingest verbatims` / `studies` / `sales` / `optionlists` / `documents` / `all` | ingest the input files (idempotent per vehicle); `documents` reads the BMW Group Report page by page and is skipped while the file is unchanged |
| `tracepoint report baseline --vehicle G60 --market US --out-dir ../reports/baseline` | baseline situation-analysis report (Markdown + JSON) |
| `tracepoint audit export --format json\|csv [--out file]` | export the audit event log |
| `tracepoint classify import [--vehicle G60]` | apply the committed gap labels in `config/classifications/<vehicle>_gaps.jsonl` (no API call; also run by `ingest all`) |
| `tracepoint classify gaps --vehicle G60 [--limit N] [--dry-run]` | LLM gap classification of unclassified rows (dry run: prompts and token estimate only) |
| `tracepoint classify segments --vehicle G60 [--dry-run]` | LLM segmentation of Source B notes into product / process statements |
| `tracepoint classify prepare-sample --vehicle G60` | write the blind-validation sample to `config/validation/` |
| `tracepoint classify validate --vehicle G60` | blind re-classification of the sample; writes `reports/validation/` |
| `tracepoint findings extract --vehicle G60 --market US` | deterministic finding extraction (voice of customer, study metrics, equipment gaps, links) |
| `tracepoint findings report --vehicle G60 --market US --out-dir ../reports/findings` | Markdown finding list |
| `tracepoint requirements import` | load `config/requirements/*.yaml` (validated against the findings, versioned, audited) and replay the G2 decisions in `config/decisions/requirements.jsonl` |
| `tracepoint requirements decide REQ-G60-US-IC-01 approve --note "…"` | gate G2 (approve / reject / defer) on the current version; logged and appended to the decisions file. Also `POST /requirements/{id}/decision` |
| `tracepoint requirements export [--vehicle G60 --market US]` | requirement list (deliverable D2) as Markdown and CSV in `data/requirements/`; API `GET /requirements`, `GET /requirements/{id}` (traceability to findings and evidence, event history) |
| `tracepoint effort backtest [--scope all\|matrix]` | CPM effort engine back-test against the documented BMW decisions in `config/effort/anchors.yaml` (no database; exit code 1 if an anchor fails) |
| `tracepoint effort estimate` | effort of every requirement from `config/effort/requirements/*.yaml` and the model `config/effort/model.yaml`: % of a new vehicle, P5–P95, layer K0–K3, decision, affected subsystems, portfolio scan of the catalogues, horizon checks; stored in `requirement_effort`, every change audited. API `GET /effort/requirements`, `GET /effort/scenarios?vehicle=G60`, `GET /effort/backtest`; agent tool `get_effort` |
| `tracepoint effort report [--vehicle G60 --market US]` | Markdown per vehicle × market (variations H1 / H2 / all, requirements, PM flags, subsystems) in `data/effort/` |
| `tracepoint agent packs [--vehicle G60]` | context pack (JSON + Markdown) per vehicle × market with evidence, written to `data/context_packs/` |
| `tracepoint agent tools` | tool definitions for an LLM agent (name, description, JSON input schema) |
| `tracepoint agent call search_evidence '{"query": "charging flap", "vehicle": "G60"}'` | run one agent tool; every call is an audit event (`tool.called`). Also over HTTP: `GET /agent/tools`, `POST /agent/tools/{name}` |
| `tracepoint agent analyze --vehicle G60 --market US` / `--vehicle F70 --country GB` | situation analysis by the analyst agent (LLM with tool calls, needs the OpenAI key): Markdown and JSON in `data/analyses/`, every insight with its evidence references, every proposal with its CPM effort (from the requirement's change profile or the analyst's own, computed by the effort engine) and the H1 / H2 packages; `--max-steps`, `--no-cache`. Also `POST /agent/analyze` |
| `GET /cpm/{vehicle}?market=US`, `GET /effort/model`, `POST /effort/estimate`, `GET /requirements/{id}/effort` | the CPM contract of `plan/07-frontend-plan.md`: per subsystem the customer rows, liked and criticised blocks with narration, and market evidence (equal to `frontend/content/cpm.json`); the effort model; the effort of a change profile. The agents read the same view through the tool `get_subsystems` and the context pack |
| `tracepoint settings` | print the effective settings |

## Layout

```
tracepoint/
  core/       settings, identifiers, audit event log, run registry
  db/         SQLAlchemy models and session helpers
  ingest/     registry of input files, reference loader, parsers (verbatims, studies, sales, option lists, group report)
  taxonomy/   canonical taxonomy extraction and enrichment
  reports/    baseline situation-analysis report
  llm/        provider-agnostic LLM gateway (OpenAI first, structured outputs and tool calls), pricing, strict JSON schemas
  classify/   gap classification, Source B segmentation, few-shot retrieval, blind validation
  findings/   deterministic finding extraction, cross-layer links, Markdown report
  agent/      context packs, drill-down tools (logged tool calls), the agent loop and the situation analysis
  requirements/  requirement store (import, versioning, G2 decisions) and D2 exports
  effort/     CPM effort engine (pure), requirement effort store, variations and report
  api/        FastAPI read API
  cli.py      Typer command line interface
tests/        pytest suite (ingests docs/ into the test database once per session)
```

## Evidence references

Every evidence row has a `locator` (file, sheet / page, row / position) and a `created_run_id`.
Findings and requirements (later phases) reference evidence with strings such as
`verbatim:G60-0123`, `metric:MET-US-US-G60-voice_recognition`, `equipment:EQ-F70-0112`,
`sales:SAL-G60-US-2030`, `spec:SPEC-G60-i5_edrive40-electric_range_wltp_km`,
`document:DOC-GROUP-REPORT-0079` (one page of the BMW Group Report),
`market:MKT-CN-interior_console-1` (one row of `config/cpm/market_context.yaml`).
