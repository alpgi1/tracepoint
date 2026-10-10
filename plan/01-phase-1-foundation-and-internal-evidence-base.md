# Phase 1 – Foundation and internal evidence base

| Field | Value |
|---|---|
| Version | 1.0 (2026-10-10) |
| Status | In progress – internal ingestion delivered in step 03 (`reports/step-03-phase-1-internal-ingestion.md`); LLM-dependent work packages deferred until the team provides the OpenAI API details (D-020, D-021) |
| Depends on | `plan/00-master-plan.md`, `reports/step-01-challenge-and-data-analysis.md` |
| Feeds | Phase 2 (external evidence), Phase 3 (findings) – both consume the evidence store and the agent-facing data access built here |

> **Status update 2026-10-10 (step 03).** Team decisions after the plan review: PostgreSQL instead of
> SQLite (D-019); the application uses the OpenAI API for research agents, the main agent and
> embeddings, details to follow (D-020); the internal ingestion was built without any external API
> call and the LLM-dependent packages WP1.7 and WP1.9 wait for the API details (D-021). Delivered:
> WP1.1–WP1.6, WP1.8 (authored translations and attribute map), WP1.10 (baseline reports, read
> API, tests, CI). A ninth vehicle domain `driving_dynamics` was added (D-022). Section 3.2 below
> keeps the original analysis; the rows marked *superseded* show the final choice.

---

## 1. Objective

Build the foundation of Tracepoint and turn the eight internal files under `docs/` into a
queryable, traceable, LLM-ready **evidence base**:

* every record parsed into typed tables with a locator back to file / sheet / row or page / line;
* the given VFC taxonomy frozen as the canonical theme structure, mapped to vehicle domains;
* classification gaps filled by the LLM from the canonical list (new themes only as proposals);
* German equipment data translated and normalised into a standard / optional matrix per variant;
* all textual evidence embedded for retrieval; an agent-facing data-access layer (context packs
  plus drill-down tools);
* the audit event log live from the first ingestion;
* baseline "situation analysis" reports per vehicle and market as the first tangible artefact;
* API, CLI, tests and CI so that later phases build on a stable base.

## 2. Scope

**In scope:** repository skeleton and conventions, technical stack, data model and database,
audit log core, parsers for all internal files, canonical taxonomy and domain mapping, LLM gap
classification, Source B segmentation, translation and attribute harmonisation, embeddings and
retrieval, agent-facing data access, baseline reports, API, CLI, tests, CI, step reports.

**Out of scope (later phases):** external sources and research agents (Phase 2), findings and
cross-layer links (Phase 3), requirements (Phase 4), scoring (Phase 5), the PM workspace UI
(Phase 6; a minimal read-only evidence explorer is an optional stretch here), exports beyond the
event log (Phase 7).

---

## 3. Technical analysis and stack decision

### 3.1 Requirements that drive the choice

* Heterogeneous parsing (Excel with two study layouts, German PDF catalogues with rotated headers).
* About 14,000 classification rows, 10,000 verbatims, 1,200 equipment lines, 250 study
  metrics today; external evidence later (thousands of excerpts). Small data, not big data.
* LLM work in two shapes: **bulk, latency-insensitive** (classification, segmentation,
  translation) and **interactive, reasoning-heavy** (later phases: findings, requirements,
  challenges).
* Deterministic re-runs, run registry and append-only audit log from day one.
* Research agents in Phase 2 need web search and fetch restricted to team-selected sources, with
  snapshots cached in the database.
* One PM user, a live demo later, a team with enough people; "optimum and relatively simple
  integration".

### 3.2 Options considered

