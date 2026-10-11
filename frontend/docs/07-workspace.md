# The scope workspace: the stage bar, the data layer, stages 2 to 5, the live mode and the backend's briefs

| Field | Value |
|---|---|
| Date | 2026-10-11, step 14 |
| Status | Built and verified: step 14 (D-078 to D-080) the data layer, the stage bar and stage 2; step 15 (D-083) stage 3 and the bridges; step 16 (D-084) stage 4, the package builder and the method sheet; step 17 (D-099) stage 5 and the live mode; step 19 (D-100 to D-104) the integration with the backend: one data feed, the analyst's brief, the series and the market evidence pages, the stages that exist per scope, the exports of the backend, the copy in the product manager's words (section 4d) |
| Files | `scripts/snapshot.mjs` (the data feed), `lib/data/analyses.ts`, `lib/data/exports.ts`, `lib/content/brief-types.ts`, `lib/workspace/market.ts`, `components/workspace/analyst-brief.tsx`, `series-view.tsx`, `brief-parts.tsx`, `external-rows.tsx`, `app/markets/[market]/[vehicle]/regions/page.tsx`, `market/page.tsx`, `log/requirements.md/route.ts` (step 19), `content/workspace/*.json` (the API's responses, committed), `lib/content/workspace-types.ts` (the contract), `lib/data/workspace.ts` (reads), `lib/workspace/candidates.ts` (the candidate rules), `lib/workspace/requirements.ts` (routes, evidence resolution, bridges), `lib/workspace/stages.ts` and `figures.ts` (the stage bar's data), `components/workspace/workspace-header.tsx`, `stage-bar.tsx`, `candidate-filters.tsx`, `candidate-table.tsx`, `requirement-page.tsx`, `evidence-list.tsx`, `effort-block.tsx`, `app/markets/[market]/[vehicle]/structure/page.tsx`, `requirements/page.tsx`, `requirements/[id]/page.tsx`, `priorities/page.tsx`, `priorities/method/page.tsx`, `priority-matrix.tsx`, `package-table.tsx`, `lib/workspace/priorities.ts`, `lib/data/effort.ts` (the effort model file and the one live read, `POST /effort/estimate`), `content/effort.json`, `lib/site.ts` (copy), `app/globals.css` (step 14 and 15 blocks), `lib/content/workspace.test.ts`, `lib/workspace/requirements.test.ts`, `tools/audit/screenshots.mjs` |
| Plan | `plan/08-engineering-workbench-plan.md` sections 3, 4.1 to 4.3, 4.5 and 6 |

## 1. What it is

After the map and the market, the vehicle screen is the first of **five stages of one scope
workspace** (vehicle × market), named as on the BMW process slide: Situation analysis, Structure
& context, Requirements definition, Prioritization, Documentation. The header every stage shares
carries the Map chip, the vehicle as the h1, the market line, and the **stage bar**: the five
stages with the figure each holds in this scope. Stage 1 is the vehicle screen of steps 07 to 13.
Stage 2, **Structure & context**, is built in this step: all potential requirements of the scope
with the agent's 0/1 proposal, three views (needs a decision, all candidates, left out), a filter
row, and the candidate table grouped by customer domain. Stages 3 to 5 are named in the bar
without a link until their pages exist.

Every figure of the new screens is a row the backend API serves; the browser computes nothing
but counts and the share of a bar.

## 2. The data layer (plan 08 section 6)

