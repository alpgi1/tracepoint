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
| `tracepoint ingest external [--fetch] [--only P-01]` | load the team's external source lists (`docs/trend_sources.md`, `docs/external_sources_v2.json`) as far as `config/external/evidence.yaml` puts them in scope: sources, claims with the result of the check against their page, and the page text of sources about our vehicles. Without `--fetch` nothing leaves the machine (also run by `ingest all`); `--fetch` downloads what is missing in `data/external/`, re-checks every claim and rewrites `config/external/fetched.json` |
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
| `tracepoint agent analyze --vehicle G60 --market US` / `--vehicle F70 --country GB` | situation analysis of one vehicle in one market or country by the analyst agent (LLM with tool calls on the stored evidence, needs the OpenAI key). Writes a brief in `data/analyses/<vehicle>_<scope>.md` (the proposals with their CPM effort first, then what customers say, then what is open) and everything in the `.json` beside it (references, change profiles, flags, tool calls); `--detail` also writes the full print as `.detail.md`; `--max-steps`, `--no-cache`. Also `POST /agent/analyze` |
| `tracepoint agent series --vehicle G60` | one series across its regions, the markets EU, US and CN (5 Series: G60 in EU and US, G68 in CN; the remainder market is left out): the regions side by side per 100 verbatims, study scores by rank, external evidence, and per topic a decision the checks hold against the evidence: change now for all markets, change now for one region, next generation, keep, or no action, each with its CPM effort. Writes `data/analyses/<vehicle>_regions.md` and `.json`. The agent fetches nothing; it reads what is stored |
| `GET /cpm/{vehicle}?market=US`, `GET /effort/model`, `POST /effort/estimate`, `GET /requirements/{id}/effort` | the CPM contract of `plan/07-frontend-plan.md`: per subsystem the customer rows, liked and criticised blocks with narration, and market evidence (equal to `frontend/content/cpm.json`); the effort model; the effort of a change profile. The agents read the same view through the tool `get_subsystems` and the context pack |
| `GET /overview` | the landing page's content (`MarketsContent` of `frontend/lib/content/types.ts`): per market the 2025 units of the vehicles sold there, verbatims, the domain with the highest complaint share and the study attribute with the lowest score; per vehicle the same with its three weakest study attributes. Counted on the workbook labels, as `GET /cpm/{vehicle}`; the frontend writes it unchanged into `content/markets.json` (D-101) |
| `GET /analyses?vehicle=&market=&kind=`, `GET /analyses/{key}`, `GET /analyses/{key}/brief` | the stored analyses without a model call (`data/analyses/` from runs on this machine, then the committed `reports/analysis/`), with the vehicle and market pairs each speaks about; one as the run wrote it; one as the product manager reads it: proposals grouped into change now, with the next generation and keep, what customers say grouped by kind, a series' topics in its five decisions, every code in words, every reference resolved against the store (D-100) |
| `GET /external?market=&vehicle=&subsystem=&topic=&kind=&verified=` | the external evidence of a market with every code in words: source, origin, date, kind, how many sources agree, whether the figures stood on the page; the rows the analysts read through `get_external_evidence` (D-102) |
| `GET /glossary` | the product manager's vocabulary: every code the store, the engine and the agents use with the words that stand for it (`tracepoint/briefs/labels.py`) |
| `GET /requirements/export?vehicle=&market=&format=csv\|md` | the D2 list as `tracepoint requirements export` writes it, since step 19 with each requirement's effort and latest gate G2 decision |
| `GET /events?entity_prefix=REQ-G60-US-` | the events of one scope in one call (the prefix is taken literally) |
| `tracepoint settings` | print the effective settings |

## Layout

```
tracepoint/
  core/       settings, identifiers, audit event log, run registry
  db/         SQLAlchemy models and session helpers
  ingest/     registry of input files, reference loader, parsers (verbatims, studies, sales, option lists, group report)
  taxonomy/   canonical taxonomy extraction and enrichment
  reports/    baseline situation-analysis report; overview of the markets for the landing page
  llm/        provider-agnostic LLM gateway (OpenAI first, structured outputs and tool calls), pricing, strict JSON schemas
  classify/   gap classification, Source B segmentation, few-shot retrieval, blind validation
  findings/   deterministic finding extraction, cross-layer links, Markdown report
  agent/      context packs, drill-down tools (logged tool calls), the agent loop and the situation analysis
  requirements/  requirement store (import, versioning, G2 decisions) and D2 exports
  effort/     CPM effort engine (pure), requirement effort store, variations and report
  briefs/     what the product manager reads: the vocabulary (labels), the agents' sentences in
              plain words (text), references resolved against the store (refs), the stored analyses
              (store), their briefs (views) and the external evidence (external)
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