| Area | Options | Decision and reason |
|---|---|---|
| Language | Python · TypeScript end-to-end | **Python 3.12** for the backend: best parsing ecosystem (pandas, openpyxl, pdfplumber), official Anthropic SDK, team-friendly. TypeScript only for the UI. |
| LLM access | Official provider SDK · LangChain / LlamaIndex · hosted agent platforms | *Superseded by D-020:* the team chose the **OpenAI API** for research agents, the main agent and embeddings; one in-house gateway module wraps the provider SDK (structured outputs, caching of responses by input hash, call logging with cost), so the provider stays swappable. Frameworks add abstraction drift for little gain at this size. |
| Models | provider model tiers | *Superseded by D-020:* model names are provided by the team with the API details and live in settings (`TRACEPOINT_OPENAI_MODEL`, `TRACEPOINT_EMBEDDING_MODEL`), never in business code. Bulk jobs may use a cheaper tier than the reasoning jobs; that is a cost decision. |
| LLM output control | Free text · structured outputs (`output_config.format`) · strict tools | **Structured outputs with JSON schemas (Pydantic models)** for every extraction / classification call; strict tools for agent drill-down tools in later phases. |
| Bulk cost control | Plain calls · prompt caching · Message Batches API | **Prompt caching** (canonical taxonomy and instructions in the cached prefix) plus **Message Batches** for bulk jobs (50 % cheaper, asynchronous). Every call logged with tokens and estimated cost. |
| Storage | SQLite · PostgreSQL (+ pgvector) · document store | *Superseded by D-019:* **PostgreSQL 16** via SQLAlchemy 2 and psycopg 3; separate test database; CI service container. pgvector can be added for embeddings (`postgresql-16-pgvector`) once the embedding model is decided. |
| Vector search | Dedicated vector database (Chroma, Qdrant) · pgvector · in-process | **In-process**: embeddings stored as blobs in SQLite, loaded into a NumPy matrix, cosine similarity with metadata pre-filtering in SQL. At ≤ 50,000 vectors this is milliseconds and needs no server. |
| Embedding model | Local sentence-transformers · hosted embedding API | *Superseded by D-020:* a hosted **OpenAI embedding model** named by the team. Vectors are stored in the `embedding` table (bytes) and searched in-process; pgvector is the upgrade path. |
| API | FastAPI · Flask · Django | **FastAPI** (typed, async, automatic OpenAPI docs that double as the Phase 1 evidence explorer). |
| CLI / orchestration | Typer CLI · Prefect / Airflow | **Typer CLI** with a small run registry; stage functions are plain Python. Workflow engines are unnecessary at this scale. |
| UI | React + TypeScript (Vite) · Streamlit | **React + TypeScript** for the PM workspace in Phase 6 (review workflows, tables, diffs, timelines need a real UI). Phase 1 only needs the OpenAPI docs; a minimal read-only explorer is optional. Streamlit stays a fallback for internal tooling. |
| Config | YAML files · database-only | **YAML under `config/`** (vehicles, markets, portfolio profiles, taxonomy domain map, attribute harmonisation, prompts) loaded into the database at ingestion with a config snapshot per run. |
| Quality | pytest · ruff · GitHub Actions | **pytest + ruff + GitHub Actions** on every pull request. |

### 3.3 How the agent gets the data ("optimum and useful" access)

Agents should neither receive raw spreadsheets nor only vector hits. Three access modes are
built in Phase 1 and reused by every later phase:

1. **Aggregates (SQL).** Counts and shares per theme, feedback type, source, market, powertrain;
   study metrics; sales; equipment status per variant. Deterministic, cheap, always exact.
2. **Context packs.** Pre-computed, compact JSON / Markdown summaries per vehicle × market that
   fit in a prompt: coverage, top themes with counts and three representative quotes each,
   weakest and strongest study attributes, equipment summary, sales weight. Built by code, cached,
   versioned, referenced by run.
3. **Drill-down tools.** Functions exposed to agents as tools: `search_evidence` (hybrid: SQL
   filters + embedding similarity), `get_verbatims_by_theme`, `get_metric`, `get_equipment`,
   `get_sales`. Every tool call is logged (audit) and returns evidence references, so the agent's
   citations are verifiable.

**Vectorisation analysis.** Embeddings are worth it for: few-shot retrieval of similar classified
examples during gap classification; semantic search in challenges ("complaints about charging
port placement in cold climates"); candidate generation for cross-layer links (verbatim theme ↔
study attribute ↔ equipment item ↔ competitor claim); deduplication of requirements. They are
not needed for recurrence counting, which uses the canonical taxonomy and SQL. Therefore: embed
every textual evidence item (verbatims, verbatim segments, study attributes, equipment items,
later web excerpts) in one `embedding` table keyed by evidence reference, with metadata filters
applied in SQL before similarity ranking.

### 3.4 LLM usage in Phase 1 and cost estimate

