# Tracepoint – Master Plan

AI-powered customer requirements platform for BMW product managers (hackathon project).

| Field | Value |
|---|---|
| Version | 1.2 (2026-10-10, step 04: finding model and deterministic extraction started ahead of Phase 2) |
| Status | Framework agreed in principle; Phase 1 is the active phase. Phases 2–8 are a living outline and will be re-planned in detail when they start. |
| Related | `reports/step-01-challenge-and-data-analysis.md` (inputs), `plan/01-phase-1-foundation-and-internal-evidence-base.md` (active phase), `plan/decisions.md` (decision log) |

---

## 1. Purpose and vision

Tracepoint ingests heterogeneous evidence about a BMW derivative (internal customer verbatims,
customer studies, sales volumes, equipment lists) and enriches it with external evidence
(competitor products and their customer feedback, regional statistics, market and technology
trends). From that evidence it extracts signals, derives clear and measurable customer
requirements, prioritizes them with an explainable and adjustable logic, and puts one product
manager (PM) in the loop at the decisions that matter. Every step is recorded in an audit trail so
that any requirement can be traced back to its findings and sources, and any change back to who or
what made it, when, and why.

The team's direction (from the planning Q&A, see `reports/step-02-planning.md`):

* Scope is not kept small: there is enough time and people.
* BMW data alone is not enough. Strength comes from **data ingestion and fusion**: BMW data,
  customer data, customer data of comparable competitor products, regional statistics, trends.
* Evidence is organised in **layers** (customer voice, metrics, regional demand, competition,
  portfolio, trends). Each layer influences priority in a visible, explainable way; for example a
  frequent wish that does not fit the portfolio tier of the vehicle is dampened automatically, and
  the PM sees why.
* Requirements are produced for **two horizons** (near-term and long-term) and carry
  **measurable, region-specific acceptance criteria**.
* The AI proposes weights and priorities; the PM adjusts weights, the stored evidence is
  re-processed deterministically and the new report is compared with the previous one.
