# Step 16 (UI track) – Stage 4, Prioritization: the matrix, the packages, the package builder, and the CPM method sheet

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured; stage 5 and the live mode follow in step 17 of plan 08 |
| Track | Frontend, in parallel with the backend track; no backend code touched. The local backend was moved to the rebased `main` (backend step 16) for the new endpoints |
| Plan | `plan/08-engineering-workbench-plan.md` (version 0.4), step 16 |

## 1. What the team asked for

Continue with plan 08: UI step 16, the Prioritization stage with the matrix and the packages,
and the CPM method sheet. The backend's step 16 (D-081) had delivered `GET /effort/model`,
`GET /effort/backtest` and `POST /effort/estimate` in the meantime, so the package builder of
step 18 was built here as well.

## 2. What was done

* **Snapshot grown.** `pnpm snapshot` also writes `content/effort.json`: the effort model as
  `GET /effort/model` serves it (the twelve subsystems with weights, basis, links, certification
  triggers, per-vehicle applicability, the model hash) and the back-test of `GET /effort/backtest`
  (8 anchors and 2 proposals, 2,000 runs, spread 50 %). Types for both and for the estimate
  response.
* **Stage 4, Prioritization** (`/priorities`, D-084):
  * **The matrix**: inline SVG, effort in % of a new vehicle (with the P5 to P95 range as a line)
    against the complaint rows of the primary finding; H1 circles, H2 squares, 10 px in the one
    blue with a paper ring; the evidence level beside each mark; ids on the four extremes; a
    native title per mark; hairline axes; a legend for the two shapes and the range; the table
    twin beneath, most complaint rows first. Requirements whose primary finding carries no
    complaint rows sit at 0 and are named (G60 US: `DD-03`, a strength to keep). **No composite
    score**: the hint says the Phase 5 score is not built and the page invents none.
  * **The packages**: the engine's H1, H2 and ALL variations in one table (combined effort, range,
    class with stability and "borderline, the PM decides" under 90 %, the plain sum, the
    certification add-on), the six subsystems carrying most of each as footprint rows, and the
    derived sentence: "Every H1 requirement is adapt on its own; together they are 18.4 % of a
    new vehicle generation, a major revision (borderline, the PM decides). The largest single
    estimates: IC-01 4.6 %, IC-03 3.5 %, ID-01 3.0 %."
  * **The package builder**: a GET form of checkbox rows (id, title, estimate) grouped by horizon,
    presets as links (H1 set, H2 set, all recommended, clear), one control. The chosen ids travel
    in the URL; the page's server asks `POST /effort/estimate` at request time (30 s timeout,
    nothing cached, nothing stored) and renders the combined figure, class, stability, size,
    layer, add-on, the sum of the single estimates, the six largest subsystems and each
    requirement on its own. Without the API the page says so with the address and the reason.
    The browser never calls the API.