| Job | Unit | Approx. volume | Mode |
|---|---|---|---|
| Gap classification (verbatims with no class / `no_class_found`) | 1 call per verbatim, multi-label output | ≈ 1,600 verbatims | Batches, cached prefix (taxonomy), k nearest classified examples as few-shot |
| Source B segmentation (product statements vs process content) | 1 call per Source B verbatim | ≈ 5,500 | Batches, cached prefix |
| Blind validation of the classifier | 1 call per sampled classified verbatim | ≈ 900 (300 per model) | Batches |
| Equipment translation DE → EN | 1 call per 40 lines | ≈ 30 calls | Interactive, glossary in prefix |
| Attribute harmonisation and taxonomy → domain map proposals | a few calls | < 10 | Interactive |

Order of magnitude with `claude-opus-5-5` (USD 4 / 20 per million input / output tokens, cache
reads USD 0.20): about 8,000 calls, roughly 1.5 k uncached and 4 k cached input tokens and 200
output tokens each → about USD 50 uncached input, USD 7 cache reads, USD 32 output ≈ **USD 90**,
or about **USD 45 with the Batches API**. A cheaper tier for bulk jobs would reduce this further;
the team decides.

---

## 4. Repository layout (target state at the end of Phase 1)

```
tracepoint/
├── docs/                         # raw challenge inputs (unchanged)
├── plan/                         # master plan, phase plans, decisions
├── reports/                      # step reports, baseline reports (samples)
├── config/
│   ├── vehicles.yaml             # F70, G60, G70 (+ G68 note): names, segment, tier, variants hint
│   ├── markets.yaml              # EU / US / CN / RoW, country mapping, region profile stubs
│   ├── taxonomy/
│   │   ├── vfc_level2.yaml       # canonical list (generated from data, then frozen)
│   │   ├── vfc_level3.yaml       # canonical list with polarity
│   │   └── domain_map.yaml       # level-2 → vehicle domain (LLM-proposed, team-reviewed)
│   ├── studies/attribute_map.yaml# raw attribute names → harmonised keys and domains
│   ├── glossary_de_en.yaml       # automotive translation glossary
│   └── prompts/                  # versioned prompt templates
├── backend/
│   ├── pyproject.toml
│   ├── tracepoint/
│   │   ├── core/                 # settings, ids, logging, audit helpers, run registry
│   │   ├── db/                   # models, session, schema creation
│   │   ├── ingest/               # verbatims.py, studies.py, sales.py, optionlists.py
│   │   ├── taxonomy/             # canonical lists, validation, proposals
│   │   ├── llm/                  # gateway (SDK client, schemas, caching, batches, call log)
│   │   ├── classify/             # gap classification, segmentation, validation
│   │   ├── translate/            # equipment translation, attribute harmonisation
│   │   ├── retrieval/            # embeddings, search
│   │   ├── context/              # context packs and drill-down tools
│   │   ├── reports/              # baseline situation-analysis reports
│   │   ├── api/                  # FastAPI app and routers
│   │   └── cli.py                # Typer commands
│   └── tests/
├── frontend/                     # Phase 6 (optional minimal explorer in Phase 1)
├── data/                         # generated: tracepoint.db, caches, exports (git-ignored)
├── .github/workflows/ci.yml
├── Makefile                      # make setup / ingest / classify / embed / report / test
└── .env.example
```

---

## 5. Data model (Phase 1 subset)

Typed tables, one per evidence kind, plus shared tables. Every evidence row carries `source_id`,
`locator` (JSON) and `created_run_id`. Identifiers are stable and human-readable.