| Piece | What |
|---|---|
| `scripts/snapshot.mjs` (`pnpm snapshot`) | Since step 19 the one data feed of the frontend (section 4d). Per vehicle × market pair of `GET /overview` it writes the API's responses unchanged to `content/workspace/<VEHICLE>_<MARKET>.json`: `GET /requirements`, `GET /effort/requirements`, `GET /effort/scenarios`, the excluded candidates (the scope event `requirements.candidates_excluded`), the requirement events (`GET /events?entity_type=requirement&entity_prefix=REQ-<V>-<M>-`, one filtered call since step 19), the external evidence (`GET /external`) and the D2 exports (`GET /requirements/export`). The file records when it was taken, the endpoints, the backend's code version of its latest run and the effort model hash |
| `lib/content/workspace-types.ts` | The contract, field for field in the backend's own names (snake_case): `Requirement` (D2 fields, D-060), `RequirementEffort` (D-062: effort in % of a new vehicle, P5 to P95, decision, stability, layer, size, the changes, the subsystems reached with the strongest path, the catalogue scan, flags with rule numbers, the model hash, `stale`), `EffortScenario` (the H1, H2 and ALL packages, rule 45), `ExcludedCandidate`, `AuditEvent` (D-026) |
| `lib/data/workspace.ts` | `workspaceSnapshot(vehicle, market)`, `workspaceScopes()`, `scopesWithRequirements()` over one static import per snapshot file (the test checks that the folder and the list agree), and since step 17 `readWorkspace(vehicle, market, { detailOf? })`: the read every stage page and the CSV route make at request time, the snapshot or, in the live mode, the snapshot with the API's current answers merged in (`mergeLive`, pure and tested). Imported by server components, the server action and the route handler only, so the browser never receives a snapshot and never calls the API |
| `lib/workspace/candidates.ts` | Joins a requirement with its estimate (`Candidate`: `starts`, the subsystems of the change profile; `reaches`, the subsystems the change propagates to), the inbox rules (section 4), the filters, the domain grouping and the stage counts |
| `lib/content/workspace.test.ts` | Pins the contract: one file per pair, the literal unions, one effort row per requirement on known subsystems with P5 ≤ effort ≤ P95, the three scenarios with the combined effort never above the plain sum and the requirement count equal to the recommended, not rejected requirements of the horizon, events of the scope only, the candidate rules on G60 US |

Since step 16 `pnpm snapshot` also writes `content/effort.json`, one file for all scopes: the
effort model as the API serves it (`GET /effort/model`) and the back-test (`GET /effort/backtest`),
with the time and the backend code version. Since step 15 a snapshot also holds `details` (GET `/requirements/{id}` per requirement: the
requirement with its findings, each finding with its statement, figures, links to other findings
and evidence references), and the evidence those references name, resolved once per scope and
keyed by id: `verbatims` (GET `/verbatims/{id}`, the text as written with its classification rows
and workbook row), `metrics` (the rows of GET `/studies` the findings cite, across vehicles and
markets for peers) and `equipment` (the rows of GET `/equipment?vehicle=`). Seven snapshots, taken
2026-10-11 from the API at backend code `e06b37f`, effort model `789fcb7624b8`: G60 US (20
requirements, 6 excluded, 40 events, 313 verbatims, 18 metrics, 13 catalogue items, 1.1 MB), G70
US (19, 7, 38, 293, 42, 0, 1.0 MB), F70 EU (18, 4, 36, 201, 30, 17, 0.9 MB); G60 EU, G70 EU, G68
CN and G70 CN hold the API's empty answers (2.1 KB each), which the stages show as "no requirement
set". A snapshot is imported by server components only, so its size never reaches the browser. A snapshot goes stale when
the requirement files or the profiles change; the page's source line names its date and the
model hash, and `pnpm snapshot` refreshes it against a running API (`cd backend && uv run uvicorn
tracepoint.api.app:app --port 8000`).

