# Frontend plan v3 – from the situation analysis into the requirement workbench

| Field | Value |
|---|---|
| Version | 0.6 (2026-10-11): accepted by the team ("proceed with the proposals"); decisions D-078 to D-080, D-083, D-084 and D-099 (D-081 and D-082 are the backend's); UI steps 14 (data layer, stage bar, stage 2), 15 (stage 3, the bridges), 16 (stage 4, the package builder, the method sheet) and 17 (the live mode, gate G2, stage 5) built; the backend's step 16 delivered the CPM endpoints of section 7. Step 19 integrated the two halves (D-100 to D-104, `reports/step-19-backend-frontend-integration.md`): the analyses endpoints of section 7 and the analyst's brief of step 18, the series and market evidence pages, one data feed for every screen, the stages that exist per scope, the copy in the product manager's words. Step 20 (D-105 to D-108, `reports/step-20-motion-between-screens.md`) made the moves between the screens continuous: the header stays in a scope layout, every link has an instant frame, a screen's content arrives with a staggered rise, the car docks in the header's corner |
| Track | Frontend. Section 7 lists what the frontend needs from the backend team |
| Builds on | `07-frontend-plan.md` (screens 0 to 2 and the subsystem dialog, built), `05-effort-market-layer-and-domain-panel.md` (bridge plan), `06-pm-workspace-ux-spec.md` (screens 3 to 6 as an outline), backend steps 11, 12, 14 and 15 |
| Replaces | Section 8 of `07-frontend-plan.md` (next screens) once the team accepts it |
| Question answered | The frontend covers the first stage of the BMW process slide. How does the PM get from there into an engineering tool for the other four stages, what is missing, and in what order is it built |

---

## 0. The answer in one paragraph

The vehicle screen stays the entry and becomes the first of five stages of one **scope workspace**
(vehicle × market), named exactly as on the BMW process slide: Situation analysis, Structure &
context, Requirements definition, Prioritization, Documentation. The PM crosses from the first
stage into the tool through the **CPM subsystems**, which are already on screen: every subsystem
row and every subsystem dialog gains the requirements whose change profile touches that
subsystem, with their effort. Inside the tool the same twelve-row list returns as the **effort
footprint** of a requirement or a package, so the engineering lens the PM met on the vehicle
screen is the one that sizes the decision. The backend already serves almost everything the four
new stages need (57 requirements with 0/1, criteria and horizon; CPM effort per requirement and
per package; gate G2 decisions; the audit log; the analyst's output); two endpoints are missing
for the live parts (section 7).

---

## 1. Where we stand, stage by stage

| Slide stage | Backend today | Frontend today |
|---|---|---|
| Situation analysis | Verbatims, studies, sales, option lists, group report; findings (A/B/C); 4 market rows in `config/cpm/market_context.yaml` | Map, market panel, vehicle screen with the twelve CPM subsystems, subsystem dialog (liked, disliked, market). Not shown: the portfolio and option-list baseline, the previous model, competitors (no data yet) |
| Structure & context (0/1) | 57 requirements (G60 US 20, G70 US 19, F70 EU 18) with `recommend` and rationale; excluded candidates with a reason; the analyst agent (`POST /agent/analyze`, insights and proposals, samples in `reports/analysis/`) | Nothing |
| Requirements definition | Criteria per market (metric, target, method, `basis` evidence or assumption), assumptions, uncertainties, horizon H1 / H2 with rationale, linked findings, evidence level, version | Nothing |
| Prioritization (customer, business) | CPM effort per requirement (`GET /effort/requirements`) and per package (`GET /effort/scenarios`); `priority_score` is empty (Phase 5 not built) | Nothing |
| Documentation | Audit events (`GET /events`), gate G2 (`POST /requirements/{id}/decision`), D2 export as CLI only | Nothing |

Scopes with a requirement set: G60 US, G70 US, F70 EU. The other four scopes on the map (G60 EU,
G70 EU, G68 CN, G70 CN) have none; the new stages say so plainly there (principle 8 of plan v2).

---

## 2. What the backend added that the frontend does not use yet

| Data | Where | What it gives the tool |
|---|---|---|
| Requirement list | `GET /requirements?vehicle=&market=` | ID, domain, title, statement, recommend + rationale, horizon + rationale, criteria, assumptions, uncertainties, evidence level, status, version, linked findings |
| Requirement detail | `GET /requirements/{id}` | The above plus every linked finding with its evidence, the effort estimate and the event history |
| Effort per requirement | `GET /effort/requirements?vehicle=&market=` | `effort_pct`, `p5`, `p95`, `decision` (adapt, major revision, new generation), `decision_stable_pct`, `layer` K0 to K3, `size`, `certification`, `changes` (subsystem, own impact, layer, carryover, why), `subsystems` (risk and strongest path per touched subsystem, rule 52), `portfolio` (catalogue scan, rule 43), `flags` (rule and text), `stale` |
| Packages | `GET /effort/scenarios?vehicle=&market=` | H1 package, H2 package, everything on the current model; combined per subsystem (rule 45) beside the plain sum |
| Back-test | `GET /effort/backtest` | 8 of 8 documented BMW decisions reproduced; the credibility of the model in one table |
| Gate G2 | `POST /requirements/{id}/decision` | approve, reject, defer with a mandatory note; logged, replayed after import, valid for one version only (D-061) |
| Audit log | `GET /events?entity_type=&entity_id=` | Actor, action, before / after, run |
| Analyst | `POST /agent/analyze`; files under `data/analyses/`, samples `reports/analysis/G60_US.json`, `F70_GB.json` | Headline, summary, insights with references, proposals with H1 / H2 and engine-computed effort per proposal and package |

The figure the tool exists to show (`reports/effort/effort_G60_US.md`): every one of the 17 H1
requirements of G60 US is an adaptation on its own (0.2 to 4.6 %), but together they are **18.4 %
of a new vehicle (P5 to P95 10.4 to 26.8), a major revision, stable in 73 % of the sensitivity
runs**, against a plain sum of 23.9 %. The H2 package is the new battery generation at 49.0 %, a
new generation by the K3 rule. A per-requirement list cannot show this; the CPM package view can,
and the PM then decides how to split the H1 set over the life-cycle impulse and the model years.

**Correction to plan v2.** Section 7 of `07-frontend-plan.md` lists `GET /effort/model` and
`POST /effort/estimate` as existing. They are not on the API (`backend/tracepoint/api/app.py`
serves `/effort/backtest`, `/effort/requirements`, `/effort/scenarios`). Both are requested in
section 7 below; plan v2 is corrected in the same change.

---

## 3. The transition from the situation analysis into the tool

### 3.1 Recommendation: one workspace, five stages, entered through the subsystems

**Stage bar.** The vehicle screen's header gains one row of five links, the slide's stage names,
each with the count it holds (G60 US today: 20 candidates, 18 H1 and 2 H2, 0 of 20 decided). The current
screen is stage 1. Each stage is its own route under the scope, so a stage can be linked, reloaded
and audited:

| Stage | Route |
|---|---|
| 1 Situation analysis | `/markets/[market]/[vehicle]` (built) |
| 2 Structure & context | `/markets/[market]/[vehicle]/structure` |
| 3 Requirements definition | `/markets/[market]/[vehicle]/requirements` and `/requirements/[id]` |
| 4 Prioritization | `/markets/[market]/[vehicle]/priorities` |
| 5 Documentation | `/markets/[market]/[vehicle]/log` |

The order is the slide's, but nothing is locked: the PM may open any stage at any time. Gates are
shown where they apply (G2 on each requirement), not as a wizard.

**Three bridges from what is built**, so the step into the tool is a continuation, not a jump:

1. **The CPM list rows** gain a third line: the requirements whose change starts in the
   subsystem, those whose change propagates into it, and the largest single effort among them
   (Seats on G60 US: two start there, `REQ-G60-US-IC-01` at 4.6 % and `IC-03` at 3.5 %).
   Source: `changes[].subsystem` and `subsystems` of `GET /effort/requirements`.
2. **The subsystem dialog** gains a fourth band below Market analysis, "Requirements that change
   {subsystem}": one line per requirement with ID, title, horizon, effort with its class, and
   whether the subsystem is where the change starts or where it propagates to. A line opens the
   requirement in stage 3; a link opens stage 2 filtered by the subsystem. This is the moment
   the PM moves from what customers say to what would change and what it costs.
3. **The disliked band's suggestion** ("Address Drivetrain first") links to the requirements that
   cite that theme's finding, where one exists.

**Continuity of the picture.** The twelve-row CPM list is reused in the tool as a footprint: the
bar of each subsystem shows its weight W as the track and the work the selected requirement or
package puts on it as the fill, with the value as text. The PM reads the same list in both
worlds: on stage 1 it carries customer rows, on stages 3 and 4 it carries effort.

**Density changes, the language does not.** Stages 2 to 5 are working screens: hairline tables,
a detail panel, keyboard navigation (`J` / `K`, `Enter`). Same tokens (white page, ink, the one
blue), same header, same forbidden list. The landing's marketing restraint (one object, no copy)
does not apply to the workspace; the honesty rules apply in full.

### 3.2 Alternatives considered

| Option | Why not the first choice |
|---|---|
| A separate tool app (`/workspace/...`) with its own left rail, as in `06-pm-workspace-ux-spec.md` | Two visual worlds; the map story ends and a different product starts. The scope would have to be chosen twice |
| Only the bridges (a fourth dialog band and a link), no stages | Prioritization and Documentation have no home, and requirements touching several subsystems appear in several dialogs without one place to decide them |
| Putting everything into the subsystem dialog | The dialog is already full at 1440 × 900 (D-076); a tool inside a modal loses links, history and the back button |

### 3.3 Domains or subsystems (the open conflict of plans 05 and 07)

The workspace settles it without discarding either plan: **stage 1 keeps the twelve subsystems**
(built, D-073); **stages 2 and 3 group requirements by the nine customer domains** (requirements,
findings and gate decisions all carry a domain, D-012, D-022; the slide groups requirements as
Exterior, Interior, Powertrain, Driver assistance); **the subsystems return as the effort lens**
(footprint, packages, the bridges). Customers speak in domains, effort propagates in subsystems,
and each appears where it carries information.

---

## 4. The four new stages

### 4.1 Stage 2 – Structure & context ("all potential requirements, 0/1")

* **Analyst brief** at the top when an analysis is stored for the scope: headline, summary, the
  insights with their kind, domain, confidence and evidence references; the run, model, prompt
  version and date beside it; "proposals for the product manager, not decisions" as the analyst
  itself says. Without a stored analysis: "No analysis is stored for this scope." A run button
  only in live mode, with the facts that it takes one to two minutes, spends model credit and
  runs one at a time (D-070).
* **Candidate table**, grouped by domain: ID, title, recommend 1 or 0 (as text), horizon,
  evidence level, effort with its class, status. A row expands to the recommend rationale.
* **Three views of the same table**: Needs a decision (default), All, Left out. "Left out" lists
  the excluded candidates with the agent's reason (pricing, residual value, below threshold),
  which shows that the filter is visible and reversible.
* **Needs a decision** is the Decision Inbox of the strategy note, derived from fields the
  backend already serves, with the rule printed beside each entry: not recommended; evidence
  level C; every criterion an assumption; an effort flag (class beyond the horizon, rule 47;
  borderline stability under 90 %, rule 51; a stale profile); a contradiction in the market rows
  of a touched subsystem; status proposed. Nothing is scored in the browser; the inbox only
  selects.
* Filters: domain, subsystem (arriving from bridge 2), horizon, status.

### 4.2 Stage 3 – Requirements definition (the requirement page)

One page per requirement, the D2 record on screen:

| Block | Content | Source |
|---|---|---|
| Header | ID, title, domain, horizon with rationale, evidence level, status, version | requirement |
| Statement | The customer-facing statement | requirement |
| Acceptance criteria | Table: market, metric, target, method, basis (evidence or assumption, as text) | `criteria` |
| Evidence | Linked findings by role (primary, supporting, context), each opening an evidence panel with the verbatims (as written, E5), study metric or catalogue item | `findings` of the detail endpoint, `GET /verbatims/{id}` |
| Assumptions and uncertainties | Two lists | requirement |
| Effort (CPM) | Effort in % of a new vehicle, P5 to P95, class, stability, layer, size, certification add-on; the changes with own impact and why; the footprint over the twelve subsystems with the strongest path per subsystem ("Seats → E/E architecture → Software/HMI"); the catalogue scan (carryover, e.g. comfort access on the G70); the flags with their rule numbers | `effort` of the detail endpoint |
| Decision | Approve, reject, defer with a mandatory note (gate G2), live mode only | `POST /requirements/{id}/decision` |
| History | The requirement's events: import, version changes, effort estimates, decisions | `events` |

The slide's "range: 600 or 700 mi?" is a criterion whose target the PM chooses. Criteria are
read-only until the backend offers a versioned edit (section 7, P2); the decision note carries
the PM's choice until then.

The requirements index (`/requirements`) is the specification view of the stage-2 table:
grouped by domain, with the criteria count and how many of them rest on evidence.

### 4.3 Stage 4 – Prioritization (customer and business)

* **Matrix**: one point per requirement. Horizontal: effort in % (CPM), with the P5 to P95 range
  as a line. Vertical: customer evidence, the complaint rows of the requirement's primary finding,
  with the evidence level as the label. H1 and H2 told apart by label and marker shape, not by
  colour alone. The axes are the two raw figures; there is **no composite score** on screen until
  the backend's Phase 5 score exists, and the screen says so.
* **Packages**: the three variations of `GET /effort/scenarios`, each with the combined effort,
  range, class, stability, the plain sum beside it, and the footprint list. When the H1 package
  leaves the adapt class (G60 US, F70 EU), the screen states it and names the requirements that
  carry most of it.
* **Package builder** (live mode, after `POST /effort/estimate` exists): move requirements
  between H1, H2 and out; the combined figure is recomputed by the engine. The browser never
  adds effort figures: the combination per subsystem (rule 45) is not a sum.
* **Market lens**: the market's 2025 and 2030 units and its powertrain context rows beside the
  matrix; the regional customer profile (for example large sedans in the US, compact in the EU)
  enters with the Phase 5 market weight.

### 4.4 Stage 5 – Documentation

* **Decision record**: every requirement of the scope with its current status, the decision, the
  note, the actor and the version it was made on.
* **Timeline**: the scope's audit events newest first (import, effort estimates, analyses,
  decisions), each with actor (`human:pm`, `agent:analyst`, `system`), before and after.
* **Export**: the D2 list as CSV and Markdown (the exporter exists as a CLI; section 7, P1).

### 4.5 The CPM method sheet (reachable from every effort figure)

A side sheet with the model in full: the twelve weights with their basis, the 28 links as a 12 ×
12 design structure matrix (likelihood and impact as numbers in the cells, the path of the
selected change outlined), certification add-on, carryover factor, thresholds 15 and 50, and the
back-test table (8 of 8). "Assumption, not calibrated" in the sheet's first line (rule 50). This
is the engineering view of the method and the answer to the jury's first question about it.

---

## 5. CPM honesty rules on every screen

* Effort is a share of a new vehicle generation; no currency anywhere (rule 49).
* A range beside every figure; "borderline, the PM decides" when the class is stable in under
  90 % of the runs (rule 51).
* The model hash and "assumption, not calibrated" travel with every figure.
* An analyst's change profile is labelled as the analyst's; claimed carryover is shown as a claim
  and not applied (D-072).
* The browser never computes an effort figure; it reads the engine's.

---

## 6. Data layer: snapshot and live

Today every figure on screen comes from committed content (`content/*.json`) generated by our
Python scripts; nothing is fetched at runtime. The workbench needs reads that change (decisions)
and writes. Proposal:

1. **One adapter module** `lib/data/workspace.ts` with the reads the stages need
   (`requirements`, `requirement`, `efforts`, `scenarios`, `events`, `analysis`, `backtest`), and
   **two implementations**:
   * **snapshot**: reads `content/workspace/<VEHICLE>_<MARKET>.json`, written by a frontend
     script `scripts/snapshot-api.mjs` that calls the running API once and saves the responses
     unchanged, with the API version, the effort model hash and the time of the snapshot. The
     demo runs without the database; the content is the API's own output, not a copy of the
     logic.
   * **live**: server components call the API at `TRACEPOINT_API_URL` (default
     `http://127.0.0.1:8000`).
2. **The browser never talks to the API.** Reads happen in server components, writes in server
   actions that forward to the API. The API has no authentication and must stay bound to
   localhost (D-069), and it sends no CORS headers; the Next.js server is the only client.
3. **Writes only in live mode.** In snapshot mode the decision controls are present but disabled,
   with one sentence that decisions need the running backend. Nothing is queued in the browser,
   so the audit log stays the single record (D-061).
4. **Types** in `lib/content/workspace-types.ts` mirror the API responses field by field; a test
   checks every snapshot file against them, as `cpm.test.ts` does for the CPM content.
5. The vehicle pages are statically generated today; the stage pages are dynamic in live mode and
   static in snapshot mode. Next.js 16 changed caching and server actions; read
   `node_modules/next/dist/docs/` before writing them (`frontend/AGENTS.md`).

Built in steps 14 to 17 (D-079, D-085): items 1 to 4 as written, with one read
(`readWorkspace`) that merges the API's current answers into the snapshot instead of two
implementations. Item 5 changed: every stage page, the vehicle screen included, is a partial
prerender that reads at request time in both modes, because the live mode is a start-time setting
(`TRACEPOINT_LIVE=1` on `pnpm start`) and a build must not bake the mode in; the cost in the
snapshot mode is one read of the in-memory snapshot per request.

---

## 7. Requests to the backend team

| Priority | Request | Why the frontend needs it |
|---|---|---|
| P0 | `POST /effort/estimate` with `{vehicle, market, requirement_ids?, changes?}`, returning each item and the combination (rule 45) with range, class, stability and footprint | Package builder; combined effort is not a sum and must not be computed in the browser. **Delivered** (backend step 16, D-081): `items[]`, `sum_of_single_pct`, `combined`, `model_hash`, `basis` |
| P0 | `GET /analyses?vehicle=&market=` and `GET /analyses/{run_id}` reading `data/analyses/` | The analyst brief without spending a run on every page view. **Delivered** in step 19 (D-100): `GET /analyses`, `GET /analyses/{key}` and `GET /analyses/{key}/brief` (the brief as the PM reads it), reading `data/analyses/` and the committed `reports/analysis/` |
| P0 | Scope filter on `GET /events` (`vehicle`, `market`, or an entity id prefix such as `REQ-G60-US-`) | Stage 5 timeline in one call instead of one per requirement. **Delivered** in step 19: `GET /events?entity_prefix=REQ-G60-US-`, used by the snapshot and the live read |
| P1 | `GET /effort/model` (W, L, I, thresholds, notes, model hash) | Method sheet from the API instead of the YAML file; plan v2 listed it as existing. **Delivered** (backend step 16), together with `GET /cpm/{vehicle}?market=&country=&labels=` (the `CpmView` the frontend builds into `content/cpm.json`) and `GET /requirements/{id}/effort` |
| P1 | `GET /requirements/export?vehicle=&market=&format=csv\|md` | Export button in stage 5 (the CLI exporter exists). **Delivered** in step 19 (D-104): `GET /requirements/export?format=csv|md`, with each requirement's effort and latest decision; stage 5 serves the backend's files |
| P1 | Phase 5 customer-side components (reach, severity, 2030 market weight, evidence confidence) and `priority_score` with its components | The vertical axis and a ranked list with a visible formula |
| P1 | Requirement sets for G60 EU and G68 CN (the requirement agent named as the next step in step 15) | Stages 2 to 5 are empty outside the three scopes |
| P2 | `PATCH /requirements/{id}` (versioned edit of criteria, horizon, assumptions) | Choosing a criterion level ("600 or 700 mi") as a logged change |
| P2 | Challenge (`POST /requirements/{id}/challenge`), PM constraints (rules 26 to 30), release (gate G4) | Challenge mode, comment to constraint, publishing a version |
| P2 | Market and competitor rows (Phase 2) appended to `config/cpm/market_context.yaml` | The market band and the contradiction cases |

Everything in P0 and P1 reads data the backend already holds; none needs a model call.

---

## 8. Order of work (UI steps)

| Step | Delivers | Needs from the backend | Can start |
|---|---|---|---|
| 14 | Data layer (adapter, types, snapshot script, snapshots for the three scopes), the stage bar, stage 2 read-only (candidate table, three views, left out, inbox rules) | Nothing new | **Built** (`reports/step-14-ui-workspace-stages-and-structure.md`) |
| 15 | Stage 3: requirement page with criteria, evidence panel, CPM effort block and footprint; bridges 1 to 3 on the vehicle screen and in the dialog | Nothing new | **Built** (`reports/step-15-ui-requirement-page-and-bridges.md`) |
| 16 | Stage 4: matrix and packages; the CPM method sheet with the matrix of links and the back-test; the package builder (moved forward from step 18, since `POST /effort/estimate` exists) | `GET /effort/model`, `GET /effort/backtest`, `POST /effort/estimate` (all delivered) | **Built** (`reports/step-16-ui-prioritization-and-method-sheet.md`) |
| 17 | Live mode: gate G2 decisions through server actions; stage 5 record and timeline; export | Nothing new in the end: the events are one filtered call, the CSV a route handler of the frontend | **Built** (`reports/step-17-ui-live-mode-decisions-and-documentation.md`) |
| 18 | Analyst brief and run (the package builder is built in step 16) | Analyses endpoints | **Built** in step 19 with the integration: the brief on stage 2, the series page, the market evidence. The run button is left out: a run needs the model provider's key and one to two minutes, and the CLI writes the files the API serves |
| 20 | Motion between the screens: the header in a scope layout that stays, instant frames for every link, the arrival of a screen's content, the car in the header's corner, the hand-over that starts with the click | Nothing new | **Built** (`reports/step-20-motion-between-screens.md`, D-105 to D-108) |

Each step follows the verification of plan v2 section 9: `pnpm check`, `pnpm audit:pages`
(with the new stage pages added to the list), `pnpm shots`, the forbidden-list checklist and a
step report.

---

## 9. Demo path (G60 US, about four minutes)

| Time | Stage | Action | What the jury sees |
|---|---|---|---|
| 0:00 | Map, market | US, the 5 Series | Scope by market and vehicle (built) |
| 0:20 | 1 | Software/HMI: liked and disliked, then the new band: the requirements that change Software/HMI | Customer evidence turning into candidate changes with their effort |
| 1:00 | 3 | `REQ-G60-US-ID-01`: criteria (evidence or assumption), a verbatim, effort 3.0 %, adapt, footprint | A measurable, traced requirement sized by CPM |
| 1:50 | 2 | The analyst's headline; 20 candidates, 1 not recommended, 6 left out with reasons; the inbox | AI structures, the PM decides on a short list |
| 2:40 | 4 | The H1 package: each item adapt, together 18.4 %, a major revision; H2 is the battery at 49 % | What only the CPM view shows; the PM splits the package |
| 3:20 | 3, 5 | Approve one requirement with a note, defer another; the timeline shows both with actor and version | Human decision, audit trail |

---

## 10. Open decisions for the team (1 to 4 taken on 2026-10-11, D-078 to D-080; 5 read as the PM's workbench until the team says otherwise)

1. **Stage bar in the vehicle workspace** (3.1) or a separate tool app (3.2).
2. **Snapshot plus live** (section 6) or live only. Live only is simpler to build but the demo
   then depends on PostgreSQL and the API on the presenting machine.
3. **Domains in the tool, subsystems in the situation analysis** (3.3) as the resolution of the
   plan 05 and plan 07 conflict.
4. **Demo scope G60 US** (the strategy note's choice), with the China switch at the end showing
   the empty stages and the lower evidence.
5. **"Engineering tool" read as the PM's requirement workbench** with the CPM as its engineering
   lens. If the team means a tool for BMW engineers to calibrate the CPM model (edit W, L, I and
   re-run the back-test), that is a different screen built on the method sheet of 4.5 and needs
   a model override on `POST /effort/estimate`.

---

## 11. Risks

* The backend P0 endpoints decide whether steps 17 and 18 are live in the demo; steps 14 to 16
  do not depend on them.
* The snapshots go stale when requirements or profiles change; the snapshot carries the model
  hash and the time, and the stage bar shows it.
* Three of seven scopes have requirements; the rest show empty stages. Honest, but a jury
  switching markets will see it.
* The matrix's vertical axis (complaint rows of the primary finding) is a proxy until Phase 5;
  labelled as such.
* Requirements and their profiles are the assistant's first draft (D-060, D-063); the tool makes
  them reviewable, it does not make them right.