| Table | Key columns |
|---|---|
| `vehicle` | `code` (F70, G60, G70, G68), `name`, `series`, `segment`, `tier`, `notes` |
| `vehicle_variant` | `id`, `vehicle_code`, `name` (e.g. i5 eDrive40), `powertrain` (ICE / MHEV / PHEV / BEV), `drive`, `power_kw`, `base_price_eur` (rough cost proxy only), `locator` |
| `market` / `country` | `market.code` (EU, US, CN, RoW); `country.code → market_code` |
| `source` | `id`, `kind` (internal_file / web_page / manual), `name`, `path_or_url`, `format`, `layer`, `checksum`, `fetched_at`, `reliability`, `notes` |
| `verbatim` | `id` (given ID, e.g. G60-0123), `vehicle_code`, `source_label` (A–D), `country_code`, `market_code`, `powertrain`, `text`, `char_len`, `source_id`, `locator` (sheet, first row) |
| `verbatim_classification` | `id`, `verbatim_id`, `row_no`, `feedback_type`, `level2_id`, `level3_id`, `origin` (given / llm / human), `confidence`, `rationale`, `model_id`, `prompt_version`, `run_id`, `status` (canonical / proposed / rejected) |
| `verbatim_segment` | `id`, `verbatim_id`, `text`, `is_product_feedback`, `reason`, `model_id`, `run_id` (Source B and long texts) |
| `taxonomy_level2` / `taxonomy_level3` | `id`, `name`, `domain_key` (level 2), `polarity` (level 3: positive / negative / request / neutral), `origin` (given / proposed), `status` |
| `study_metric` | `id`, `vehicle_code`, `market_code`, `study` (CN_EU_2025 / US_2025), `attribute_raw`, `attribute_key`, `domain_key`, `stat_kind` (mean / distribution), `mean`, `distribution` (JSON), `scale_note`, `locator` |
| `sales_volume` | `id`, `vehicle_code` (G60_G68 mapped to G60 and G68 with a note), `market_code`, `year`, `units`, `kind` (actual / forecast), `locator` |
| `equipment_item` | `id`, `vehicle_code`, `sa_code`, `name_de`, `name_en`, `section`, `group`, `description_de`, `description_en`, `price_eur`, `locator` (page, line) |
| `equipment_availability` | `equipment_item_id`, `variant_id`, `status` (standard / optional / no_cost_option / not_available / package_only), `note` |
| `equipment_dependency` | `equipment_item_id`, `kind` (requires / excludes / included_in), `text` |
| `tech_spec` | `id`, `vehicle_code`, `variant_id`, `attribute_key` (e.g. range_wltp_km, boot_volume_l, acceleration_0_100_s), `value`, `unit`, `locator` |
| `embedding` | `evidence_ref` (e.g. `verbatim:G60-0123`), `model`, `dim`, `vector` (blob), `text_hash` |
| `run` | `id`, `kind`, `started_at`, `finished_at`, `status`, `config_snapshot`, `code_version`, `model_ids` |
| `llm_call` | `id`, `run_id`, `purpose`, `model`, `prompt_version`, `input_hash`, `input_tokens`, `cache_read_tokens`, `output_tokens`, `cost_estimate_usd`, `response` (cached) |
| `audit_event` | `id`, `ts`, `run_id`, `actor_type` (human / agent / system), `actor_id`, `action`, `entity_type`, `entity_id`, `before`, `after`, `rationale`, `model_id`, `prompt_version`, `parent_event_id` |

**Evidence reference format** (used by findings and requirements from Phase 3 on):
`verbatim:G60-0123` · `vclass:G60-0123#2` · `segment:G60-0123#1` · `metric:US_2025:US:G70:voice_recognition`
· `sales:G60:US:2030` · `equipment:G60:5DW` · `spec:G60:i5_eDrive40:range_wltp_km` ·
`web:<source_id>:<excerpt_id>` (Phase 2).

**ID conventions.** Verbatim IDs stay as given. Generated IDs are prefixed and zero-padded:
`EQ-G60-0001`, `MET-…`, `SEG-…`, `RUN-20261010-001`, `EVT-…`. Findings (`FND-`), requirements
(`REQ-<vehicle>-<market>-0001`) and reports (`RPT-`) follow from Phase 3.

---

## 6. Work packages

Each work package ends with a short report section in the step report and passes its acceptance
criteria before the next pull request. Sizes: S ≤ 1 day, M 1–3 days, L 3–5 days for one person.

### WP1.1 Repository skeleton, tooling and conventions (S) – done (step 03)
* Python project (`pyproject.toml`, `uv` or `pip-tools` lock), ruff, pytest, pre-commit,
  Makefile targets, `.env.example`, `.gitignore` for `data/`.
* `config/` skeleton: `vehicles.yaml`, `markets.yaml` (country → market mapping from the data:
  GB, SE, DK, FI, FR, ES, NO, LV → EU; US, CA → US; CN → CN; JP, KR, AU, ZA → RoW), prompt folder.
