# PM workspace – UX specification for screens 1 to 6

| Field | Value |
|---|---|
| Version | 1.0 (2026-10-10) |
| Audience | Frontend team (building the UI), backend (API contract), presenters (demo script) |
| Scope | Everything after the scope-selection screen (map + 3D car, built by the team). Screens 1–6, the application shell, shared components, the API contract per screen, design references and the demo script |
| Principle | Every number on screen is clickable down to its evidence; every PM action is a logged event; the four mandatory gates (G1–G4) are visible at all times |

---

## 0. The journey in one line

Scope (map + car) → **1 Situation brief** → run analysis → **2 Findings** (gate G1) → **3 Requirements** (gate G2) → **4 Priorities** (gate G3) → **5 Decision board** (gate G4) → **6 Report & audit trail**.

The jury scores the path from evidence to a human decision. The screens follow that path literally, one step per screen, with a persistent stepper that shows where the PM is and which gates are still open.

---

## 1. Application shell (all screens)

| Zone | Content | Behaviour |
|---|---|---|
| Left rail (stepper) | Steps 0–6 with icons; gate badges on 2, 3, 4, 5 (`open` / `approved` with timestamp); counters (211 findings, 48 requirements, …) | Click to navigate; steps after an open gate are reachable but marked "preview"; keyboard `1`–`6` |
| Top bar | Workspace chip `G60 · 5 Series Sedan · US`, run status pill (idle / running with stage text / done), agent activity button, global search (`⌘K`: findings, requirements, verbatim IDs, themes), PM identity | Workspace chip opens the scope selector (back to Screen 0 without losing state) |
| Evidence drawer (right, universal) | Opens for any `evidence_ref`: verbatim (text, classifications, source, country, powertrain, Excel locator), metric (score, distribution bar, peers), equipment (name DE/EN, SA code, price, availability per variant), finding (mini card), web source (snapshot excerpt, URL, fetch time; Phase 2) | Stacked navigation (drawer keeps a back stack); copy reference; "open in context" |
| Agent activity feed (slide-over) | Live list of run events: stage, counts, model, tokens; in demo mode replays cached events with realistic timing | Fed by server-sent events from `/runs/{id}/events` |
| Keyboard | `J`/`K` next/previous item, `Enter` open, `A` approve, `R` reject, `E` edit, `C` challenge, `D` defer, `Esc` close, `?` cheat sheet | Never steal keys from text inputs |

Visual language: dark theme consistent with the map screen; one accent colour for actions; semantic scales that are never colour-only: severity (text + bar), evidence level (badge letter A–D + colour), status (icon + label). Density: tables and cards share one 8-px grid; numbers right-aligned, monospace for identifiers.

---

## 2. Screen 1 – Situation brief ("what do we know today")

Purpose: the first page after choosing the scope; no decisions yet, only the state of the evidence. Source today: `GET /reports/baseline/{vehicle}?market=US`.

Layout (12-column grid):

1. **KPI row** (6 tiles): verbatims (with source split on hover), classification coverage (% rows classified, unclassified count), study attributes, sales 2025 and 2030 with the market's share of the vehicle, equipment items parsed, external sources (0 until Phase 2). Each tile links to the filtered evidence list.
2. **Domain heat bars** (left, 4 cols): the nine vehicle domains as horizontal bars: complaint share (length) and complaint count (label), likes shown as a thin second bar. Click → Screen 2 filtered by domain.
3. **Mix panel** (centre, 4 cols): powertrain mix and source mix as stacked bars; feedback-type split (Likes / Difficult to use / Defect / Wants).
4. **Study panel** (right, 4 cols): weakest 5 and strongest 5 attributes with a dumbbell per row (this vehicle vs peer mean vs same vehicle in other markets); scale shown in the header; `context_only` attributes (pricing) greyed with a tooltip.
5. **Strengths to keep** strip: top liked themes as chips.
6. **Data-quality and assumptions** footer: unclassified rows, inherited catalogue rows, missing powertrain split, Germany-only catalogue note.
7. **Primary action** (top right): `Run analysis`. Opens the agent activity feed; stages: segment Source B → classify gaps → fetch external sources (Phase 2) → extract findings → link → done, each with counts. On completion the stepper badge of Screen 2 shows the finding count and the button becomes `Open findings`.

