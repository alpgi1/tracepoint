# The CPM subsystem list and the subsystem dialog

| Field | Value |
|---|---|
| Date | 2026-10-11, step 13 |
| Status | Built and verified (D-073, D-074, D-075); dialog revised to three bands the same day (D-076) |
| Files | `config/effort/model.yaml` (the engine's model, read), `config/cpm/theme_subsystem_map.yaml`, `config/cpm/market_context.yaml` (inputs), `scripts/build-cpm.py` (pipeline), `content/cpm.json` (output), `lib/content/cpm-types.ts` (the contract), `lib/content/cpm.ts` (loader), `components/workspace/cpm-list.tsx`, `components/workspace/cpm-dialog.tsx`, `components/workspace/vehicle-workspace.tsx`, `lib/site.ts` (copy), `app/globals.css` (step 13 block), `lib/content/cpm.test.ts`, `tools/audit/page-audit.mjs` (dialog pass), `tools/audit/screenshots.mjs` |
| Plan | `plan/07-frontend-plan.md` sections 4 to 7 |

## 1. What it is

The vehicle screen's right column lists the vehicle's **twelve subsystems** of the Change
Prediction Method (Clarkson, Simons, Eckert 2004), the method behind the backend's effort engine
(`backend/tracepoint/effort/cpm.py`, model in `config/effort/model.yaml`): body/structure,
powertrain, chassis, HV battery, software/HMI, E/E architecture, interior/console, exterior
design, thermal/HVAC, seats, charging, paint/color (names as the model writes them). The F70
shows ten: the model keeps HV battery and charging off it. Each row carries the subsystem's **weight** (its share of a new vehicle's development
effort; the twelve sum to 100) and the classified verbatim rows whose themes fall in it. A row
opens the **subsystem dialog** with what customers like there, what they criticise, and the
market and competition evidence for the selected market.

The nine customer domains of steps 07 to 12 are not gone: every theme keeps its domain, shown
beside it in the dialog. The CPM list is the engineering view of the same rows (effort rule 41:
a change is measured by how it propagates, not by counting changes).

## 2. Inputs and their status