* GitHub Actions: lint + tests on pull requests.
* **Acceptance:** `make setup && make test` passes on a clean checkout; CI green.

### WP1.2 Data model, database and run registry (M) – done (step 03, PostgreSQL)
* SQLModel / SQLAlchemy models for section 5; schema creation; `data/tracepoint.db`.
* Run registry: every CLI command opens a run with a configuration snapshot and code version.
* Settings module (paths, model IDs, embedding model, batch mode flags).
* **Acceptance:** schema created from scratch; a run is recorded for a no-op command.

### WP1.3 Audit event log core (S) – done (step 03)
* `record_event()` helper; append-only table; actor model (`human:pm`, `agent:<name>`, `system`).
* `tracepoint audit export --format json|csv` and `GET /events`.
* **Acceptance:** events written by WP1.4–WP1.8 are exportable with actor, time, entity and rationale.

### WP1.4 Parsers for verbatims, studies and sales (M) – done (step 03)
* Verbatims: one `verbatim` per ID, one `verbatim_classification` per row (origin = given);
  `no_class_found` and blank classes become "unclassified" markers, not taxonomy entries;
  country → market; engine type normalised (`BEVE` → BEV).
* Studies: parser for `CN_EU_2025` (means; 37 attributes × 5 model / market columns) and
  `US_2025` (7-step distributions; ≈ 105 attributes × G60 / G70); harmonised `attribute_key` via
  `config/studies/attribute_map.yaml` (WP1.7 provides the proposal).
* Sales: three sheets; `G60_G68` recorded against G60 and G68 with a combined-volume note;
  2030 flagged as forecast.
* **Acceptance (exact counts from step 01):** F70 4,076 rows / 2,128 verbatims; G60 5,005 /
  4,000; G70 4,690 / 4,000; sales 3 × 4 rows × 3 years; study metrics 37 × 5 means and ≈ 105 × 2
  distributions whose shares sum to 1 ± 0.01; every row has a locator; tests encode these numbers.

### WP1.5 Option list parser and equipment matrix (L) – done (step 03, merged cells approximated, D-024)
* Text extraction with pdfplumber (word positions) per page; section detection (prices, standard
  equipment, M packages, wheels, colours, interior, optional equipment, technical data).
* Column detection for the variant matrix (rotated headers) from x-positions of ■ / □ / –,– marks;
  SA codes, prices, dependency notes ("Nur in Verbindung mit …", "Nicht in Verbindung mit …"),
  package contents (indented "–" lines).
* Technical data for customer-relevant attributes (range / consumption, acceleration, boot
  volume, towing, battery) into `tech_spec`.
* Pragmatic fallback: where layout parsing is unreliable, an LLM structuring pass on the page text
  with the page locator, followed by human spot checks; the chosen path is recorded per page.
* **Acceptance:** variants exactly as listed in step 01 (F70 6, G60 10, G70 7); spot checks such as
  F70 `248 Lenkradheizung 250,–` optional on all variants, F70 `674 harman/kardon` standard only on
  M135 xDrive, G60 `5DW Parking Assistant Professional 1.150,–`, G70 `3CD Automatiktüren 1.600,–`;
  every item carries page and line.

### WP1.6 Canonical taxonomy and domain map (S) – done (step 03, domain map authored)
* Extract the union of VFC level-2 and level-3 names from all three files into
  `config/taxonomy/*.yaml` (origin = given, status = canonical), with per-vehicle occurrence counts.
* LLM-proposed mapping level 2 → vehicle domain and level 3 → polarity; team review; stored as
  config and loaded into the database.
* Policy: the canonical list is frozen; later additions only through approved proposals (events).
* **Acceptance:** 100 % of given classification rows resolve to canonical IDs; every level-2 entry
  has a domain; review recorded in the step report.

### WP1.7 LLM gateway, gap classification and segmentation (L) – deferred until the OpenAI API details arrive (D-021)
* Gateway: one module wrapping the Anthropic SDK (default model from settings, adaptive thinking,
  explicit effort, structured outputs via Pydantic schemas, prompt caching, Batches runner,
  response cache keyed by input hash, `llm_call` logging with cost estimate, retry policy).