**The live mode (step 17, D-085; automatic since D-106).** `TRACEPOINT_LIVE` on the Next.js
server is `1` (always live), `0` (the stored data only) or unset, the default: live whenever the
backend API answers `GET /health` at `TRACEPOINT_API_URL` (default `http://127.0.0.1:8000`),
asked by `liveEnabled()` at most once every 5 s with a 1.5 s timeout, so gate G2 works as soon as
the backend runs and a page without it stays as fast as the stored data. In the live mode `readWorkspace`
asks the API in parallel for the five lists that change (`GET /requirements`,
`GET /effort/requirements`, `GET /effort/scenarios`, the scope events for the excluded candidates,
`GET /events?entity_type=requirement&limit=5000` kept to the scope's id prefix and sorted by id),
and on a requirement page for `GET /requirements/{id}`, each with a 4 s timeout, and replaces those
parts of the snapshot; the verbatims, study metrics and catalogue items stay from the snapshot,
since they do not change between decisions. When any call fails the page shows the snapshot and its
source line says which API did not answer and why ("fetch failed" within 0.1 s when nothing
listens). Every stage body sits behind a Suspense boundary and calls `connection()` first, so the
pages are partial prerenders (the shell static, the body streamed on every request) in both modes:
the live mode is a start-time setting, not a build-time one, and a `pnpm build` made without it
still goes live when started with it. Writes exist only in the live mode and only through the server
action `app/actions/decide.ts` (gate G2, section 4c); the browser never calls the API.

## 3. The header and the stage bar

`workspace-header.tsx` replaces the header the vehicle screen had; `stage-bar.tsx` sits under
it on a hairline. The header's height is written in `lib/vehicles/layout.ts` (`STAGE_TOP` = 112
px row + 1 px hairline + 48 px bar + 16 px), because the hand-over from the map lands the car's
photo under it (D-055; the screen still reports the measured target).

Each stage is a list item with its number in a 22 px hairline ring, the name, and the figure it
holds: stage 1 the subsystems on the vehicle and the market's verbatims; stage 2 the candidates
and the left-out findings (or "no requirement set"); stage 3 the acceptance criteria and how many
rest on evidence; stage 4 the H1 package's effort and class; stage 5 the decided requirements
and the events. Stages 1 and 2 are links (48 px tall); the current one carries `aria-current`,
a 2 px rule in the one blue and the name in weight 500; stages 3 to 5 are plain text until their
pages exist. Hover turns a link's name blue; nothing else moves. Method after the horizontal
steppers of the 21st.dev survey (`01-research-notes.md` 6.3) without their filled circles and
check marks: nothing is "completed", the PM may enter any stage.

## 4. Stage 2, Structure & context (`/markets/[market]/[vehicle]/structure`)

**Shell.** The shared header, the stage heading (h2) and the hint (what the columns are, that the
proposal is the agent's and the decision the PM's at gate G2), then the candidates, then the
source line: when the API was read, the effort model hash with "assumption, not calibrated", the
backend code version.

**Views** (`candidate-filters.tsx`): three links that keep the filters, the count of each beside
its name as text, the current view with `aria-current` and the one blue rule.

| View | Rows | Hint on screen |
|---|---|---|
| Needs a decision (default) | Proposed candidates where at least one rule of section 5 fires; every row open with its reasons first | The rule list |
| All candidates | Every candidate of the scope | Grouped by domain; open a row for the rationale |
| Left out | The findings the agent excluded, with its reason | The filter is visible so it can be reversed |

