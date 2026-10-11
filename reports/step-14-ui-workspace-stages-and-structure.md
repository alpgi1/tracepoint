# Step 14 (UI track) – The scope workspace: data layer, stage bar and stage 2, Structure & context

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured; stages 3 to 5 follow in steps 15 to 17 of plan 08 |
| Track | Frontend, in parallel with the backend track; no backend code touched. The backend was run locally once to take the snapshots |
| Plan | `plan/08-engineering-workbench-plan.md` (version 0.2), accepted by the team with "proceed with the proposals" |

## 1. What the team asked for

Plan the way from the situation analysis (built: map, market, vehicle screen, subsystem dialog)
into the engineering tool for the other four stages of the BMW process slide, then start on it:
UI step 14 of plan 08. Use 21st.dev components where they fit, keep to the repository's rules
and the anti-slop list, use the fitting skills.

## 2. What was done

* **Plan 08** (`plan/08-engineering-workbench-plan.md`): the slide's five stages against what
  the backend serves and the frontend shows; the transition through the CPM subsystems; the
  four new stages; the snapshot-plus-live data layer; the requests to the backend team by
  priority; the UI steps 14 to 18; the demo path. Plan 07's claim that `GET /effort/model` and
  `POST /effort/estimate` exist was corrected (neither is on the API).