* Gap classification: for every verbatim without canonical classification, produce one or more
  `(feedback_type, level2, level3, confidence, rationale)` from the canonical lists, with the k
  nearest classified verbatims as few-shot examples; if nothing fits, output a `new_theme_proposal`
  (name, closest existing theme, reason) → status `proposed`, approval queue.
* Source B segmentation: product-relevant statements vs process / dealer content; store segments.
* Attribute harmonisation and domain-map proposals (consumed by WP1.4 / WP1.6).
* Blind validation: stratified sample of 300 already-classified verbatims per model re-classified
  without their labels; report agreement for feedback type, level 2 and level 3; tune prompt once.
* **Acceptance:** ≥ 95 % of unclassified verbatims receive a classification or a proposal; every
  classification has an event with model, prompt version, confidence and rationale; validation
  report filed with numbers; re-running the command does not re-call the LLM for unchanged inputs.

### WP1.8 Translation and normalisation of equipment data (M) – done (step 03, 299 names translated as authored config)
* Glossary-driven DE → EN translation of equipment names and descriptions (structured output,
  cached); normalised `group` values (packages, exterior, interior, drivetrain / chassis,
  connectivity / infotainment, driver assistance / safety, comfort, climate, transport / storage,
  other); mapping of equipment groups to vehicle domains.
* **Acceptance:** every equipment item has `name_en`; a bilingual sample of 50 lines reviewed by
  the team and filed.

### WP1.9 Embeddings, retrieval and agent-facing data access (M) – deferred until the embedding model is named (D-020); SQL filters and text search are available through the API
* Embedding of verbatims, segments, study attributes and equipment items; in-process cosine search
  with SQL pre-filters (vehicle, market, powertrain, source, feedback type, theme, domain).
* Context-pack builder per vehicle × market (coverage, top themes per feedback type with counts and
  three representative quotes, weakest / strongest study attributes, equipment summary, sales
  weight) as JSON and Markdown, cached and versioned.
* Drill-down tool functions with logged calls: `search_evidence`, `get_verbatims_by_theme`,
  `get_metric`, `get_equipment`, `get_sales`.
* **Acceptance:** ten hand-written retrieval queries return relevant evidence in the top five;
  context packs for the three vehicles build in under a minute; tool calls appear in the event log.

### WP1.10 Baseline situation-analysis reports, API and optional explorer (M) – done except the optional explorer (step 03)
* `tracepoint report baseline --vehicle G60 --market US`: data coverage, theme landscape by
  feedback type and domain, complaint / like ratio per domain and powertrain, study weak and strong
  attributes compared with other models and markets, equipment summary, sales weight. Markdown +
  JSON; samples committed under `reports/baseline/`.
* FastAPI routers: `/vehicles`, `/markets`, `/verbatims`, `/taxonomy`, `/studies`, `/sales`,
  `/equipment`, `/search`, `/runs`, `/events`, `/health`; OpenAPI docs as the explorer.
* Optional stretch: minimal read-only React explorer (evidence table with filters and locator
  display) to de-risk Phase 6.
* **Acceptance:** baseline reports for F70, G60, G70 generated and reviewed; API responds with
  locators on every evidence endpoint.

### WP1.11 Phase close-out (S) – pending (after WP1.7 and WP1.9)
* Definition-of-done checklist (section 10) verified; final Phase 1 report; pull request.

---

## 7. Sequencing and parallel tracks

```
WP1.1 ─► WP1.2 ─► WP1.3 ─┬─► WP1.4 (verbatims, studies, sales) ─┐
                         ├─► WP1.5 (option lists) ───────────────┼─► WP1.9 ─► WP1.10 ─► WP1.11
                         ├─► WP1.6 (taxonomy) ─► WP1.7 (LLM) ────┤
                         └─► WP1.8 (translation, after WP1.5) ───┘
```

Parallel tracks for several people after WP1.3: **Track A** parsers (WP1.4, WP1.5); **Track B**
taxonomy + LLM gateway + classification (WP1.6, WP1.7); **Track C** translation (WP1.8, needs
WP1.5 output); **Track D** retrieval, context packs, reports, API (WP1.9, WP1.10, needs A and B);
**Track E** tests and CI throughout.

---

## 8. Classification policy (team decision, recorded)

1. The VFC level-2 / level-3 lists extracted from the data are canonical and frozen.
2. The LLM classifies only rows without a canonical classification. It must select from the
   canonical lists first.