States: empty (no ingestion yet → shows the start command), running (tiles stay, feed open), stale (data older than the last run → banner "re-run analysis").

Demo moment: 30 seconds. The PM reads the brief and presses `Run analysis`; the feed scrolls through stages in 3 seconds from the cache.

---

## 3. Screen 2 – Findings (gate G1: approve the finding set)

Purpose: the PM sees what the evidence says, per vehicle domain, and approves the set that may become requirements. Source today: `GET /findings?vehicle=G60&market=US`, `GET /findings/{id}`.

Layout: three panes.

**Left pane – vehicle view (reuse the 3D car from Screen 0).** The nine domains map to mesh groups (exterior body, interior cabin, dashboard = infotainment, sensor positions = driver assistance, front / underbody = powertrain and charging, wheels and suspension = driving dynamics, boot and cabin volume = space, body panels = quality / NVH, badge = offering). Each group is coloured by its complaint severity (sequential scale) and shows a count label on hover. Clicking a group filters the list; a second click clears. A `2D` toggle shows the same data as domain bars (accessibility and projector fallback). Implementation: react-three-fiber pointer events per mesh group and per-group material colour; no new model needed.

**Centre pane – finding list.** Table with columns: severity (bar + number), title, kind icon (recurring complaint / unmet need / strength / metric gap / equipment gap / competitor advantage / trend), layer chip, evidence level badge, source types count, links count, status (proposed / accepted / excluded / needs evidence). Filters: layer, kind, domain, powertrain, evidence level, status, text. Sort by severity default. `J`/`K` moves, `Enter` opens the detail, `A` accepts, `X` excludes (reason required). Bulk actions on a selection.

**Right pane – finding detail** (or full-width slide-over on small screens):

* Statement (template text today; LLM narration later) and the quantification as chips: complaints, defects / difficult to use / wants as a stacked bar, share of market complaints, weighted severity; breakdown mini-bars by powertrain, source and country.
* **Evidence quotes**: up to eight classification rows with source, country, powertrain; click → evidence drawer with the full verbatim and the Excel locator. A `Show all N` link opens the verbatim list filtered by theme and market.
* **Linked findings**: `supports` (weak study attribute), `contradicts` (strong attribute), `explains` (catalogue status), each with the rationale sentence; click navigates.
* For equipment gaps: availability matrix (variants × standard / optional / not available) with prices as rough cost proxy.
* Taxonomy proposals tray (badge in the pane header): new theme names proposed by the classifier with closest existing theme and reason; `Accept` (becomes canonical, logged) / `Reject`.
* Actions: `Accept into set`, `Exclude` (reason), `Merge into…` (pick another finding), `Needs more evidence` (sends a research task; Phase 2), `Comment`.

**Gate G1 bar** (bottom): accepted / excluded / pending counts, `Approve finding set` enabled when pending = 0 (or `Approve with N pending` with a confirmation). Writes `gate.G1.approved` with the set snapshot; unlocks Screen 3 derivation (`Derive requirements` runs the requirement agent on the accepted set).

Demo moment: 60 seconds. Click the dashboard on the car → infotainment findings; open "Voice control" → quotes, the weak voice-recognition study attribute (link), accept; approve the set.

---

## 4. Screen 3 – Requirements (gate G2: approve each requirement)

Purpose: review the customer-facing requirements derived from the accepted findings. Two modes: **queue** (one card at a time, like a pull-request review) and **table**.

**Requirement card anatomy**

| Block | Content |
|---|---|
| Header | `REQ-G60-US-0012`, title in customer language, domain chip, horizon chip (H1 near-term / H2 long-term) with the AI reason on hover, region tags, status, version |
| Description | 2–4 sentences, customer-facing, no engineering wording |
| Acceptance criteria | Table: region · metric · target · how measured (e.g. US · electric range displayed vs achieved deviation · ≤ 10 % at 20 °C · fleet telemetry); every criterion measurable; region-specific rows allowed |
| Rationale and evidence | Linked findings as chips (click → finding detail or drawer), evidence level badge, counts (n verbatims, n metrics, n catalogue items, n external sources) |
| Assumptions and uncertainties | Bullet list with a confidence tag each (e.g. "powertrain mix 2030 taken from feedback mix – assumption") |
| Score preview | Current total and the stacked component bar (read-only here; tuned on Screen 4) |
| Thread | Edits (old → new diff), challenges with the agent's answers, comments; all with actor and time |

