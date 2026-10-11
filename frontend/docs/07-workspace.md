# The scope workspace: the stage bar, the data layer and stage 2

| Field | Value |
|---|---|
| Date | 2026-10-11, step 14 |
| Status | Built and verified (D-078 to D-080); stages 3 to 5 follow in steps 15 to 17 |
| Files | `scripts/snapshot-workspace.mjs` (snapshot), `content/workspace/*.json` (the API's responses, committed), `lib/content/workspace-types.ts` (the contract), `lib/data/workspace.ts` (reads), `lib/workspace/candidates.ts` (the candidate rules), `lib/workspace/stages.ts` and `figures.ts` (the stage bar's data), `components/workspace/workspace-header.tsx`, `stage-bar.tsx`, `candidate-filters.tsx`, `candidate-table.tsx`, `app/markets/[market]/[vehicle]/structure/page.tsx`, `lib/site.ts` (copy), `app/globals.css` (step 14 block), `lib/content/workspace.test.ts`, `tools/audit/screenshots.mjs` |
| Plan | `plan/08-engineering-workbench-plan.md` sections 3, 4.1 and 6 |

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
| `scripts/snapshot-workspace.mjs` (`pnpm snapshot`) | Calls the running backend API once per vehicle × market pair of `content/markets.json` and writes its responses unchanged to `content/workspace/<VEHICLE>_<MARKET>.json`: `GET /requirements`, `GET /effort/requirements`, `GET /effort/scenarios`, the excluded candidates (the scope event `requirements.candidates_excluded`) and the requirement events (`GET /events?entity_type=requirement`, the scope's share by the entity id prefix). The file records when it was taken, the endpoints, the backend's code version of its latest run and the effort model hash |
| `lib/content/workspace-types.ts` | The contract, field for field in the backend's own names (snake_case): `Requirement` (D2 fields, D-060), `RequirementEffort` (D-062: effort in % of a new vehicle, P5 to P95, decision, stability, layer, size, the changes, the subsystems reached with the strongest path, the catalogue scan, flags with rule numbers, the model hash, `stale`), `EffortScenario` (the H1, H2 and ALL packages, rule 45), `ExcludedCandidate`, `AuditEvent` (D-026) |
| `lib/data/workspace.ts` | `workspaceSnapshot(vehicle, market)`, `workspaceScopes()`, `scopesWithRequirements()`. One static import per snapshot file; the test checks that the folder and the list agree. Imported by server components only, so the browser never receives a snapshot. The live mode (reads at request time, writes through server actions) replaces the body of these functions and nothing else (step 17) |
| `lib/workspace/candidates.ts` | Joins a requirement with its estimate (`Candidate`: `starts`, the subsystems of the change profile; `reaches`, the subsystems the change propagates to), the inbox rules (section 4), the filters, the domain grouping and the stage counts |
| `lib/content/workspace.test.ts` | Pins the contract: one file per pair, the literal unions, one effort row per requirement on known subsystems with P5 ≤ effort ≤ P95, the three scenarios with the combined effort never above the plain sum and the requirement count equal to the recommended, not rejected requirements of the horizon, events of the scope only, the candidate rules on G60 US |

Seven snapshots, taken 2026-10-11 from the API at backend code `e06b37f`, effort model
`789fcb7624b8`: G60 US (20 requirements, 6 excluded, 40 events, 163 KB), G70 US (19, 7, 38,
161 KB), F70 EU (18, 4, 36, 141 KB); G60 EU, G70 EU, G68 CN and G70 CN hold the API's empty
answers (1.9 KB each), which the stages show as "no requirement set". A snapshot goes stale when
the requirement files or the profiles change; the page's source line names its date and the
model hash, and `pnpm snapshot` refreshes it against a running API (`cd backend && uv run uvicorn
tracepoint.api.app:app --port 8000`).

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