3. If nothing fits, it may propose a new theme; the proposal is stored with status `proposed`, is
   excluded from aggregates until approved, and approval / rejection is a logged human event.
4. Given classifications are never overwritten by the LLM. Human corrections create a new
   classification row (origin = human) and an event; the original stays for traceability.
5. Every LLM classification carries confidence, rationale, model ID and prompt version.

---

## 9. Testing and data-quality strategy

* Parser tests pin the exact counts of step 01 and spot-check known rows and equipment lines.
* Schema tests: every evidence row has `source_id`, `locator`, `created_run_id`.
* Distribution tests: US study shares sum to 1; CN / EU means within 1–10; no empty verbatim.
* Classifier validation: blind agreement rates on 300 labelled verbatims per vehicle, reported.
* Translation review: bilingual sample filed.
* Idempotence: running ingestion twice yields identical counts and no duplicate events of kind
  "created"; LLM response cache prevents repeated calls.
* Data-quality report generated per run (missing values, unknown countries, unmapped attributes,
  unresolved taxonomy names) and attached to the step report.

---

## 10. Definition of done (Phase 1)

- [ ] `make ingest` builds the database from `docs/` in one command; counts match step 01.
- [ ] Every evidence item has a locator and a run; every run has a configuration snapshot.
- [ ] Canonical taxonomy loaded; level 2 → domain map reviewed; proposals workflow works.
- [ ] ≥ 95 % of unclassified verbatims classified or proposed; validation report filed.
- [ ] Source B segments stored with product / process flag.
- [ ] Equipment matrix translated and queryable per variant; technical specs stored.
- [ ] Embeddings and hybrid search working; context packs and drill-down tools available.
- [ ] Event log covers every ingestion, classification, translation and tool call; export works.
- [ ] Baseline reports for F70, G60 and G70 generated and committed as samples.
- [ ] API with OpenAPI docs running locally; tests and CI green.
- [ ] Step reports for every work package; pull request(s) merged by the team.

---

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| PDF table parsing is brittle (rotated headers, wrapped lines, footnotes) | Position-based parsing with per-page validation; LLM structuring fallback with human spot checks; locators per page and line in both paths |
| Embedding model download blocked by network policy | Verify at WP1.9 start; fallback to a hosted embedding API or a small bundled model |
| LLM classification drifts from the given labelling style | Few-shot from nearest classified examples; blind validation; one tuning round; confidence stored |
| Source B notes contain personal or dealer details | Segmentation keeps only product statements for later quoting; raw text stays internal |
| Cost surprises | Response cache, prompt caching, Batches, per-call cost log, hard cap per run in settings |
| Over-engineering the foundation | Work packages have explicit acceptance criteria; UI stays optional in Phase 1 |

---

## 12. Reporting plan

* One step report per completed work package group: `reports/step-03-wp1.1-1.3-skeleton-db-audit.md`,
  `reports/step-04-wp1.4-1.5-parsers.md`, `reports/step-05-wp1.6-1.8-taxonomy-llm-translation.md`,
  `reports/step-06-wp1.9-1.10-retrieval-reports-api.md`, `reports/step-07-phase-1-closeout.md`.
* Each report: what was built, how it was verified (numbers), decisions taken, open issues, next.
* One pull request per step to `main`.

---

## 13. Inputs needed from the team (status after step 03)

1. **OpenAI API access** (open): API key, chat model name(s) for bulk and reasoning jobs, and the
   embedding model name; to be set in `.env` (`TRACEPOINT_OPENAI_API_KEY`, `TRACEPOINT_OPENAI_MODEL`,
   `TRACEPOINT_EMBEDDING_MODEL`). Needed for WP1.7 and WP1.9.
2. **Stack** (decided): Python + FastAPI + PostgreSQL + provider SDK gateway (OpenAI), React for the
   UI from Phase 6.
3. **Embeddings** (decided in principle): hosted OpenAI embeddings; optional `pgvector` installation
   in the database for larger volumes.
4. **`docs/` stays read-only** (confirmed).
5. **Review requests** (open): baseline reports under `reports/baseline/`, the authored mappings
   under `config/` (domain map, attribute map, translations), and the data-quality notes in
   `reports/step-03-phase-1-internal-ingestion.md`.