* **Data layer** (D-079). `scripts/snapshot-workspace.mjs` (`pnpm snapshot`) reads the running
  backend API once per vehicle × market pair and writes its responses unchanged to
  `content/workspace/<VEHICLE>_<MARKET>.json`: the requirements, the CPM effort per requirement,
  the H1, H2 and ALL packages, the excluded candidates and the requirement events, with the time,
  the endpoints, the backend code version and the effort model hash. `lib/content/workspace-types.ts`
  mirrors the API field for field and is the contract; `lib/data/workspace.ts` is the one module
  the live mode will replace. Seven snapshots are committed (three scopes with requirement sets,
  four with the API's empty answers). Eleven new tests pin the contract.
* **The stage bar** (D-078). `workspace-header.tsx` is the header every stage shares;
  `stage-bar.tsx` under it names the five stages of the slide with the figure each holds in the
  scope (12 subsystems · 3,628 verbatims; 20 candidates · 6 left out; 45 criteria · 15 on
  evidence; H1 package 18.4 %, major revision; 0 decided of 20 · 40 events). Stages 1 and 2 are
  links; 3 to 5 are plain text until their pages exist. The vehicle screen became stage 1 and
  `STAGE_TOP` in `lib/vehicles/layout.ts` grew by the bar so the hand-over still lands.
* **Stage 2, Structure & context** (D-080), `/markets/[market]/[vehicle]/structure`: the
  candidates of the scope with the agent's 0/1 proposal, horizon, evidence level, effort with its
  class and a thin bar, and the gate status, grouped by customer domain; a row opens to the
  agent's rationale, the horizon rationale, the subsystems the change starts in and reaches, and
  the rules that put it in front of the PM. Three views as links: **Needs a decision** (the
  Decision Inbox: six deterministic rules on fields the backend serves, printed on the row),
  **All candidates**, **Left out** (the agent's excluded findings with its reason). Four filters
  (domain, subsystem, horizon, status) as a GET form. Scopes without a requirement set say so and
  name the scopes that have one. The source line names the snapshot's date, the effort model
  hash ("assumption, not calibrated") and the backend code version.
* **21st.dev survey** (`frontend/docs/01-research-notes.md` 6.3): 20 queries through the
  search API, 218 unique demos, 10 contact sheets and 6 full-size renders reviewed. Methods
  taken and rewritten with the tokens: the horizontal stepper with inline titles (Origin UI,
  Cnippet) for the stage bar, tabs with a count (coss, Origin UI "with line") for the views, one
  filter row with native selects (Origin UI table with filters, kuratlielia toolbar), the
  hairline table (Origin UI "without horizontal dividers", "dense") and the expanding row with a
  chevron (Origin UI accordion, sean0205 data grid) for the candidates, the empty-state anatomy
  (serafimcloud, remcostoeten) without icon, frame or button. Nothing installed.
* **Skills used**: `dataviz` for the effort bars (one series, one hue, thin marks, the value as
  text in ink, no legend for one series, no colour on nominal categories).
* **Audit tools**: the page audit list gained five states of the structure page; the screenshot
  tool six states. `frontend/docs/07-workspace.md` documents what was built; `frontend/README.md`
  and `docs/README.md` were updated.

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm check` (lint, typecheck, 28 tests, build) | Clean; 26 routes, the vehicle and structure pages as partial prerenders (the table streams behind the prerendered shell because it reads `searchParams`) |
| `pnpm audit:pages` on 13 pages (landing, seven vehicle pages, five states of stage 2) | 0 findings. Keyboard stops: vehicle pages 15 (Map, two stage links, twelve rows), structure inbox 19, All 31, Left out 6, filtered F70 27, China 3; the dialog pass unchanged |
| Screenshots (`frontend/docs/screenshots/`, 24 states, 6 new) | The inbox of US G60 with every row open, All candidates with one row opened, EU F70 filtered to Software/HMI with the Clear link, US G70 Left out, CN G68 without a requirement set, US G60 at 1920 px; the vehicle and dialog screenshots were retaken with the stage bar |
| Snapshot against the API | The counts on screen equal the API's rows: G60 US 20 requirements (19 recommended, 18 H1, 2 H2), 6 excluded, 40 events; H1 package 18.35 % major revision (P5 to P95 10.4 to 26.8, stable 72.7 %), as in `reports/effort/effort_G60_US.md` |
| Inbox | G60 US 8 of 20 (one not recommended, one level C, seven with assumption-only criteria), G70 US 4 of 19, F70 EU 7 of 18; no conflict or warning flag exists in the three scopes, the rule-48 note fires on G70 `EX-02`; no market contradiction touches a scope with requirements |
| Page weight | Structure page HTML, G60 US All view: 169 KB (37 KB markup, 129 KB RSC payload in which the table appears twice); the vehicle page 124 KB as before. No snapshot reaches the browser beyond the rendered rows |
| Without script | The views are links, the filters a form, the rows native `details`; the page is readable and operable |
| Forbidden-list checklist (section 8) | Passed, see section 5 |

## 4. Figures on screen (from the snapshots)

| Scope | Candidates | Recommended | H1 / H2 | Evidence A / B / C | Criteria (on evidence) | Left out | Inbox | H1 package |
|---|---|---|---|---|---|---|---|---|
| G60 US | 20 | 19 | 18 / 2 | 7 / 12 / 1 | 45 (15) | 6 | 8 | 18.4 %, major revision |
| G70 US | 19 | 18 | 16 / 3 | 11 / 8 / 0 | 42 (21) | 7 | 4 | 14.4 %, adapt (stable in 55 % of the runs) |
| F70 EU | 18 | 18 | 17 / 1 | 0 / 18 / 0 | 36 (13) | 4 | 7 | 21.4 %, major revision |

## 5. Forbidden-list checklist

* Every number on screen is a row of the API's response or a count of such rows; the source line
  names the date, the model hash and the code version; assumptions are called assumptions
  (criteria basis, the model hash line, the inbox rule).
* No em or en dash, emoji, exclamation mark, cliché verb, question heading or decorative label
  (measured by the audit's text scan on 13 pages).
* No equal cards or bento grid; one table, hairlines, one accent; the only colour is the one blue
  on the current stage, the current view, the bars, the links and the chevron on hover.
* No gradient, glow, shimmer, second ground, stock or AI imagery.
* Motion on interaction only: the chevron turns on open (180 ms), hover tints; none under
  reduced motion; no loop.
* Nothing waits behind a loader; the Suspense fallback is an empty region in the same response.
* Keyboard: every control is reachable with a visible ring; the summaries, selects, Apply, Clear
  and the view links are stops; Escape and the dialog unchanged.
* Tap targets measured at 44 px or more (selects, Apply, Clear, the view links, the stage links,
  the summaries).
* No horizontal overflow at 375 px: the table scrolls in its own box.
* Console clean; no runtime fetch from any host: the pages read committed files.
* No placeholder comment, hard-coded colour or figure, or new dependency; `package.json` gained
  the `snapshot` script only.
* Team decisions changed: none silently; D-078 to D-080 record what the team's "proceed" settled
  (plan 08's open decisions 1 to 4). Decision 5 (what "engineering tool" means) is read as the
  PM's requirement workbench with the CPM as its engineering lens until the team says otherwise.

## 6. Decisions

D-078 to D-080 in `plan/decisions.md`.

## 7. Not done, and open for the team

1. **Stages 3 to 5 have no page.** The bar names them with their figures and no link. Step 15
   builds the requirement page and the three bridges on the vehicle screen (requirement counts on
   the CPM rows, the fourth dialog band, the link from the disliked suggestion); step 16 the
   priorities and the CPM method sheet; step 17 the live mode with gate G2 decisions and the log.
2. **Snapshot mode only.** The pages read the committed files; the live mode (reads at request
   time, writes through server actions) is step 17 and replaces `lib/data/workspace.ts` only. A
   snapshot goes stale when the requirement files or the profiles change; the source line shows
   its date, and `pnpm snapshot` against a running API refreshes it.
3. **The inbox rules are the frontend's.** They are deterministic and printed, but the backend
   does not know them; if the team wants the inbox as a backend view (`GET /requirements?inbox=`),
   the rule list of `lib/workspace/candidates.ts` is the specification.
4. **The analyst's brief is not on stage 2** (headline, insights). Reading the committed sample
   `reports/analysis/G60_US.json` needs no endpoint and could be step 15's first item; the plan put
   the analyst on step 18 with the run endpoints.
5. **Page weight.** The RSC payload repeats the table once for the prerendered shell and once for
   the streamed segment (169 KB in total for 20 rows). Reading the view and the filters on the
   client instead would make the shell static and cut the payload, at the cost of a table that
   needs script. Left as is.
6. **The requirement sets and profiles are the assistant's first draft** (D-060, D-063); stage
   2 makes them reviewable. The seven assumption-only criteria sets in G60 US dominate its inbox,
   which is the honest picture of the targets: the brief allows rough targets only.
7. The backend requests of plan 08 section 7 stand (P0: `POST /effort/estimate`, the analyses
   endpoints, a scope filter on `GET /events`). None was needed for this step.