* **Sub-agents** fetch, link, compare and estimate; the result may be a change proposal per
  **vehicle domain** (for example "change colour range now, move powertrain topics to the next
  model"), and the PM decides per domain and per horizon.
* External data is fetched from the internet by research agents from sources the team selects,
  and is **cached in the database**; the pitch runs from the cache.
* Everything (code, documentation, commits) is in English; every step is reported and filed.

---

## 2. Guiding principles

1. **Evidence first, always traceable.** Nothing enters a finding or a requirement without a
   locator back to its source (file / sheet / row, page / line, URL / excerpt).
2. **Layered evidence, visible reasoning.** Every layer's contribution to a priority is shown as a
   separate component with a written reason. Dampening and boosts are never silent.
3. **AI proposes, PM decides.** The AI runs autonomously up to the gates; the PM approves,
   rejects, edits, defers or challenges. Gates are mandatory and logged.
4. **Deterministic re-runs.** Fetching and extraction are separated from scoring. Scoring is a pure
   function of stored findings, configuration and weights, so re-scoring is reproducible and
   comparable.
5. **Configurable, not one-off.** Vehicle, market and portfolio profiles, taxonomy mappings and
   weight profiles live in configuration, so another derivative or market is a configuration
   change, not a rewrite.
6. **Canonical taxonomy.** The given VFC taxonomy (level 2 / level 3) is the canonical theme
   structure. The LLM only fills gaps: it selects from the canonical list first and proposes a new
   theme only when nothing fits; proposals need human approval.
7. **Simple, well-understood technology.** Prefer the simplest robust integration (official SDKs,
   PostgreSQL, plain Python) over frameworks.
8. **Reported and filed.** One report per step under `reports/`, English only, one pull request
   per step to `main`.

---

## 3. Core concepts and vocabulary

| Term | Definition |
|---|---|
| **Evidence source** | A registered origin of evidence: an internal file (sheet, PDF) or an external web page / document fetched by a research agent. Has a kind, a layer, a reliability note and a fetch timestamp. |
| **Evidence item** | The atomic, addressable unit of evidence: a verbatim, a classification row, a study metric, a sales figure, an equipment line, a technical value, a web excerpt. Every item has a **locator**. |
| **Evidence layer** | One of six lenses through which evidence is grouped and scored: Voice of Customer, Quantitative Metrics, Regional Demand & Context, Competition, Portfolio & Offering, Market Trends (section 4.2). |
| **Vehicle domain** | The part of the car a requirement changes; the unit at which the PM can decide and defer: Exterior & Design, Interior Comfort & Materials, Space & Practicality, Infotainment & Digital Services, Driver Assistance & Parking, Powertrain Range & Charging (as experienced), Driving Experience & Dynamics, Quality Perception & NVH, Variant & Package Offering; plus General for cross-cutting statements (`config/taxonomy/domains.yaml`). |
| **Finding** | A layer-specific, quantified signal with linked evidence: recurring complaint, unmet need, strength to keep, metric gap, equipment gap, competitor advantage, regional expectation, trend, portfolio constraint. Has an evidence level. |
| **Finding link** | A cross-layer connection between findings (supports / contradicts / explains) with a written rationale. |
| **Requirement** | A customer-facing, actionable statement derived from findings, with ID, vehicle domain, horizon, region applicability, measurable acceptance criteria per region, rationale, assumptions and uncertainties, evidence level, status, versions. |
| **Horizon** | **H1 near-term**: achievable within the current generation (model-year update, LCI, software / OTA, equipment, packages, colours, trims; roughly within two years). **H2 long-term**: successor generation (about 2030 and later, matching the 2030 sales forecast). |
| **Weight profile** | The set of factor and layer weights used for scoring for a given vehicle and market. AI-proposed with rationale, PM-adjustable, versioned. |
| **Priority score** | A deterministic score computed from findings, profiles and weights, shown as components plus total plus written rationale. |
| **Variation (scenario)** | An alternative allocation of requirements to horizons / vehicle domains (for example "evolve the current car" vs "carry into the new generation" vs "split by domain") with rough effort and cost estimates and expected customer impact. |
| **Gate** | A mandatory PM decision point (section 5). |
| **Challenge** | A PM question or dispute about a requirement, its evidence or its score; triggers a logged AI re-analysis (for example "re-score without source B", "is this still valid for BEV?"). |
| **Audit event** | An append-only record: timestamp, actor (human / agent / system), action, entity, before / after, rationale, run, model and prompt version where applicable. |
| **Run** | One execution of a pipeline stage with a configuration snapshot, code version and model identifiers; all events and outputs reference their run. |

---

## 4. Target architecture

### 4.1 Component overview

```
                 ┌──────────────────────────────────────────────────────────────────┐
                 │                        Configuration                             │
                 │  vehicle profiles · market/region profiles · portfolio profiles  │
                 │  taxonomy (canonical VFC + domain map) · source registry         │
                 │  weight profiles · prompt registry                               │
                 └──────────────────────────────────────────────────────────────────┘
                                                  │
  Internal files ──► Ingestion (deterministic parsers + LLM gap filling/translation)
                                                  │
  Team-selected  ──► Research sub-agents (fetch → snapshot cache → extraction)
  web sources                                     │
                                                  ▼
                 ┌──────────────────────────────────────────────────────────────────┐
                 │               Evidence store (PostgreSQL + embeddings)           │
                 │  typed evidence tables · locators · embeddings · runs · events   │
                 └──────────────────────────────────────────────────────────────────┘
                                                  │
                  Analysis sub-agents: finding extraction per layer, cross-layer linking
                                                  │
                  Requirement agent: candidates (0/1) → specification + acceptance criteria
                                                  │
                  Scoring engine (deterministic) + weight-proposal agent + estimation /
                  variation agent (new car vs R&D on existing, rough effort and cost)
                                                  │
                 ┌──────────────────────────────────────────────────────────────────┐
                 │  PM workspace (API + UI): review queue, gates, edit, defer per   │
                 │  domain/horizon, challenge, weight tuning, re-run and compare    │
                 └──────────────────────────────────────────────────────────────────┘
                                                  │
                  Audit trail (append-only events) · traceability views · exports
```

All agents call the LLM through one **LLM gateway** (provider SDK, OpenAI as decided by the team;
structured outputs; response caching; every call logged with model, prompt version, tokens and
cost). An **orchestrator** runs stages as runs with configuration snapshots.

### 4.2 Evidence layers

| # | Layer | Internal sources (Phase 1) | External sources (Phase 2, team-selected) | Typical findings |
|---|---|---|---|---|
| L1 | Voice of Customer | Verbatims F70 / G60 / G70 (Sources A–D) with VFC classification | Owner reviews of competitor products; further BMW owner feedback | Recurring complaints, unmet needs, strengths to keep |
| L2 | Quantitative Metrics | Customer studies (CN/EU means, US distributions) | Satisfaction / quality indices, competitor metrics | Metric gaps and strengths versus other models, markets, competitors |
| L3 | Regional Demand & Context | Country → market mapping, powertrain mix per market | Regional statistics, climate / usage context, regional expectations (for example rear-seat screens in China, heating in the Nordics) | Regional expectations and modifiers |
| L4 | Competition | – | Competitor equipment lists, features, customer feedback, metrics | Competitor advantages, parity gaps |
| L5 | Portfolio & Offering | Option lists (standard / optional per variant), prices as rough cost proxy, sales volumes and 2030 forecast, segment / tier profile | – | Equipment gaps (missing / optional only), portfolio constraints, market weight |
| L6 | Market Trends | – | Magazines, trend reports, technology outlooks | Trend alignment, future-facing assumptions |

### 4.3 Sub-agent roster

| Agent | Responsibility | Autonomy |
|---|---|---|
| Classifier | Fills missing VFC classifications from the canonical list; proposes new themes only when nothing fits | Autonomous; new themes need approval |
| Translator / normaliser | Translates German equipment data to English with a glossary; harmonises study attribute names | Autonomous; mapping tables reviewed by the team |
| Research agents (per source family) | Fetch team-selected web sources, store snapshots, extract structured evidence items with locators and reliability | Autonomous fetch; source list is human-defined |
| Finding agents (per layer) | Quantify signals per vehicle × market × powertrain; assign evidence levels | Autonomous |
| Linker | Connects findings across layers (supports / contradicts / explains) | Autonomous |
| Requirement agent | Turns linked findings into candidate requirements, then specifications with region-specific measurable acceptance criteria, horizon, assumptions and uncertainties; scope filter | Autonomous up to Gate G1 / G2 |
| Weight-proposal agent | Proposes a weight profile per vehicle × market from data, market and metrics with rationale | Proposes; PM decides (Gate G3) |
| Estimation / variation agent | Rough effort and cost (T-shirt sizes with reasons), scenario variations (evolve existing vs new generation vs split by domain) | Proposes |
| Challenge agent | Answers PM challenges with evidence; triggers logged re-analysis or re-scoring | On demand |
| Report / compare agent | Builds report versions, diffs between weight profiles or runs, pros / cons / suggestions | On demand |

---

## 5. End-to-end workflow and human gates (deliverable D3)

| Step | Activity | Actor |
|---|---|---|
| 1 | Register sources; ingest internal files; fill classification gaps; translate; embed | AI (autonomous) |
| 2 | Fetch team-selected external sources; cache; extract evidence | AI (autonomous); source list by humans |
| 3 | Extract findings per layer; link across layers; assign evidence levels | AI (autonomous) |
| **G1** | **Approve the finding / theme set** (including new taxonomy proposals) | **PM (mandatory)** |
| 4 | Derive candidate requirements (implement? 0/1); specify approved candidates with measurable, region-specific acceptance criteria, horizon, assumptions | AI (autonomous) |
| **G2** | **Approve / reject / edit each requirement before it enters the prioritised backlog** | **PM (mandatory)** |
| 5 | Propose weight profile; score; build variations with rough effort / cost; produce report version | AI (proposes) |
| **G3** | **Approve the weight profile and the resulting priorities; any weight change → deterministic re-run → report diff → PM accepts** | **PM (mandatory)** |
| 6 | PM decides per vehicle domain and horizon (approve now, defer to H2, reject); challenges trigger logged re-analysis | PM + AI on demand |
| **G4** | **Release the requirement list (versioned)** | **PM (mandatory)** |
| 7 | Audit trail, traceability views, exports | System |

---

## 6. Prioritisation concept (to be detailed in Phase 5)

* **Factor families**, one per layer plus cross-cutting factors: customer impact (frequency ×
  severity, where Defect > Difficult to use > Want; sentiment), metric gap, regional fit,
  competitive pressure, portfolio fit (including tier dampening), trend alignment, evidence
  strength (evidence level), rough effort / cost (negative), horizon feasibility.
* **Weight profiles** per vehicle × market: AI-proposed with written rationale, PM-adjustable,
  versioned. Region profiles encode context such as climate and usage patterns.
* **Deterministic scoring**: score = Σ (weight × normalised factor) with every component and
  reason stored; a weight change re-scores stored findings without re-fetching and produces a new
  report version plus a diff against the previous one.
* **Variations**: scenario runs (evolve existing model / new generation / split by domain) with
  rough effort and cost estimates and expected customer impact; the AI reports pros, cons and
  suggestions; the PM chooses per domain.
* **Evidence levels**: A = multiple independent sources and quantitative confirmation; B = several
  items from one source family; C = single or weak item, or web-only; D = assumption. Definitions
  will be tuned in Phase 3.

---

## 7. Phases

### 7.1 Overview

| # | Phase | Goal | Main outputs | Deliverable mapping |
|---|---|---|---|---|
| 1 | **Foundation and internal evidence base** (active; internal ingestion delivered in step 03) | Working skeleton; all internal files ingested, normalised, classified, translated, embedded; audit log live; baseline reports | Repo skeleton, data model, parsers, canonical taxonomy, classifier, retrieval, API, baseline situation-analysis reports | D1 (foundation), D4 (log core) |
| 2 | External evidence ingestion | Research sub-agents fetch team-selected sources and cache them; structured evidence for layers L1–L4, L6 | Source registry, fetch / snapshot pipeline, extractors, reliability tagging | D1 |
| 3 | Signal extraction and cross-layer linking (first deterministic iteration delivered in step 04) | Findings per layer with quantification, evidence levels and links | Finding agents, linker, finding store, G1 queue | D2 (findings) |
| 4 | Requirement derivation and specification (first set of 57 requirements for three scopes delivered in step 11) | Candidate 0/1 step; specified requirements with region-specific acceptance criteria, horizon, assumptions | Requirement agent, scope filter, consolidation, G2 queue | D2 |
| 5 | Prioritisation engine, variations and estimation | Explainable, adjustable scoring; variations with rough effort / cost; report versions and diffs | Scoring engine, weight-proposal agent, estimation / variation agent, compare | D2 |
| 6 | PM workspace | Review queue, gates G1–G4, edit / defer per domain and horizon, challenge flow, weight tuning and comparison, traceability view | Web UI + API | D1, D3 |
| 7 | Audit trail completion and exports | Completeness check of the trail; traceability views; exports of the requirement list and the event log | Exports (JSON / CSV / XLSX), traceability report | D2, D4 |
| 8 | Adaptability, hardening and demo mode | Second derivative / market run; cache-only demo mode; pitch material | Config for second vehicle, demo script, presentation | D1–D4 |

Cross-cutting (every phase): step reports and pull requests, tests and data-quality checks,
configuration over code, cost and token tracking of LLM calls, security of keys and secrets.

### 7.2 Phase details

**Phase 1 – Foundation and internal evidence base.** See the dedicated plan. Exit criteria: one
command ingests all eight internal files reproducibly with counts verified against step 01;
every evidence item has a locator; canonical taxonomy with domain mapping; unclassified verbatims
classified with confidence and new-theme proposals queued; equipment matrix translated and
queryable; retrieval works with filters; every ingestion and classification is in the event log
and exportable; baseline reports per vehicle generated; tests pass in CI.

**Phase 2 – External evidence ingestion.** Inputs: the team's source list (competitor products
and their customer feedback, regional statistics, magazines, trend reports; for example a Chinese
competitor's comparable car). Activities: source registry with layer, reliability and licence
notes; research sub-agents using server-side web search / fetch restricted to allowed domains;
snapshot cache (raw page, fetch time, checksum) in the database; extractors producing evidence
items with locators (URL + excerpt); deduplication; cache-only mode for the pitch. Exit criteria:
every external evidence item is reproducible from its cached snapshot; the pipeline runs offline
from the cache.

**Phase 3 – Signal extraction and cross-layer linking.** Activities: finding agents per layer
(VoC recurrence and severity per vehicle × market × powertrain, metric gaps, equipment gaps,
competitor advantages, regional expectations, trends, portfolio constraints); evidence-level
assignment; linker producing cross-layer links with rationale; G1 queue (finding set + taxonomy
proposals). Exit criteria: every finding has quantified evidence, a level and links; the PM can
approve the finding set.

**Phase 4 – Requirement derivation and specification.** Activities: candidate generation with
0/1 "implement?" proposal and reasons; scope classifier (in / out of the challenge scope);
specification with measurable, region-specific acceptance criteria (for example "rear-seat
screens available in CN variants", "cabin pre-heating time ≤ X minutes at −15 °C for Nordic
markets"), horizon H1 / H2 with reason, assumptions and uncertainties; consolidation and
deduplication; G2 queue. Exit criteria: a structured requirement list for the demo vehicle with
every mandatory field of deliverable D2.

**Phase 5 – Prioritisation engine, variations and estimation.** Activities: factor computation
per layer; AI weight-profile proposal with rationale; deterministic scoring with stored
components; portfolio tier dampening and regional modifiers with visible reasons; rough effort /
cost estimation (T-shirt sizes, reasons, uncertainty); variations (evolve existing / new
generation / split by domain); report versions and diffs; G3 queue. Exit criteria: a change of
weights re-scores without re-fetching and produces a comparable report.

**Phase 6 – PM workspace.** Activities: web UI for the review queue, gates G1–G4, edit with
versioning, decide per vehicle domain and horizon (approve / reject / defer), challenge flow with
logged AI re-analysis, weight editor with re-run and comparison, traceability view (requirement →
findings → evidence → sources), event timeline per requirement. Exit criteria: the complete
workflow of section 5 can be executed in the UI by one PM.

**Phase 7 – Audit trail completion and exports.** Activities: completeness audit (every
change to content, score, priority, evidence or status has an event with actor, time and
rationale); exports of the event log and the requirement list (JSON, CSV, XLSX); traceability
report generator. Exit criteria: deliverables D2 and D4 are exportable from the application.

**Phase 8 – Adaptability, hardening and demo mode.** Activities: run the full pipeline for a
second derivative and market by configuration only; cache-only demo mode; performance and
robustness fixes; pitch material and demo script (the demo itself is decided after the project
is complete). Exit criteria: second vehicle run succeeds without code changes to the pipeline.

---

## 8. Deliverable traceability

| Deliverable | Where it is produced |
|---|---|
| D1 Concept + demonstrable prototype | Phases 1–6 (prototype), this plan (concept) |
| D2 Structured requirement list with all mandatory fields | Phases 3–5 (content), Phase 7 (export) |
| D3 End-to-end workflow with autonomy map and mandatory human review | Section 5 of this plan, refined in Phases 4–6 |
| D4 Demonstrable audit trail | Phase 1 (event log core), every phase (events), Phase 7 (views and exports) |

---

## 9. Conventions

* **Language:** English for code, documentation, commit messages, UI and reports.
* **Repository layout:** `docs/` raw challenge inputs (read-only) · `plan/` master plan, phase
  plans, decision log · `reports/` step reports (`step-NN-<topic>.md`) · `config/` profiles,
  taxonomy, sources, weights · `backend/` Python application · `frontend/` web UI (from Phase 6,
  optionally a minimal explorer earlier) · `data/` generated artefacts (database, caches, exports;
  git-ignored except small samples).
* **Branching:** work on the designated branch, one pull request per step to `main`; the team
  merges.
* **Reporting:** every step produces a report before its pull request; the report states what was
  done, what was verified (with numbers), what was decided and what is next.
* **Decisions:** recorded in `plan/decisions.md` with an ID, date, context and consequences.
* **Configuration over code:** vehicle, market, portfolio and weight profiles, taxonomy mappings
  and the source registry are files under `config/`.

---

## 10. Assumptions and risks

| Assumption / risk | Handling |
|---|---|
| "Today" is mid-2026 (catalogues July 2026, sales 2025 actual, 2030 forecast); H2 targets about 2030 | Stated in requirements as a future-facing assumption |
| Sales volumes have no powertrain split | Use the engine-type mix of the feedback per market as a proxy, flagged as an assumption, until external data provides a split |
| Option lists are Germany-only and in German | Translate; treat as "what the product offers today" for EU; external sources cover other markets |
| China / G68 has no verbatims | Deferred; competitor and regional evidence for CN comes from Phase 2 sources |
| Source B notes mix product and process content | Segment product-relevant statements in Phase 1 |
| LLM classification quality | Blind validation on a sample of already-classified verbatims with reported agreement rates |
| Scope creep into engineering / regulatory / pricing | Scope classifier in Phase 4 plus PM gate |
| Cost of LLM calls | Prompt caching, batch processing for bulk jobs, per-call cost logging; current estimate for Phase 1 is below USD 100 |

---

## 11. Immediate next steps

1. Team review of this plan and the Phase 1 plan (pull request).
2. Provide the inputs listed in the Phase 1 plan (API access, confirmation of the stack, network
   permission for the embedding model).
3. Start Phase 1 work packages in the order and parallel tracks given in the Phase 1 plan.