| Input | Content | Status |
|---|---|---|
| `config/effort/model.yaml` (the backend engine's model, D-062) | Key, name, weight with its basis, direct links (likelihood, impact, the interface behind each), certification, thresholds, and per vehicle the subsystems the model keeps off it (F70: HV battery and charging, FAAR platform) | **Assumption, not calibrated** (effort rule 50), maintained by the backend track and engineering; the frontend reads it and keeps no copy. A vehicle's weights are renormalised to 100 over the subsystems present, as the engine does |
| `config/cpm/theme_subsystem_map.yaml` | Every canonical level-2 theme (225) assigned to one subsystem or to none (accessories, general enquiry, owner's manual) | **Assumption**: the assistant's first mapping; principle: functions to software / HMI, sensor and connectivity hardware to E/E, cockpit controls to interior / console, closures and glazing to body. Paint / colour has no theme in the taxonomy and shows "no theme mapped" |
| `config/cpm/market_context.yaml` | Market and competitor statements per market and subsystem: statement, kind, source (title, URL, date, primary or secondary), level, basis, note, contradiction | The four web rows of the team's rule set v0.2 (EU, CN, US powertrain shares; the China fridge), with the verification notes written there. Every other market × subsystem pair is empty and says so |
| `docs/<vehicle>_feedback_hackathon.xlsx` | The classified rows: feedback type, level-2 theme, country, powertrain, text | Read as in the baseline reports; the gap labels of D-056 are not in the committed baselines and are therefore not counted here either |

## 3. Pipeline (`pnpm content`, second step `scripts/build-cpm.py`)

1. Validates the inputs: every canonical theme named exactly once, the model's weights sum to
   100, every link and every market row names a known subsystem.
2. Reads the workbooks and keeps the rows with a canonical level-2 theme; a row's market comes
   from its country through `config/markets.yaml` (Canada counts to the US market, as in the
   backend).
3. For every vehicle × market pair of `content/markets.json`: checks that the classified rows
   equal the baseline report's figure (`classification_rows` minus `unclassified_rows`) and stops
   if they differ; a pair without a baseline report is shown as empty, even if the workbook holds
   rows for it (EU G70: 33 rows withheld, said so in `rowsSource`), so the list and the header's
   verbatim count never disagree.
4. Per subsystem present on the vehicle (rows of a subsystem the model keeps off the vehicle are
   counted apart and named in the list's footnote): rows, likes (feedback type Likes) and
   complaints (Defect, Difficult to Use, Wants); the themes ranked by likes and by complaints (up to six each) with up to two verbatims
   each: one per verbatim id, sources other than the survey (Source C) first, texts of 40 to 240
   characters, ordered by id, longer texts cut at 300 characters with an ellipsis as the backend
   does. Rows whose theme is unassigned are counted as `unassignedRows`.
5. Per block a **narration**: a one-sentence suggestion and a few-sentence summary as template
   text from the counts and the finding rules of `config/findings/findings.yaml` (`basis:
   derived`). Liked: the themes to keep by the strength rule (at least 15 likes and 70 % of the
   theme's rows) or that none meets it; the leading three themes with their figures. Disliked:
   the theme to address first with its figures, the dominant type, recurring complaint or unmet
   need (wants at least half of the complaints); the complaint split and the share of the three
   leading themes. Every sentence can be checked against the columns beside it. The backend's
   agent writes the same two fields with `basis: agent`.
6. Writes `content/cpm.json` (seven views, about 400 KB). The vehicle page, a server component,
   passes only its own view to the browser: the view is 3 KB (China, no verbatims) to 86 KB
   (US G60) of the page's HTML, which measures 30 KB to 124 KB in total; the quotes are the
   larger part and are kept for the later evidence drawer.

Cross-check in `lib/content/cpm.test.ts`: the theme figures agree with `content/markets.json`
(rows, complaints, defects of every top complaint theme), likes plus complaints never exceed
rows, every quote carries `verbatim:<id>`, every market row a date, a type and a level.

## 4. The list (`cpm-list.tsx`)

One hairline card: heading, the one-sentence hint (what the weight is, that it is an assumption,
what a click does), twelve rows ordered by weight, a footnote with the unassigned rows and the
mapping note. A row is a button (`aria-haspopup="dialog"`, 44 px or more): name, "18 of 100",
a 3 px bar in the one blue whose length is the weight, and "428 complaints · 68 likes" (or "no
classified verbatims" where the market has none, or "no theme mapped to this subsystem"). Hover
tints the row; nothing else moves. Markets without verbatims keep the list (weights are per
platform) and the study card of step 07 below it.

## 5. The dialog (`cpm-dialog.tsx`, three bands since D-076)

* **Native `dialog`, `showModal()`.** The browser provides the top layer, Escape, focus
  containment (the page behind is inert) and the return of focus to the row. The React state
  `openKey` drives `showModal` and `close` through an effect; the element's `close` event
  clears the state; a click on the backdrop (the dialog element itself) closes. Nothing is
  installed. The last shown subsystem stays rendered while the dialog fades out.
* **Size.** `min(1280px, 100vw - 96px)` by `100vh - 96px`, centred; the backdrop is ink at a
  third (`--veil`); `body:has(dialog[open])` stops the page from scrolling. The three bands fit
  a 1440 by 900 viewport without scrolling.
* **Header, sticky.** The subsystem name (h2, the dialog's accessible name); vehicle, market and
  verbatims; the weight with its note and the rows in this subsystem; the Close control.
* **Band Liked.** Left: the suggestion (what to keep, by the strength rule, or that nothing
  meets it) and the summary. Right: columns rising from one baseline, likes per theme for the
  six most liked themes, the value on each cap, the theme name beneath.
* **Band Disliked.** Left: the suggestion (what to address first, its figures, the dominant
  type, recurring complaint or unmet need) and the summary. Right: columns hanging under one
  baseline, complaints per theme for the six most criticised themes, the name above, the value
  beneath.
* **Band Market analysis.** Left: a count line (statements, market and competitor) and how the
  evidence level is set. Right: the sourced statements as a hairline list: statement with its
  kind, the source as a link (44 px), date, primary or secondary, evidence level, basis, the
  note, and a contradiction as For and Against. Empty state: "No market or competitor source for
  {market} is registered yet for this subsystem. Competitor and regional sources are Phase 2 of
  the master plan."
* **Columns** (`ThemeBars`): one series in the one blue, 20 px wide, 4 px rounded data-end and
  square at the baseline, a 96 px track scaled to the chart's maximum, six slots always so the
  pitch and the baseline are the same in every chart, values and names in ink tokens, no legend
  (one series) and no axis (every value is labelled). Polarity is carried by the direction and
  the heading, not by a second colour.
* **Empty states.** "No classified verbatims for this market yet.", "No likes recorded in this
  subsystem.", "No complaints recorded in this subsystem."
* **Motion.** 200 ms fade and 8 px rise on open, 160 ms on close, through `@starting-style` and
  `transition-behavior: allow-discrete`; none under reduced motion.

## 6. The contract with the backend (`lib/content/cpm-types.ts`)

The types mirror `content/cpm.json` and are the shape of `GET /cpm/subsystems` (the catalogue)
and `GET /cpm/{vehicle}?market=` (one `CpmView`). `lib/content/cpm.ts` is the one module to swap
when the endpoints exist; the page is a server component, so the swap does not touch the client.

## 7. Verification (step 13)

| Check | Result |
|---|---|
| `pnpm check` | Clean: lint, typecheck, 17 tests (9 new), build |
| `pnpm audit:pages`, eight pages | 0 findings; 13 keyboard stops on vehicle pages (Map, twelve rows); in the dialog 2 stops (Close and the source link) where market rows exist, 1 otherwise; Tab after the last control reaches the browser's own UI and the next Tab returns into the dialog, never the inert page; Escape closes and focus returns to the row |
| Forbidden-text scan | Runs on the open dialog too, with quoted verbatims left out (they are customer text, shown as written) |
| Screenshots | `docs/screenshots/dialog-*.jpg`: US G60 Software / HMI, US G60 Powertrain (with a market row), CN G68 Interior / console (no verbatims, the fridge evidence with its contradiction), EU F70 Seats at 1920 px (two liked themes in six slots) |

## 8. Honesty notes

* Every figure in the list and the dialog is a count of classification rows of the workbooks,
  reconciled with the baseline reports, or a value of the configuration files with its source.
* The weights, links and the theme mapping are assumptions and are called that on screen.
* Market evidence exists for four market × subsystem pairs; the other 32 pairs say that no source
  is registered. Nothing is shown as "coming soon".
* Verbatims are not edited; the survey answers of Source C keep their question prefix. The
  dialog's second revision shows no quotes; they stay in the content for the evidence drawer.
* The suggestion and the summary are derived sentences: each names the rule it applies and the
  figures it rests on, so a reader can check it against the columns beside it.