**Actions**: `Approve` (A), `Reject` (R, reason required), `Edit` (E: structured editor for title, description, criteria, horizon, assumptions; saving stores a diff and a new version), `Challenge` (C: question box with suggested prompts – "Is this still valid for BEV only?", "Re-derive without Source B", "What does the catalogue say?"; the agent answers in the thread with evidence chips and may propose an edited version the PM can accept), `Defer` (D: change horizon with reason), `Split` / `Merge`.

Gate G2 is per requirement: a requirement enters the prioritised backlog only when approved. The gate bar shows approved / rejected / pending and `Continue to priorities` (enabled when pending = 0, or with explicit confirmation).

Demo moment: 60 seconds. Open the range requirement, challenge it ("PHEV too?"), the agent answers with counts per powertrain and proposes narrowing the criterion; accept the edit; approve.

---

## 5. Screen 4 – Priorities (gate G3: approve the weights and the ranking)

Purpose: explainable, adjustable prioritisation; re-runs are deterministic and compared with the previous ranking.

**Left – ranked list**: rank, Δ versus the previous profile (▲3 / ▼2 with tooltip "metric gap weight lowered"), title, horizon, stacked score bar coloured by factor (customer impact, metric gap, regional fit, competitive pressure, portfolio fit, trend alignment, evidence strength, effort as a negative segment), dampening badge when portfolio or scope rules reduced the score ("−40 % portfolio tier: luxury feature in the entry series") with the full reason on hover, evidence level.

**Right – weight panel**: one slider per factor (0–100, sum shown), the AI-proposed profile with its rationale paragraph ("US BEV share and the weak charging attributes justify a higher weight on …"), `Reset to AI proposal`, `Save as profile` (name, note), profile selector (AI proposal v1, PM profile v2, …). Moving a slider re-scores immediately (server call `POST /priorities/score` with the profile; deterministic) and switches the list into **diff mode** (what moved up / down and why, per-component deltas). Region profile toggle (climate / usage modifiers, e.g. Nordic heating) shown as read-only chips with values.

**Variations tab**: scenario cards – Evolve the current model (H1 only), New generation (H2 only), Split by domain (AI proposal) – each with requirement counts per domain, rough effort / cost sum (T-shirt sizes aggregated), expected customer impact (sum of severity covered), pros / cons / suggestions from the estimation agent. Selecting a scenario pre-fills the decision board.

**Gate G3 bar**: `Approve weights and ranking` → stores a report version (profile id, ranking snapshot, diff to previous), event `gate.G3.approved`.

Demo moment: 45 seconds. Lower "metric gap", raise "regional fit"; list re-ranks, the diff explains; approve.

---

## 6. Screen 5 – Decision board (gate G4: release the list)

Purpose: decide per vehicle domain and horizon, exactly the "colour now, engine next model" flexibility.

**Matrix**: rows = nine vehicle domains, columns = H1 near-term and H2 long-term. Cells contain requirement chips (colour by status, number = rank). Drag a chip between columns = defer or pull forward (reason prompt). Per-domain row actions: `Approve all now`, `Defer domain to H2`, `Reject domain` (reason). Chip hover shows title, score, evidence level; click opens the card in a side panel.

**Right summary**: counts per column, rough effort / cost totals per horizon, conflicts flagged by the agent (e.g. "two requirements need the same package change"), open challenges, requirements without acceptance criteria (blocked from release).

**Gate G4**: `Publish requirement list` → release dialog: version name, release note, checklist (all released requirements approved, criteria present, no open blocking challenge). Writes `gate.G4.released` and freezes a release snapshot; later changes create a new version.

Demo moment: 30 seconds. Drag the powertrain chips to H2 ("next model"), approve exterior colours now, publish v1.

---

## 7. Screen 6 – Report and audit trail

Purpose: deliverables D2 and D4 on screen; the traceability demo.

Tabs:

