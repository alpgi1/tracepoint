# Step 13 (UI track) – Frontend plan v2, the CPM subsystem list and the subsystem dialog

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured; the backend's CPM endpoints are being built in parallel and the frontend reads a generated content file until they exist |
| Track | Frontend, in parallel with the backend track; no backend code touched. New shared inputs under `config/cpm/` |

## 1. What the team asked for

Rewrite the frontend plan from the start and code against it. On the vehicle screen, replace
"Domains by complaint share" with the twelve-item list of the CPM effort engine (the subsystem
and weight table of the team's effort documents); a click on a category opens a popup over most
of the screen with three blocks: what customers like about the components in that category, what
they dislike, and the market competition analysis of the selected model for that category. Use
21st.dev components where they fit, keep to the repository's rules, no AI slop.

## 2. What was done

* **Plan v2** (`plan/07-frontend-plan.md`, D-075): the journey from the map to the subsystem
  dialog and the next screens (PM constraints, feature set with the effort verdict, decision log
  and report), the principles, the list and dialog specification, the data files, and the API
  contract for the backend team (`GET /cpm/subsystems`, `GET /cpm/{vehicle}?market=`, later
  `POST /cpm/effort`), mirrored by `frontend/lib/content/cpm-types.ts`. It supersedes
  `06-pm-workspace-ux-spec.md` for the shell and screens 0 to 2.
* **Shared inputs** (`config/cpm/`): the mapping of all 225 level-2 themes to a subsystem (three
  left unassigned) and the market and competitor evidence file, first filled with the four
  sourced web rows of the rule set v0.2 (EU, CN and US powertrain shares, the China fridge with
  its contradiction). The subsystem weights and links come from the backend engine's
  `config/effort/model.yaml` (see 2b; this step's own copy was dropped at the merge).
* **Content build** (`frontend/scripts/build-cpm.py`, run by `pnpm content`): per vehicle × market
  every subsystem's rows, likes and complaints, the themes customers like and criticise with two
  verbatims each (id, source, powertrain), and the market rows. The counts are reconciled with the
  baseline reports and the build stops on a difference; eight new tests pin the contract and the
  agreement with `content/markets.json`.
* **The list** (D-073, `cpm-list.tsx`): twelve rows by weight, "18 of 100" with a bar in the one
  blue, "428 complaints · 68 likes"; the hint says what the weight is and that it is an
  assumption; a footnote gives the unassigned rows. China keeps the list (weights are per
  platform) with "no classified verbatims" and the study card below.
* **The dialog** (D-074, `cpm-dialog.tsx`): native `dialog` with `showModal`, most of the
  viewport, sticky header with the name and Close, a facts list (weight, scope, customer rows
  with a partition bar, "A change here propagates to" with likelihood and impact), likes and
  criticisms side by side with the verbatims as quotations, the market and competition table
  (statement, source with date and type, evidence level, basis, note, contradiction as For and
  Against) or the plain statement that no source is registered for that market and subsystem.
* **21st.dev survey** (`frontend/docs/01-research-notes.md` 6.2): 29 queries, 214 demos, 24
  previews on contact sheets. Methods taken: the scrolling dialog with a sticky header, the
  two-column comparison with one hairline, the hairline evidence table, the key-value facts
  list, the partition bar. Nothing installed; the native element gives what the library dialogs
  add on top of a div.
* **Audit tools**: the page audit now opens the dialog on every vehicle page and checks its name,
  headings, tap targets, a keyboard tour that must never reach the inert page, Escape and the
  return of focus; the forbidden-text scan leaves quoted verbatims out (exemption E5). Four
  dialog states were added to the screenshots.

## 2a. Revision 2 the same day: three bands (D-076)

The team found the dialog too long and sketched three sections: Liked and Disliked, each with a
heading, a suggestion in one sentence, a summary in a few sentences and a chart of the themes
(bars rising for likes, hanging for dislikes); and Market analysis below. Built as sketched:

* The quote lists and the facts list are gone; the header carries the weight and the rows.
* **Suggestion and summary** are template sentences derived from the counts and the finding
  rules (`config/findings/findings.yaml`): Liked names the themes that meet the strength rule
  (at least 15 likes and 70 % of the theme's rows) or says none does; Disliked names the theme
  to address first with its figures, the dominant type and whether it is a recurring complaint
  or an unmet need. The content marks them `basis: derived`; the backend's agent writes the same
  fields later. Every sentence names its rule and its figures, so it is checkable on the spot.
* **Columns**: one series in the one blue, 20 px, rounded at the data end, values on the caps
  and names in ink, six slots in every chart. The sketch's green and red were not taken: a
  second and third accent would break D-039 and colour alone may not carry information; the
  direction and the heading carry the polarity. If the team wants the two hues, it is two tokens.
* The market band keeps the sourced statements as a compact list beside a count line.
* All three bands fit a 1440 by 900 viewport without scrolling.

## 2b. Merge with main: one effort model, decisions renumbered

While this step was in review, `main` received the backend's effort engine (step 12, D-062 to
D-064), the analyst loop (steps 13 to 15, D-065 to D-072) and the bridge plan
`plan/05-effort-market-layer-and-domain-panel.md`; the branch was merged and this step's
decisions moved to D-073 to D-076.

* **One source of truth.** The backend's `config/effort/model.yaml` carries the same twelve
  weights and 28 links as the `config/cpm/subsystems.yaml` of this step, plus the basis of each
  weight, the interface behind each link and per-vehicle applicability. The frontend file was
  deleted; the content build reads the engine's model, names the subsystems as the model does
  (`Body/structure`, `Paint/color`) and follows its rule that the F70 has no HV battery and no
  charging subsystem: the F70 list shows ten rows with the weights renormalised to 100 and a
  footnote naming the two left off and the 22 rows that fall in them.
* **API alignment.** The backend already serves `GET /effort/model`, `POST /effort/estimate`,
  `GET /effort/scenarios` and the effort of a requirement; the plan's contract table now names
  them. The view endpoint this frontend reads from the content file stays a proposal
  (`GET /cpm/{vehicle}?market=`), and the backend's bridge plan proposes a different panel
  payload (`GET /workspaces/{vehicle}/{market}`, one object per domain).
* **Open conflict for the team.** The bridge plan argues for the nine customer domains as the
  rows and the subsystems as the effort footprint of each candidate, with a slide-over of three
  tabs; the team's brief for this step asked for the twelve subsystems as the rows and a centred
  dialog, which is what is built. Both rest on the same rows (every theme keeps its domain), so
  either table can be derived from the same content. The two plans state the conflict; the team
  decides.

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm check` (lint, typecheck, 17 tests, build) | Clean, after revision 2 as well |
| `pnpm audit:pages` on `/` and the seven vehicle pages | 0 findings; 13 keyboard stops on vehicle pages (Map and the twelve rows); 2 stops in the dialog where market rows exist (Close, the source link), 1 otherwise; Escape closes and focus returns to the row |
| Counts against the baseline reports | Classified rows equal per scope (G60 US 3,853; G70 US 3,867; F70 EU 2,191; G60 EU 165); every top complaint theme of `markets.json` matches in rows, complaints and defects (test) |
| Page weight | Vehicle page HTML 30 KB (China) to 124 KB (US G60), of which the subsystem view is 3 to 86 KB (the quotes, unused by the dialog's second revision, are the larger part); `content/cpm.json` 400 KB stays on the server |
| Screenshots (`frontend/docs/screenshots/`, 18 states, 4 new) | The list on EU F70, US G70 with a hovered row, CN G68; the dialog for US G60 Software / HMI, US G60 Powertrain (with a market row), CN G68 Interior / console (no verbatims, the fridge row with its contradiction), EU F70 Seats at 1920 px |
| Forbidden-list checklist (section 8) | Passed: every figure is a reconciled count or a sourced row; assumptions are called assumptions on screen; one accent, hairlines, no gradient, glow, glass, chips or labels; motion on click only and none under reduced motion; verbatims as written under E5 |

## 4. Figures on screen (from `content/cpm.json`)

| Scope | Rows in the twelve subsystems | Heaviest customer rows |
|---|---|---|
| US G60 | 3,816 of 3,853 (37 unassigned) | Software / HMI 915 (608 complaints), Body / structure 543, Chassis 445 |
| US G70 | 3,813 of 3,867 (54 unassigned) | Software / HMI 901 (599 complaints), Body / structure 553, Chassis 475 |
| EU F70 | 2,091 of 2,191 (100 unassigned) | Chassis 576 (98 complaints), Software / HMI 456 (359 complaints), Powertrain 370 |
| EU G60 | 163 of 165 | Chassis 36, Software / HMI 34, Body / structure 24 |
| CN G68, CN G70, EU G70 | none | market rows only (CN Powertrain and Interior / console) |

## 5. Decisions

D-073 to D-076 in `plan/decisions.md`; exemption E5 in the forbidden list.

## 6. Not done, and open for the team

1. **EU G70 has 33 classified rows in the workbook but no baseline report**, so the map, the
   header and the list all say "no verbatims yet" for it. Generating the baseline for that scope
   lights it up everywhere.
2. **The gap labels of D-056 are not counted** because the committed baselines predate them;
   when the baselines are regenerated, `pnpm content` follows (the build stops if the counts
   drift, which is the signal to look).
3. **The theme-to-subsystem mapping and the weights are assumptions.** The rows a mentor is most
   likely to move: driver assistance functions (put in Software / HMI), cameras and sensors (E/E
   architecture), wheels and tyres (Chassis), the climate control panel (Interior / console).
   Paint / colour has no theme in the taxonomy and says so.
4. **Market evidence exists for four pairs** (EU, CN, US Powertrain; CN Interior / console); the
   other 32 say that no source is registered. Phase 2 research agents append to
   `config/cpm/market_context.yaml` with the same fields.
5. **The dialog's data travels with the page** (up to 86 KB, most of it the quotes the second
   revision does not show). When the backend endpoint exists, `lib/content/cpm.ts` is the one
   module to swap; fetching the view on open, or dropping the quotes from the page payload until
   the evidence drawer needs them, would cut the page weight.
6. **The suggestion and summary are derived template text.** They are honest and checkable but
   plain; the agent's narration replaces them in the same fields. Quotes stay in the content
   (the first two by verbatim id among the readable candidates) for the later evidence drawer.
7. The three team documents supplied in the session (effort metrics pitch, rule set v0.2, effort
   rules 41 to 52) are referenced, not committed; the backend's bridge plan (section 9) says where
   they go. The engine itself is on `main` (`backend/tracepoint/effort/cpm.py`).
8. The subsystem names follow the engine's model (`Body/structure`, `Paint/color`, US spelling);
   if the team wants the UI's own spelling, it is a display mapping in the content build.