* **The method sheet** (`/priorities/method`): the model's facts (reference with link, engine and
  model file, hash marked "assumption, not calibrated", thresholds, certification add-on with
  its trigger subsystems, this vehicle's platform and absent subsystems), the weights with
  their basis, the **link matrix** (rows where a change starts, columns what it reaches, each
  cell "likelihood / impact" with a fill that follows the likelihood and the interface on hover)
  and the 28 links as a list with the interface sentence, the **back-test** ("8 of 8 anchors
  reproduced, 7 of 7 independent") with one row per BMW decision and the two proposals beneath.
  The sheet says that the carryover factor, the propagation reference impact and the platform
  rule's floor are in the model file but not in `GET /effort/model`. Every effort figure of
  stage 3 and stage 4 links to the sheet through its model hash.
* **Shared empty state**: the "no requirement set" sentence of the stages moved to
  `no-requirements.tsx`; the stage bar links stage 4.
* **21st.dev survey** (`frontend/docs/01-research-notes.md` 6.5): 12 queries, 125 demos, 11
  contact sheets. The registry has no scatter; its charts (dark cards with glow and hatching)
  were rejected, and the matrix was written to the dataviz rules. Methods taken: the table with
  vertical lines and the comparison table's upright heads for the link matrix, the vertical table
  for the model's facts, the checkbox row with a description for the builder. Nothing installed.
* **Skills used**: `dataviz` for the matrix (marks with a surface ring, hairline axes, a legend
  for two series, selective direct labels, text in ink, a table twin) and the footprint rows.
* **Audit tools**: four stage-4 pages added to the page audit, four screenshot states.
  `frontend/docs/07-workspace.md` section 4b, `frontend/README.md` updated.

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm check` (lint, typecheck, 41 tests, build) | Clean; 122 routes (the priorities page and the method sheet per scope, the rest as before) |
| `pnpm audit:pages` on 22 pages | 0 findings after three fixes found by the first run (two grids with a fixed minimum width and the model's long file names overflowed at 375 px; the Clear link was 38 px wide). Keyboard stops: priorities 40 (the table twin's ids, the presets, the checkboxes, the control), method sheet 7, China 6 |
| Screenshots (`frontend/docs/screenshots/`, 33 states, 4 new) | The priorities page of US G60 in full, the builder with three requirements estimated, the method sheet scrolled to the link matrix, EU F70 at 1920 px |
| The builder against the engine | IC-01, ID-01 and PR-03 together: 53.6 % (P5 to P95 40.5 to 62.0), new generation by the K3 rule, kept in 100 % of the runs, the sum of the single estimates 56.6 %; the items equal the stored estimates (tests on the stored packages; the live call seen on the audited page) |
| The matrix against the data | 20 points; seats 62 complaint rows at 4.6 %; the range requirement 67 rows at 49.0 % with the range 36.7 to 56.9; `DD-03` at 0 rows (test) |
| The effort file | Model hash equal to every snapshot's and the catalogue's weights and links; back-test 8 of 8 with every anchor's class equal to BMW's (test) |
| Page weight | Priorities page HTML 198 KB (the matrix, the table twin, the packages and the twenty checkbox rows, repeated once in the flight payload); with an estimated package 199 KB; the method sheet 106 KB |
| Forbidden-list checklist (section 8) | Passed, see section 5 |

## 4. Figures on screen (G60 US)

| Package | Requirements | Combined | P5 to P95 | Class | Sum of single |
|---|---|---|---|---|---|
| H1 | 17 | 18.4 % | 10.4 to 26.8 | major revision, kept in 73 % (borderline) | 23.9 % |
| H2 | 2 | 49.0 % | 36.7 to 56.9 | new generation, 100 % | 49.0 % |
| ALL | 19 | 60.9 % | 46.5 to 70.5 | new generation, 100 % | 72.9 % |

Back-test: 8 of 8 anchors, 7 of 7 independent; model `789fcb7624b8`.

## 5. Forbidden-list checklist

* Every figure is the engine's or a count of the backend's rows; the matrix's axes are two raw
  figures and the page says there is no composite score; the model hash and "assumption, not
  calibrated" sit on every effort block, the packages and the sheet; the builder's result names
  the API and that nothing is stored.
* No em or en dash, emoji, exclamation mark, cliché, question heading or decorative label
  (measured on 22 pages; the arrows in paths and in the link list are arrows).
* One accent: the marks, the range lines, the fills of the link matrix (one hue, by likelihood),
  the links and the current stage. Identity in the matrix by shape with a legend, never by
  colour alone; class and stability are text.
* No gradient, glow, shimmer, imagery, loader; the chart is inline SVG with hairline axes.
* Motion on interaction only (the chevron of earlier steps); nothing animates on the new pages.
* Keyboard: every link, checkbox and control reachable with a ring; tap targets at 44 px or
  more, measured, including the inline model-hash links and the presets.
* No overflow at 375 px (grids shrink below their preferred width, long names wrap, the tables
  scroll in their own box).
* No placeholder comment, hard-coded colour or figure, or new dependency.
* Team decisions: none changed silently; D-084 records what this step settled. The builder
  moving forward from step 18 is noted in plan 08.

## 6. Decisions

D-084 in `plan/decisions.md`.

## 7. Not done, and open for the team

1. **Stage 5 has no page** and the gate G2 controls stay disabled (step 17: the live mode with
   decisions through server actions, the decision record and the timeline, the export).
2. **The builder needs the running API**; on a machine without it the page shows the stored
   packages and the sentence. A snapshot cannot hold every combination.
3. **No composite priority score.** The matrix's vertical axis is the primary finding's
   complaint rows, a proxy the hint names; the Phase 5 components (reach, severity, 2030 market
   weight, evidence confidence) are the backend's request P1 of plan 08.
4. **`GET /effort/model` lacks three parameters** of the model file (carryover factor,
   propagation reference impact, the platform rule's floor); the sheet says so. A one-line
   backend addition would complete the sheet.
5. **The link matrix fills by likelihood only**; the impact is text. A second channel for the
   impact would need a second encoding, which the one-hue rule argues against; the list beneath
   carries both.
6. **The analyst's brief** (step 18) still waits on the analyses endpoints; the committed sample
   could be read meanwhile.
7. The snapshot's `content/effort.json` is global while `content/workspace/*.json` is per scope;
   the test ignores the file in the per-scope check by name.