**Filters.** A GET form with four native selects (domain, subsystem, horizon, status, each
offering the values that occur among the scope's candidates) and an Apply control; a Clear link
when a filter is active. No submit on change: a keyboard user stepping through a select would
navigate on every arrow key. The subsystem filter matches where a change starts and where it
propagates to; it is the target of the bridge from the subsystem dialog (step 15).

**Table** (`candidate-table.tsx`): one `tbody` per customer domain in the taxonomy's order with
the domain as a row-group header and its count; per candidate the id (mono), the title as a native
`details` element with a Lucide chevron that turns when the row opens (the rationale, the horizon
rationale, where the change starts and what it reaches, and in the inbox the reasons first), the
0/1 proposal, horizon, evidence level, effort as "4.6 %" with its class ("adapt", "new
generation") and a 3 px bar in the one blue scaled to the largest estimate on the page, and the
gate status. A requirement without a change ("preserve", "no_vehicle_change") shows "no change".
Numbers are right-aligned with tabular figures; the table scrolls inside its own box below 1024
px so the page never overflows.

**Empty states.** A scope without a requirement set: one paragraph that names the scopes with
one and that a set for this scope is the requirement agent's next step on the backend. Filters
that match nothing: one sentence and the Clear link. An inbox with nothing: one sentence pointing
to the All view.

**Rendering.** The page is a server component; the shell is prerendered and the table, which
reads the view and the filters from the URL, streams in behind a Suspense boundary (Cache
Components treat `searchParams` as request-time data). With script off the whole page is still
one HTML response; the views are links and the filters a form. Measured: the HTML of G60 US,
All view, is 169 KB: 37 KB of markup and 129 KB of React Server Components payload, in which
the table appears twice (the prerendered shell's payload and the streamed segment). Nothing of
a snapshot beyond the rendered rows reaches the browser.

## 4a. Stage 3, Requirements definition (`/requirements`, `/requirements/[id]`; step 15, D-083)

**Index.** The scope's requirements grouped by customer domain: id and title as links, the
criteria count with how many rest on evidence, horizon, evidence level, status. Scopes without a
requirement set show the same sentence as stage 2.

**Requirement page**, one static route per requirement (57 today), the D2 record on screen:

| Block | Content | Source in the snapshot |
|---|---|---|
| Breadcrumb | The index, a slash, the id | |
| Title, facts | The title as h2; proposal (1 or 0) with the rationale, horizon with the rationale, domain, markets, evidence level ("the best level of the primary and supporting findings"), status and version | `requirements[]` |
| Statement | The customer-facing statement | |
| Acceptance criteria | Market, metric, target, how measured, basis (evidence or assumption, as text) | `criteria` |
| Evidence | The linked findings, primary first, each a `details` row (the primary open) with the backend's statement, its figures labelled per kind (rows, likes, complaints and their split, share of the market's complaint rows, by powertrain, source, country; a study score with its peers, rank and shares; a catalogue gap's items), its links to other findings with the rationale, and the evidence rows the backend linked: verbatims as written in a `blockquote` with id, source, country, powertrain, classification and workbook row (E5); study attributes with mean and shares; catalogue items with their availability; counts; references to other findings. A reference the snapshot does not hold says so | `details[id].findings`, `verbatims`, `metrics`, `equipment` |
| Assumptions, uncertainties | Two lists, or "None recorded." | |
| Effort (CPM) | The lead line (effort in % of a new vehicle, P5 to P95, class, stability, size, layer, certification add-on), a stale note where the estimate predates the requirement version, the change profile (subsystem, own impact, layer, carryover, reason, catalogue terms); the catalogue scan with its level and the vehicles where the terms match; the flags with their rule numbers; the model hash with "assumption, not calibrated" | `efforts[]` |
| Decision at gate G2 | The current status and version; Approve, Reject, Defer as disabled controls with the sentence that a decision needs the running API and that this page reads a snapshot of a named time (the live mode of step 17 enables them) | |
| History | The requirement's audit events oldest first on a hairline timeline: time, action, actor, a status change as "from to", the rationale, the run id | `events[]` |
| Source line | The snapshot's time and the backend code version | `snapshot` |

The browser computes nothing: every figure on the page is a field of the API's response. The
footprint over the subsystems is no longer shown on this page; stage 4 keeps
the footprint of each package.

**Bridges on the vehicle screen** (plan 08 section 3.1):

1. **CPM list rows** carry a third line from the scope's effort estimates: "2 requirements start
   here · reached by 5 · up to 4.6 %", "no requirement changes it", or "no requirement set".
2. **The subsystem dialog** gains a fourth band, "Requirements that change {subsystem}": how many
   start there and how many propagate into it, the list of both (id, title, horizon, effort and
   class, where) with each line a link to the requirement page, and a link to stage 2 filtered
   to the subsystem. Empty states: no requirement changes it; no requirement set for the scope.
3. **Under the disliked suggestion**, the requirements citing the subsystem's criticised themes,
   theme by theme, as links; or that none does. The theme's customer-voice finding is identified
   by the backend's title convention "{theme}: …", carried by every requirement's linked findings.

The bridge data (`bridgesFor` in `lib/workspace/requirements.ts`) is computed on the server
from the snapshot and the CPM view and handed to the list as six fields per requirement line,
not the effort rows.

## 4b. Stage 4, Prioritization (`/priorities`, `/priorities/method`; step 16, D-084)

**The matrix** (`priority-matrix.tsx`, inline SVG). One mark per requirement: horizontal the
effort in % of a new vehicle with the P5 to P95 range as a 2 px line at 35 % through the mark,
vertical the complaint rows of the primary finding (the backend's `quantification.complaints`;
a requirement whose primary finding is a study attribute or a strength sits at 0 and is named
beneath the chart). H1 marks are 10 px circles, H2 marks 10 px squares, both in the one blue with
a 2 px ring in the paper colour; the evidence level stands beside each mark in muted 10 px text;
the two largest efforts and the two largest evidence counts carry their id; every mark names its
requirement, figures and level in a native `title`. Axes and gridlines are solid hairlines with
ticks at clean steps (`axisMax`). A legend beneath names the two shapes and the range line. The
table twin follows, most complaint rows first, with id (link), title, horizon, level, rows,
effort, range and class. There is **no composite score**: the hint says the Phase 5 score is not
built and the page does not invent one.

**The packages** (`package-table.tsx`). One hairline table with the engine's three variations
(`scenarios`: H1, H2, ALL): requirements, combined effort, P5 to P95, class with "kept in n % of
the runs" and "borderline, the PM decides" under 90 %, the plain sum of the single estimates, the
certification add-on. Beneath, per package, the six subsystems carrying most of it as footprint
rows (weight as the track, risk as the fill, the path as text). Then the derived sentence about
the H1 package (`h1Note`): the class every H1 requirement has on its own, the combined figure
and class, the three largest single estimates as links; G60 US reads "Every H1 requirement is
adapt on its own; together they are 18.4 % of a new vehicle generation, a major revision
(borderline, the PM decides)."

**The package builder.** A GET form of checkbox rows per requirement (id, title, estimate),
grouped by horizon, with presets as links (the H1 set, the H2 set, all recommended, clear) and
one control, "Estimate the package". The chosen ids travel in the URL (`?pkg=…`); the page's
Suspense part reads them and asks the backend API for `POST /effort/estimate` at request time,
server side (`lib/data/effort.ts`, `TRACEPOINT_API_URL`, default `http://127.0.0.1:8000`, 30 s
timeout, nothing cached); the response is rendered as the combined figure with range, class,
stability, size, layer and add-on, the sum of the single estimates, the six largest subsystems as
footprint rows, and each requirement on its own. Without the API the page says so, names the
address and the reason, and the stored packages above stay. This is the first live read of the
workspace; the browser still never calls the API.

**The method sheet** (`/priorities/method`, `content/effort.json` from `GET /effort/model` and
`GET /effort/backtest`). The facts of the model (reference with its link, engine and model file,
hash with "assumption, not calibrated", thresholds, certification add-on with the subsystems that
trigger it, this vehicle's platform and the subsystems the model keeps off it); the subsystems
with weight, basis and certification trigger; the **link matrix**, rows where a change starts
and columns what it reaches, each cell "likelihood / impact" with a fill that follows the
likelihood (`color-mix` of the one blue) and the interface in a native `title`; the 28 links as
a list with the interface sentence; the **back-test**: "8 of 8 anchors reproduced (7 of 7
independent)", runs, spread and scope, and one row per decision with the engine's class, BMW's
decision, the match and the independence, the two proposals of the pitch beneath without a
decision. The carryover factor, the propagation reference impact and the platform rule's floor
are in the model file but not in `GET /effort/model`; the sheet says so. Every effort figure of
the workspace links here through its model hash.

## 4c. Gate G2 and stage 5, Documentation (`/requirements/[id]#decision`, `/log`, `/log/requirements.csv`; step 17, D-085)

**Gate G2 on the requirement page** (`components/workspace/decision-form.tsx`). In the live mode
the block under "Decision at gate G2" is a form: the current status and version, the mandatory
rationale (a textarea, `required`, at least three characters, as the API demands), and Approve,
Reject and Defer as three submit controls of the one form (`name="decision"`). The server action
`decideRequirement` reads the form, checks the id, the decision, the rationale and the return
address (only a requirement page of this app), forwards `POST /requirements/{id}/decision` with
`{decision, note}` to the API (10 s timeout) and redirects back to the page with the outcome in
the URL: `?decision=approve|reject|defer` on success, `failed` with the API's reason, `invalid`,
`note` or `offline` otherwise, and `#decision` so the block is in view. The page then reads the
new status, the version and the `requirement.decided` event live, and shows the outcome as one
line with the rule in the one blue ("Decision recorded: deferred."). The backend sets the actor
from its own configuration (D-014), writes the audit event with the rationale and appends the
decision to `config/decisions/requirements.jsonl` (D-061); the frontend stores nothing. Outside
the live mode the three controls are disabled and the sentence names the snapshot's date: with
`TRACEPOINT_LIVE=0` that this Tracepoint records no decisions, otherwise that the service that
records them does not answer and the page should be reloaded once it runs (D-106). A submission
that reaches the action with `TRACEPOINT_LIVE=0` comes back as `offline`; otherwise the action
asks the API, and a backend that does not answer comes back as `failed` with its reason.

**Stage 5, Documentation** (`app/markets/[market]/[vehicle]/log/page.tsx`,
`lib/workspace/log.ts`). Three parts, nothing computed beyond joins:

* **The decision record**: one row per requirement of the scope (ID and title linked to the
  requirement page, status, version, the latest `requirement.decided` event's decision, actor,
  time and rationale, or "no decision yet"), led by "n decided of m" counted as the stage bar
  counts it (status other than proposed).
* **Export**: a link to `/log/requirements.csv`, a route handler that writes the D2 list from the
  same read (`requirementsCsv`): 28 columns in the API's names (the requirement's fields, the
  criteria, assumptions, uncertainties and findings joined with ` | `, the engine's effort,
  range, class, layer and model hash, the status and version, and the latest decision with actor,
  time and rationale), cells quoted where they hold a comma, a quote or a line break, CRLF line
  ends, served as `text/csv` with a `Content-Disposition` naming the scope and the day of the read.
  The backend's own exporter (`tracepoint requirements export`) writes the same list as Markdown
  and CSV; the route exists so the PM has it from the page.
* **The audit trail**: every event the backend logged for the scope's requirements, newest first,
  on the hairline timeline of stage 3 (`components/workspace/timeline.tsx`, now shared) with the
  requirement id as a link leading each item; the count above it. Under 600 px the time stands
  above the text.

The stage bar's fifth figure ("n decided of m, k events") links here since step 17.

## 4d. Step 19: the integration with the backend (D-100 to D-104)

**One data feed.** `pnpm snapshot` (`scripts/snapshot.mjs`) is the only way evidence enters
`content/`: `markets.json` is `GET /overview`, `cpm.json` is `GET /effort/model` plus
`GET /cpm/{vehicle}?market=` per pair, `effort.json` the model and the back-test,
`analyses/` the briefs (`GET /analyses`, `GET /analyses/{key}/brief`), `workspace/*.json` the
scope's requirements, estimates, packages, events, evidence, external evidence and exports. The
frontend's two Python builders that re-implemented the backend's counting (`build-content.py`,
`build-cpm.py`) are gone; they had drifted (the G70 in the European Union has 19 verbatims in the
evidence store and showed none). The backend's tests hold the committed `markets.json` and
`cpm.json` equal to a fresh computation.

**Which stages exist.** `lib/workspace/stages.ts` and `figures.ts` (`scopeContent`, `hasStage`,
`stageParams`): the situation analysis exists for every scope; Structure & context where the
scope carries a requirement set or an analyst's brief; stages 3 to 5 where it carries a
requirement set. A stage without content is plain text in the stage bar and its route renders the
not-found page (Next.js 16.4 serves the app shell of an unlisted param first, so the status is 200;
the bar never links there). The empty-state component of steps 14 to 17 is removed, as are the CPM
rows' "no requirement set" line, the dialog's requirements band without a set, the Liked and
Disliked bands of a market without verbatims and the "Phase 2" sentence of the market band.

**The analyst's brief (stage 2).** `components/workspace/analyst-brief.tsx` renders
`GET /analyses/{key}/brief` of the situation analysis that speaks about the scope (`G60_US`,
`G68_CN`, and for the F70 in the European Union `F70_GB`, the analysis of one country, labelled so):
the headline and summary; the proposals in one hairline table grouped into change now (H1), with
the next generation (H2) and keep or act outside the vehicle, each row opening the proposal, the
reasoning, the effort with range, class, stability, layer, basis and footprint, the checks of the
effort engine and the evidence, every reference read back from the store (a customer verbatim as
written in a blockquote, a finding, a study score, an external source with its link); the engine's
packages per horizon; what customers say grouped by kind; the assumptions and the open checks. In
the live mode the brief is read from the API, so a new run shows without a new snapshot.

**The series across its regions** (`/regions`, a page of stage 1). `series-view.tsx` renders the
series brief (`G60_regions`, the 5 Series in the European Union, the United States and China with
the G68): the answer, the regions side by side (verbatims, units 2025 and 2030, study), the topics
sorted into the five decisions (change now in every region, change now in one region, next
generation, keep, no action), each opening the regional evidence (customers, market and rivals,
signal), the car today, rivals, the reasoning, the effort and the references; the packages, what
each region expects, the optimum version per region, and what the data cannot answer.

**Market evidence** (`/market`, a page of stage 1, and the dialog). `GET /external` of the scope:
the statements of the team's external sources with their source, origin, date, how many
independent sources agree and whether their figures were found on the page, grouped by subsystem
(a statement on several subsystems under each). The subsystem dialog shows the team's market rows
and the first three external statements on the subsystem with a link to the page; a CPM row of a
market without verbatims counts its market statements instead.

**Exports.** `/log/requirements.csv` and `/log/requirements.md` serve the backend's D2 exporter
(`GET /requirements/export`), which since step 19 carries each requirement's effort and latest
G2 decision; the snapshot stores both files, the live mode asks the API. The frontend's own CSV
writer is removed.

**The product manager's words** (D-103). The codes arrive with their words from the backend's
vocabulary (`GET /glossary`, `tracepoint/briefs/labels.py`); the agents' sentences arrive with
subsystem keys, layer codes, field names and marketing filler turned into plain words
(`tracepoint/briefs/text.py`). The UI copy (`lib/site.ts`) no longer names endpoints, settings,
file paths or commands: the source line says "Data as stored on" or "Live data, read on", a
failed live read says the live service did not answer, a decision outside the live mode says
decisions are recorded when Tracepoint runs live. Those details live in the READMEs.

## 5. The inbox rules (`lib/workspace/candidates.ts`)

A proposed candidate enters "Needs a decision" when at least one of these fires. Every rule reads a
field the backend already serves; the rule and its figure are printed on the row.

| Rule | Reads | Printed as |
|---|---|---|
| `not_recommended` | `recommend` false | Not recommended by the agent: the rationale |
| `evidence_c` | `evidence_level` C | Evidence level C: n linked findings |
| `criteria_assumed` | every criterion `basis: assumption` | Every acceptance criterion is an assumption: n of n criteria |
| `effort_flag` | a flag of level conflict or warning, or rule 48 (H2 change that fits a life-cycle impulse) | Effort model flag: Rule 47: … |
| `stale_effort` | `stale` true | Estimate older than the requirement: versions |
| `market_contradiction` | a market row with a contradiction (`content/cpm.json`) in a subsystem the change starts in or reaches | Contradicting market evidence: the statement, source, date |

On the snapshots: G60 US 8 of 20 (one not recommended, one level C, seven with assumption-only
criteria), G70 US 4 of 19, F70 EU 7 of 18. No flag of level conflict or warning exists in the
three scopes; the rule-48 note fires on G70 `EX-02`. No market contradiction touches a scope with
requirements (the China fridge contradiction has none).

## 6. Verification (step 14)

`pnpm check` clean (lint, typecheck, 28 tests, build: 26 routes, the vehicle and structure pages
as partial prerenders); `pnpm audit:pages` on 13 pages, 0 findings (keyboard stops: vehicle pages
15, structure inbox 19, All 31, Left out 6, filtered 27, China 3); `pnpm shots` 24 states, six
new. The forbidden-list checklist is in the step report.