1. **Published list** (release selector): table with every mandatory field of D2 – ID, description, linked findings and sources, score, prioritisation rationale, evidence level, assumptions and uncertainties, decision status, horizon, region – with column chooser and export (XLSX, JSON, PDF). Source today: planned `GET /releases/{id}` and `/export`.
2. **Traceability**: pick a requirement → vertical chain: sources (files, pages / rows, web URLs) → evidence items (quotes, metrics, catalogue rows) → findings (with links) → requirement versions (diffs) → scores (per profile) → decisions (who, when, why). Every node opens the drawer. This is the 20-second jury moment: from a requirement to a single verbatim row in the Excel file.
3. **Audit log**: timeline with actor icon (human / agent / system), action, entity, before / after expander, rationale, run id, model and prompt version; filters by entity, actor, action, date; export JSON / CSV. Source today: `GET /events`.
4. **Runs**: agent runs with configuration snapshot, code version, model ids, tokens and cost. Source today: `GET /runs`.

---

## 8. Shared components (build once)

| Component | Used on | Notes |
|---|---|---|
| `EvidenceChip` | 2, 3, 4, 6 | `verbatim:G60-0123` → icon + short id, hover preview, click opens the drawer |
| `EvidenceDrawer` | all | resolves any evidence reference; back stack |
| `ScoreBar` | 3, 4, 5 | stacked components, legend, dampening badge |
| `GateBar` | 2–5 | counts, primary gate action, confirmation with pending items |
| `DecisionActions` | 2, 3, 5 | Approve / Reject / Edit / Challenge / Defer with reason dialogs and keyboard bindings |
| `Thread` | 3 | edits (diff), challenges (question → agent answer with chips), comments |
| `DiffView` | 3, 4, 6 | text diff for edits; ranking diff for profiles |
| `AgentActivityFeed` | 1, 2, 3 | SSE consumer; demo replay |
| `DomainHeat` | 1, 2 | bars (2D) and 3D car colouring share one data shape `{domain, severity, count}` |
| `KeyboardHints` | all | `?` overlay; inline hints on buttons |

---

## 9. API contract per screen

| Endpoint | Status | Screen |
|---|---|---|
| `GET /vehicles`, `GET /markets` | exists | 0 |
| `GET /reports/baseline/{vehicle}?market=` | exists | 1 |
| `GET /verbatims`, `GET /verbatims/{id}`, `GET /studies`, `GET /sales`, `GET /equipment`, `GET /specs` | exists | drawer, 1, 2 |
| `GET /findings`, `GET /findings/{id}` | exists | 2 |
| `GET /events`, `GET /runs` | exists | 6, feed |
| `POST /analysis/run` + `GET /runs/{id}/events` (SSE) | planned (step 06) | 1 |
| `POST /findings/{id}/decision` (accept / exclude / merge / needs_evidence, reason) | planned (step 06) | 2 |
| `GET /taxonomy/proposals`, `POST /taxonomy/proposals/{id}` (accept / reject) | planned (step 06) | 2 |
| `POST /gates/{G1..G4}` | planned (step 06) | 2–5 |
| `GET /requirements`, `GET /requirements/{id}`, `POST /requirements/derive` | planned (Phase 4) | 3 |
| `POST /requirements/{id}/decision`, `PATCH /requirements/{id}` (versioned), `POST /requirements/{id}/challenge`, `GET /requirements/{id}/thread` | planned (Phase 4 / 6) | 3 |
| `GET /priorities/profiles`, `POST /priorities/profiles`, `POST /priorities/score`, `GET /priorities/diff?from=&to=` | planned (Phase 5) | 4 |
| `GET /variations` | planned (Phase 5) | 4 |
| `GET /decisions`, `POST /decisions` (domain × horizon), `POST /releases`, `GET /releases/{id}` | planned (Phase 5 / 7) | 5, 6 |
| `GET /requirements/{id}/trace`, `GET /export?release=&format=` | planned (Phase 7) | 6 |
| `GET /workspaces` (vehicle × market summary for the map: volume, verbatims, weakest domain) | planned (step 06) | 0 |

Backend order of work that matches the frontend order: step 06 = decision endpoints for findings, gates, proposals, run events, workspaces; Phase 4 = requirements; Phase 5 = priorities, variations, decisions, releases; Phase 7 = trace and export.

---

## 10. Frontend stack suggestion

