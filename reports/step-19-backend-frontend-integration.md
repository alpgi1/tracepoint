# Step 19: backend and frontend integration

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Branch | `claude/youthful-edison-379or6`, restarted from `main` at `c7f72e1` (pull requests 30 and 31 merged) |
| Asked for | Understand the backend's flow and what it can analyse; understand what the frontend needs; format the backend's data in the product manager's language, classify and structure it; push it to the frontend; remove what the frontend shows beyond the backend; add the endpoints and data feeds that are missing; integrate the whole system; report |
| Decisions | D-100 (the presentation layer and the briefs), D-101 (one data feed), D-102 (external evidence on screen), D-103 (stages per scope, the PM's language), D-104 (the backend's exporter, the engine's rules) |
| Result | Every figure on screen now comes from the backend API, through one feed. The backend serves 7 new read endpoints and a scope filter on its events, the frontend 2 new pages and the analyst's brief on stage 2; out-of-scope screens and lines are gone; the copy names no endpoint, setting or file. Backend 100 tests, frontend 60 tests and the build pass; the page audit finds nothing on 30 pages; the live mode was run end to end |

---

## 1. The backend: what it does, what it can analyse

The backend is a pipeline into one PostgreSQL evidence store, with a read API on top. Each step is
a CLI command (`tracepoint ...`, `start.sh` runs them in order), logged as a run with audit
events.

| Step | What it produces | Volume (this ingest) |
|---|---|---|
| Ingest | Reference data (4 vehicles, 4 markets, 16 countries, 225 + 84 themes), customer verbatims of the three feedback workbooks with their workbook labels, customer studies (CN/EU means 1 to 10, US distributions 1 to 7), sales 2024, 2025 and 2030, the German option lists (variants, equipment, availability, specs), the BMW Group Report page by page, the external evidence of the team's source lists | 10,128 verbatims, 13,771 classification rows, 391 study metrics, 36 sales rows, 463 catalogue items, 434 report pages, 124 external sources, 143 external statements |
| Classify | The assistant's gap labels for unlabelled rows (committed, re-applied without a model call) | 4,433 labels |
| Findings | Deterministic findings per vehicle and market: recurring complaints, unmet needs, strengths, weak and strong study scores, catalogue gaps, with evidence levels A to D and links (supports, contradicts, explains) | 763 findings, 232 links |
| Requirements | The requirement agent's candidates (G60 US, G70 US, F70 EU) with the 0/1 proposal, horizon, criteria per market, assumptions, evidence level; versioned; gate G2 decisions replayed from a file | 57 requirements |
| Effort | The CPM engine (Change Prediction Method): per requirement the share of a new vehicle generation's development effort with P5 to P95, class, stability, layer, the subsystems the change reaches, a catalogue scan and the checks; packages per horizon combined per subsystem; a back-test against 8 documented BMW decisions | 57 estimates, 8 of 8 anchors |
| Analyses (model) | The analyst agent: a situation analysis of one vehicle in a market or country (headline, proposals with their effort, what customers say, what is open) and a series analysis across regions (per topic: change now in every region, in one region, next generation, keep, no action) | Committed: G60 US, G68 CN, F70 GB, the 5 Series across EU, US, CN |

The model steps need an OpenAI key (none in this environment); their results are files. Everything
else is deterministic and was rebuilt for this step into a fresh database (`tracepoint_int`) from
the committed inputs, so the screens rest on the same data as a new checkout.

**What the API served before this step**: the evidence rows (`/verbatims`, `/studies`, `/sales`,
`/equipment`, `/specs`, `/findings`), the requirements with their detail and decisions, the effort
endpoints (`/effort/requirements`, `/effort/scenarios`, `/effort/model`, `/effort/backtest`,
`POST /effort/estimate`), the CPM view (`/cpm/{vehicle}`), the audit log (`/events`), the baseline
report and the agent tools. **What it did not serve**: the analyses (only `POST /agent/analyze`,
which runs the model), the series analysis, the external evidence (only through an agent tool that
writes an audit event per call), a scope filter on the events, the D2 export, and anything shaped
for the landing page.

## 2. The frontend: what each screen needs

| Screen | Needs | Source before this step |
|---|---|---|
| Map, market panel, vehicle cards | Per market and vehicle: 2025 units, verbatims, the domain with the highest complaint share, the weakest study scores | `content/markets.json`, built by the frontend's own Python script from the workbooks and the committed baseline reports |
| Stage 1, vehicle screen and subsystem dialog | The twelve subsystems with customer rows, themes, quotes, market rows; requirements per subsystem | `content/cpm.json`, built by a second Python script from the workbooks; the workspace snapshot |
| Stage 2 | Candidates with 0/1, inbox rules, excluded candidates; the analyst's brief (plan 08, 4.1) | The snapshot; the brief had no source |
| Stages 3 to 5 | Requirement detail and evidence, effort and packages, decisions and events, the D2 list | The snapshot and the live API; the CSV written by the frontend; the events through a 5,000-row workaround |
| Method sheet | The whole effort model | `/effort/model`, without the engine's rules |

## 3. What did not fit (the gap analysis)

1. **Two sources for the same figures.** The two Python builders re-implemented the backend's
   counting and had drifted: the G70 in the European Union has 19 verbatims and 33 classified rows
   in the evidence store, and the map and the vehicle screen said "no verbatims yet".
2. **The analyses had no way to the screen**: four briefs on disk, no GET endpoint, codes in their
   text (`software_hmi 0.1 K2`), references as ids.
3. **External evidence had no way to the screen**: 143 statements with their verification; the
   subsystem dialog said competitor and regional sources were Phase 2.
4. **The frontend showed more than the backend holds**: stages 2 to 5 existed as empty pages for
   the four scopes without a requirement set; every CPM row of those scopes said "no requirement
   set"; China showed Liked and Disliked bands with nothing in them.
5. **Developer language on screen**: "Source: the backend API", "snapshot", `TRACEPOINT_LIVE=1`,
   `cd backend and uv run uvicorn ...`, `GET /effort/model`, `config/decisions/requirements.jsonl`,
   decision ids in hints.
6. **Duplicated logic in stage 5**: the frontend wrote its own CSV; the backend's exporter was CLI
   only. The events needed one 5,000-row call per read.

## 4. What was built

### 4.1 Backend (`backend/tracepoint/briefs/`, `reports/overview.py`, `api/app.py`)

| Piece | What it does |
|---|---|
| `briefs/labels.py`, `GET /glossary` | The PM's vocabulary: effort classes with the model's thresholds, layers K0 to K3, sizes, evidence levels A to D beside the source levels weak to strong, verification, trust, finding and insight kinds, the five decisions of a series, the checks of the engine by rule, markets, subsystems, domains. One place, served to anyone |
| `briefs/text.py` | The agents' sentences in plain words: subsystem and domain keys become names, `0.1 K2` becomes "own impact 0.1, module change", `at K3` "as a platform change", field names become words, evidence ids leave the sentence, dashes become words, a short list of marketing filler becomes plain words. Requirement ids stay. The stored JSON keeps the original |
| `briefs/refs.py` | Every evidence reference read back from the store in one line, one query per kind: a customer verbatim with its words, a finding with its kind and level, a study score with its mean and shares, a catalogue item, sales, specs, an external statement with source, date and whether its figures stood on the page, a report page, a part of an external page by its listed source. A reference the store does not hold is named, never dropped |
| `briefs/store.py` | The stored analyses: `data/analyses/` (runs on this machine) before the committed `reports/analysis/`; only keys found on disk are served, so a request never names a path; which vehicle and market pairs each one speaks about (a series: one per region) |
| `briefs/views.py`, `GET /analyses`, `GET /analyses/{key}`, `GET /analyses/{key}/brief` | The briefs as the PM reads them. Situation: the proposals grouped into change now (H1), with the next generation (H2) and keep or act outside the vehicle; each with its effort (figure, range, class, stability, layer, basis, footprint) and checks; what customers say grouped into complaints, wishes, weak study scores, offer gaps, market context and strengths; the engine's packages; assumptions and open checks. Series: the regions side by side, the topics sorted into the five decisions, per topic the regional evidence, the car today, rivals, reasoning, effort, references by region; the optimum version per region; what the data cannot answer |
| `briefs/external.py`, `GET /external` | The external statements of a market and vehicle with every code in words; filters for subsystem, topic, kind and verified only; links only to http and https |
| `reports/overview.py`, `GET /overview` | The landing page's content, from the store: the port of the frontend's builder, counted on the workbook labels like `GET /cpm` |
| `GET /events?entity_prefix=` | One scope's events in one call; the prefix is taken literally (no wildcard) |
| `GET /requirements/export`, `requirements/report.py` | The D2 list as CSV or Markdown; the exporter (CLI too) now carries each requirement's effort and its latest G2 decision |
| `GET /effort/model` | Adds the engine's rules: carryover factor, propagation reference, platform rule, certification trigger, K0 limit, path length, sizes |
| Tests | `tests/test_screens.py` (10 tests: the plain words, the vocabulary without dashes, the index, both briefs with every reference resolved, unknown references named, the overview equal to the committed content, the external view, the read endpoints, the exporter with a decision rolled back); `tests/test_subsystems.py` now holds `content/cpm.json` equal to `GET /cpm` for all seven pairs |

### 4.2 Frontend

| Piece | What it does |
|---|---|
| `scripts/snapshot.mjs` (`pnpm snapshot`) | The one data feed: `markets.json`, `cpm.json`, `effort.json`, `analyses/` (index and four briefs) and the seven workspace files with external evidence and exports, all the API's answers unchanged. `build-content.py` and `build-cpm.py` deleted |
| Stages per scope | `lib/workspace/stages.ts`, `figures.ts`: a stage exists where the backend holds something; the bar links only those; the routes of the others render the not-found page |
| Stage 2, the analyst's brief | `analyst-brief.tsx`: the answer, the proposals table grouped by what they ask of the vehicle with expanding rows (proposal, reasoning, effort, checks, resolved references), the packages, what customers say by kind, what is open; G60 US, F70 EU (from the GB analysis, labelled so) and G68 CN |
| The series across its regions | `/markets/[market]/[vehicle]/regions` with `series-view.tsx`: for G60 EU, G60 US and G68 CN |
| Market evidence | `/markets/[market]/[vehicle]/market` for all seven scopes (51 to 79 statements each), the dialog's market band with the first three statements per subsystem, the CPM rows of China counting market statements |
| Exports | `/log/requirements.csv` and `/log/requirements.md` serve the backend's exporter (stored, or live) |
| Live mode | Reads the briefs and the export live, the events in one filtered call; the package builder only in the live mode |
| The PM's words | `lib/site.ts` rewritten where it spoke developer: source lines, decision notes and failures, builder messages, export and timeline hints, the method sheet |
| Tests | `lib/content/briefs.test.ts` (8), `lib/workspace/stages.test.ts` (4); the CPM and workspace contracts adjusted; the CSV writer's tests removed with it |

### 4.3 The PM's language, before and after

| Where | Before | After |
|---|---|---|
| Source line | Source: the backend API, read on 2026-10-11 02:46 UTC; backend code e06b37f | Data as stored on 2026-10-11 06:48 UTC; effort model 789fcb7624b8, its weights are assumptions, not calibrated; Tracepoint version c7f72e1 |
| Live failure | The live read fell back to the snapshot; the API did not answer at http://127.0.0.1:8000: fetch failed | The live service did not answer, so this page shows the data as stored on ... |
| Decision outside the live mode | ... need the running backend API in the live mode (TRACEPOINT_LIVE=1); this page reads a snapshot taken on | Decisions are recorded when Tracepoint runs live; this page shows the data as stored on ... |
| Package builder without the API | ... Start it and reload: cd backend and uv run uvicorn tracepoint.api.app:app --port 8000 | The package builder asks the effort engine for any set you choose; it works when Tracepoint runs live |
| Analyst's sentence | driven mainly by software_hmi 0.1 K2 plus interior_console 0.1 K2 | driven mainly by Software/HMI (own impact 0.1, module change) plus Interior/console (own impact 0.1, module change) |
| Reference | `metric:MET-US-US-G60-infotainment_menu_structure` | Menu structure of infotainment system: study US_2025, G60 in United States, mean 4.88 on 1 to 7, 36 % in the top two boxes, 13 % in the bottom three |
| Series decision | `change_now_regional`, `["US"]` | Change now, regional: within the current generation, only where the evidence asks for it. For: United States |

## 5. Removed as out of scope

* The empty pages of stages 2 to 5 for scopes without a requirement set (G60 EU, G70 EU, G70 CN;
  G68 CN keeps stage 2 for its brief) and the component that filled them.
* The "no requirement set" line on every CPM row of those scopes, and the dialog's requirements
  band there.
* The Liked and Disliked bands of a market without verbatims (China).
* The "Phase 2" sentence of the market band; the method sheet's "not served" note.
* The package builder outside the live mode (one sentence instead).
* The fields of `markets.json` no screen read since step 13 (per-vehicle domains and complaint
  themes), the frontend's CSV writer, both Python builders and `pnpm content`.
* Not built, on purpose: a button that starts an analysis run (it needs the model key, takes one to
  two minutes and spends credit; the CLI writes the files the API serves).

## 6. Verification

| Check | Result |
|---|---|
| Backend `ruff check`, `ruff format --check` | clean |
| Backend `pytest` | 100 passed (the tests of this step included) |
| Frontend `pnpm check` (lint, typecheck, 60 tests, build) | clean |
| `pnpm audit:pages`, 30 pages (snapshot mode) | 0 findings: landmarks, headings, names, 44 px targets, keyboard tour, 375 px overflow, forbidden text, console |
| `pnpm shots` | 49 states, no console error; written to `frontend/docs/screenshots/` with the two live states below |
| Live mode, end to end (`TRACEPOINT_LIVE=1`, API on the fresh database) | Source lines "Live data, read on ..."; the briefs read from the API; the package builder estimated IC-01, ID-01 and PR-03 together at 53.6 % (new generation, a K3 change); a Defer on `REQ-G60-US-PR-03` through the form returned "Decision recorded: deferred.", the log showed 1 decided of 20 with the event on top, and both exports carried the decision |
| Live mode, API stopped | Every page answered from the stored data in about 0.07 s with "The live service did not answer ..."; the builder said the engine did not answer; the export fell back to the stored file |
| Committed content | Taken from the API before the test decision; equal to the committed data of `main` in every requirement, estimate, package, event and evidence row (only run ids, event ids and times differ, from the fresh database), plus the G70 EU verbatims, the external evidence, the briefs and the exports |

## 7. How to run it

```
# backend (PostgreSQL 16 running, database built as in start.sh)
cd backend && uv run uvicorn tracepoint.api.app:app --port 8000

# frontend: refresh content from the API, build, run
cd frontend && pnpm snapshot && pnpm build
pnpm start                       # the stored data
TRACEPOINT_LIVE=1 pnpm start     # live: decisions, the package builder, live briefs and exports
```

## 8. Open points

1. **Status of a removed stage.** Next.js 16.4 serves the app shell of an unlisted param before the
   page decides, so a removed stage answers with status 200 and the not-found page (it was the same
   for unknown markets before). The stage bar never links there.
2. **Test decision in the integration database.** The live check left one Defer on
   `REQ-G60-US-PR-03` in the local database `tracepoint_int` (built for this step; the earlier
   database `tracepoint` still holds the step 17 test decision). The decisions file the backend
   appended was deleted and nothing of it is committed; a `pnpm snapshot` against either database
   would carry the decision, so rebuild first (`start.sh` steps 5 and 6).
3. **Analyses are only as fresh as the files.** The four briefs are the committed runs of the team
   (prompts v6, v7 and series v1; the code is at v8). A new run with the model key writes
   `data/analyses/`, which the API serves before the committed file, and the live mode shows it
   without a new snapshot.
4. **Requirement sets exist for three scopes.** The other four show the situation analysis, the
   market evidence and, where one exists, the analyst's brief; their requirement sets are the
   requirement agent's next step (plan 08, section 7).
5. **Agent text and the forbidden list.** The marketing-filler list of `text.py` covers the words
   the page audit checks; a model can still write a word the list does not know. The audit would
   flag it on the next run of `pnpm audit:pages`.