React + TypeScript (Vite), Tailwind CSS + shadcn/ui for the shell, tables and dialogs; Tremor or Recharts for the brief's bars and dumbbells; TanStack Table and Query; react-three-fiber + drei (`useGLTF`, pointer events, per-mesh material colour) for the car heat view; Framer Motion for the stepper and drawer; Zustand for workspace state; native `EventSource` for the run feed. Dark theme tokens shared with the map screen.

---

## 11. Design references (what to borrow from whom)

| Reference | Borrow for | Screen |
|---|---|---|
| Productboard – prioritise features (weighted scoring against strategic drivers, value-vs-effort matrix, insights traced back to feedback) | weight profile, score bar, insight → requirement trace | 3, 4 |
| Jira Product Discovery – formula fields (weighted score, custom formulas) and matrix view | score composition, scenario matrix | 4 |
| airfocus – Priority Ratings (strategic factors with weightings, per-criterion value types, priority score) | slider panel, factor definitions | 4 |
| Dovetail – insights with embedded evidence, reference picker, highlights | finding detail with quotes, evidence drawer | 2 |
| Enterpret, Unwrap – AI feedback taxonomies, trend alerts, dashboards | situation brief, theme landscape | 1, 2 |
| Elicit – research tables where every cell can be verified against the source | evidence chips, "click to verify" behaviour | 2, 3, 6 |
| Perplexity – inline numbered citation chips with popover (title, snippet, next / previous source) | challenge answers with citations, statement text with chips | 3 |
| Linear – keyboard-first triage (J/K, single-letter actions, visible hints), audit log table | review queue, keyboard bindings, audit tab | 2, 3, 6 |
| GitHub pull-request review – timeline of review events, approve / request changes, collapsible resolved threads | requirement thread, gate semantics | 3 |
| Palantir Foundry – Object Views (one object, tabs and widgets, actions) and Workshop decision apps | requirement and finding object pages | 2, 3 |
| Tesla / car configurators and Dribbble "Vehicle UI" collections | restrained dark automotive styling for the shell and the car view | 0, 2 |
| shadcn/ui dashboard example, Tremor blocks | tiles, tables, charts | 1, 4, 6 |

Links: Productboard https://productboard.com/prioritize-features · Jira Product Discovery fields https://www.atlassian.com/software/jira/product-discovery/guides/fields/overview and matrix view https://support.atlassian.com/jira-product-discovery/docs/create-a-matrix-view/ · airfocus Priority Ratings https://help.lucid.co/hc/en-us/articles/43479026796820 · Dovetail insights https://dovetail.com/help/summarize-and-present-insights · Enterpret vs Unwrap https://thecxlead.com/tools/unwrap-vs-enterpret/ · Elicit tables https://support.elicit.com/en/articles/14859952-new-in-elicit-tables-figures-and-slides-in-the-research-agent · Perplexity citations teardown https://aiuxplayground.com/teardowns/perplexity/citations · Linear audit log https://linear.app/changelog/2021-10-07-audit-log · GitHub reviews https://docs.github.com/en/enterprise-server@3.2/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews · Palantir Object Views https://palantir.com/docs/foundry/object-views/use-object-views-in-platform · Dribbble Vehicle UI https://dribbble.com/digitalunknown/collections/3415360-Vehicle-UI · Tremor https://shadcn.io/template/tremorlabs-tremor · react-three-fiber https://techhub.iodigital.com/articles/react-three-fiber-3d-for-the-web

---

## 12. Demo script (5 minutes)

| Time | Screen | Action | What the jury sees |
|---|---|---|---|
| 0:00 | 0 | pick US on the map, pick the 5 Series | adaptable to markets and vehicles |
| 0:20 | 1 | read the brief, press Run analysis | heterogeneous inputs, agent stages, counts |
| 0:50 | 2 | click the dashboard on the car, open "Voice control", read quotes and the linked study gap, accept, approve the set | signals linked to sources, human gate G1 |
| 1:50 | 3 | open the range requirement, challenge "PHEV too?", accept the agent's edit, approve | actionable requirements, challenge with evidence, gate G2 |
| 2:50 | 4 | lower metric-gap weight, raise regional fit, read the diff, approve | explainable prioritisation, gate G3 |
| 3:40 | 5 | defer the powertrain domain to H2, approve exterior now, publish v1 | layered decisions, gate G4 |
| 4:20 | 6 | open the published list, trace one requirement to a verbatim row, export the audit log | D2 and D4, full traceability |
