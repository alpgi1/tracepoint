# Frontend plan v2 – from the map to the subsystem dialog

| Field | Value |
|---|---|
| Version | 2.0 (2026-10-11, UI step 13) |
| Status | Binding for the frontend track. Screens 0 to 2 are built; screen 2 changes in step 13; screens 3 to 5 are the outline for the next steps and are re-planned when they start |
| Supersedes | `06-pm-workspace-ux-spec.md` for the application shell and screens 0 to 2 (its dark theme, 3D car, stepper and gate bars are not built; see D-039, D-041, D-046, D-054). Its screens 3 to 6 (requirements review, priorities, decision board, report) stay as the later outline |
| Rules | `frontend/docs/02-forbidden-list.md` before every delivery; the team's rule set v0.2 and the effort rules 41 to 52 (`BMW_Karar_Kurallari_v0.2`, `BMW_Maliyet_Kurallari`); decisions in `decisions.md`; English everywhere (D-001) |
| Related | `frontend/docs/03-landing-map.md`, `frontend/docs/05-vehicle-drawings.md`, `frontend/docs/06-cpm-subsystems.md` (step 13), `cost/cpm_engine.py` (the effort engine the backend team is integrating) |

---

## 0. The journey in one line

Map (pick a market) → market panel (pick a vehicle) → vehicle screen (the car as a sketch beside
the **twelve CPM subsystems**) → **subsystem dialog** (what customers like there, what they
criticise, the market and competition evidence) → PM constraints and the feature set (step 14) →
effort verdict per change: adapt, major revision or new generation (step 15) → decision log and
report (step 16).

The product manager's input is only the market and the vehicle (rule 1). Everything after that is
evidence with its source, an assumption marked as such, or a decision the PM takes.

---

## 1. Principles that bind every screen

1. **Every number has a source and a date.** Figures come from `frontend/content/*.json`, generated
   by `frontend/scripts/build-content.py` and `build-cpm.py` from the baseline reports, the
   workbooks in `docs/` and the authored mappings in `config/`. No number is typed into UI code.
2. **Assumptions are labelled.** The CPM weights and links are the team's assumptions, not
   calibrated (rule 50); the theme-to-subsystem mapping is the team's; the UI says so where the
   figures appear.
3. **One palette, one accent.** White page, ink text, the one blue (D-039); hairline cards; no
   gradients, glow, glass, chips with code prefixes, status labels, decorative strips.
4. **Motion only on interaction.** Hover, click, the one map fade-in (E2) and the hand-over (E4).
   The dialog opens on a click and closes on Escape, the close control or the backdrop; with
   reduced motion every change is instant.
5. **Keyboard and assistive technology.** Every control reachable, visible focus ring, tap
   targets of at least 44 px, one h1 per page, headings in order, the dialog named by its title.
6. **Verbatims are shown as written.** Customer quotes are evidence; they are not edited, and the
   forbidden-text scan of the page audit skips quoted verbatims.
7. **Desktop only (D-042).** Audits still check overflow at 375 px, layouts are not designed for it.
8. **Nothing from the backend is faked.** Where an evidence layer has no data yet (competition for
   most subsystems, verbatims for China) the screen states that plainly, in the same words the
   China vehicle pages already use. No "coming soon".

---

## 2. Screen 0, the map (built, `03-landing-map.md`)

Dotted world map, three markets as grey layers that turn blue on hover and selection, one callout
card per market with the 2025 units, verbatims and the weakest domain or lowest study score
(D-045, D-051). The cards are the market buttons. Unchanged in step 13.

## 3. Screen 1, the market panel (built, `05-vehicle-drawings.md` 4a)

The magnified market shows its figures and one card per vehicle sold there, with the configured
car's photo (D-053). A card click hands the photo over to the vehicle screen (D-055). Unchanged.

## 4. Screen 2, the vehicle screen (built in steps 07 to 12, changed in step 13)

Header (Map chip, vehicle name and code, market, units, verbatims), the sketch (side and top
view) on the left, a 400 px column on the right.

**Step 13 replaces the right column.** "Domains by complaint share" and the themes card go; the
column carries the **CPM subsystem list** (D-062):

| Element | Content | Source |
|---|---|---|
| Heading | "Subsystems by development effort" | `lib/site.ts` |
| Hint | One sentence: weight as a share of a new vehicle's development effort, assumption not calibrated, click a subsystem for the customer and market evidence | `lib/site.ts` |
| Rows, twelve | Name; weight as "18 of 100"; a bar in the one blue whose length is the weight; the customer rows that fall in the subsystem as "428 complaints · 68 likes" (or "no classified verbatims" for China, or "no theme mapped" for a subsystem without themes) | `content/cpm.json` |
| Order | By weight, descending; ties by name | fixed |
| Row behaviour | Button with `aria-haspopup="dialog"`; hover and focus tint the row; click opens the dialog | |
| Markets without verbatims | The list stays (weights are per platform, not per market); the rows say "no classified verbatims"; the study card of step 07 stays below the list | |

The nine customer domains do not disappear: every theme keeps its domain, and the dialog shows
the domain beside each theme. The CPM list is the engineering view of the same rows (rule 41:
measure a change by its propagation, not by counting).

## 5. The subsystem dialog (step 13, D-063; three bands since revision 2, D-065)

Opens over the vehicle screen and covers most of it: width `min(1280px, 100vw - 96px)`, height
`100vh - 96px`, centred, a dimmed backdrop; the page behind is inert and does not scroll. Built on
the native `dialog` element (`showModal`), which gives the top layer, Escape, focus containment
and focus return for free; no library.

**Header (sticky while the body scrolls).** Subsystem name as the h2; the vehicle, market and
verbatim count; a second line with the weight ("10 of 100 of a new vehicle's development effort,
assumption, not calibrated") and the rows in this subsystem ("915 rows: 608 complaints, 305
likes"); the Close control (text, 44 px).

**Three bands, one hairline between, after the team's sketch.** Each band is text on the left
(heading, a one-sentence suggestion, a few-sentence summary) and the figures on the right.

| Band | Left | Right | Empty state |
|---|---|---|---|
| Liked | Suggestion: the themes to keep by the strength rule (at least 15 likes and 70 % of the theme's rows, `config/findings/findings.yaml`), or that no theme meets it. Summary: likes in rows across themes, the three leading themes with their figures | Columns rising from one baseline: likes per theme for the six most liked themes, value on each cap, theme name beneath | "No classified verbatims for this market yet." or "No likes recorded in this subsystem." |
| Disliked | Suggestion: the theme to address first (most complaints), its figures, the dominant type and whether it is a recurring complaint or an unmet need (wants at least half of the complaints). Summary: complaints in rows with the defect / difficult to use / wants split, the share the three leading themes carry | Columns hanging under one baseline: complaints per theme for the six most criticised themes, theme name above, value beneath | as above, with "No complaints recorded in this subsystem." |
| Market analysis in {market} | A count line (statements, market and competitor) and how the evidence level is set | The sourced statements: statement with its kind, the source as a link, date, primary or secondary, evidence level, basis, the note, a contradiction as For and Against | "No market or competitor source for {market} is registered yet for this subsystem. Competitor and regional sources are Phase 2 of the master plan." |

The suggestion and the summary are **template text derived from the counts and the finding
rules** (`basis: derived` in the content), so every sentence is checkable against the chart beside
it; the backend's agent writes the same two fields (`basis: agent`) when it exists. The columns
follow the chart rules: one series in the one blue, 20 px wide, rounded at the data end and square
at the baseline, values and names in ink, no legend, no axis (six values, all labelled). Likes and
complaints share no colour difference: direction and the heading carry the polarity.

**States.** With verbatims and market rows (US G60 Powertrain), with verbatims and no market
rows (most), without verbatims and with market rows (CN G68 Interior / console: the fridge
evidence with its contradiction), without either (CN Seats). All three bands fit a 1440 by 900
viewport without scrolling; the body scrolls natively if a market has many rows.

**Motion.** Open: 200 ms fade and 8 px rise, backdrop fade; close: 160 ms. Interaction-bound,
so no exemption is needed; none under reduced motion.

**Keyboard.** Tab reaches the rows; Enter or Space opens; inside the dialog Tab moves over the
Close control and any source links, then to the browser's own UI and back into the dialog (native
modal behaviour; the page behind is inert and never receives focus); Escape closes and focus
returns to the row that opened it.

## 6. Data for screen 2 and the dialog

| File | What | Who maintains |
|---|---|---|
| `config/cpm/subsystems.yaml` | The twelve subsystems: key, name, scope sentence, weight W (sum 100), direct links with likelihood L and impact I, the certification trigger set, the thresholds; all values from `cost/cpm_engine.py`, marked as assumptions | Team (engineering values); the backend engine reads the same file |
| `config/cpm/theme_subsystem_map.yaml` | Every canonical VFC level-2 theme (225) assigned to one subsystem or to none (`null`: accessories, general enquiry, owner's manual) | Team; the assistant's first mapping is an assumption to be checked by a mentor |
| `config/cpm/market_context.yaml` | Market and competitor statements per market and subsystem with source, date, primary or secondary, level, note, contradiction, basis. First content: the four web rows of the rule set v0.2 (EU, CN and US powertrain shares; the China fridge) | Team; Phase 2 research agents append |
| `frontend/content/cpm.json` | Generated by `frontend/scripts/build-cpm.py` from the three files above, the feedback workbooks and the baseline reports: the subsystems, and per vehicle × market (the four baselines) each subsystem's rows, likes, complaints, liked themes with quotes, criticised themes with quotes, market rows | `pnpm content` |

The suggestion and summary of each block are template sentences from the counts and the finding
rules until the backend's agent writes them (same fields, `basis` tells which). Counting follows
the baseline reports exactly (classification rows of the workbooks; the gap
labels of D-056 are not in the committed baselines and therefore not here; the build follows the
baselines when they are regenerated). Quotes prefer Sources A, B and D over the survey answers
of Source C, texts between 40 and 240 characters, deterministic order by id.

## 7. API contract for the backend team (reads like the content file)

The frontend reads `content/cpm.json` today and swaps to these endpoints when they exist; the
TypeScript types in `frontend/lib/content/cpm-types.ts` are the contract.

| Endpoint | Returns | Frontend type |
|---|---|---|
| `GET /cpm/subsystems` | The twelve subsystems with weight, links, certification trigger, thresholds, method note | `CpmSubsystem[]`, `CpmMethod` |
| `GET /cpm/{vehicle}?market={market}` | Per subsystem: `rows`, `likes`, `complaints`, `themes` (count); `liked` and `criticised` blocks, each with `narration` (`suggestion`, `summary`, `basis` derived or agent) and `themes[]` (figures and `quotes[]` with `id`, `evidenceRef`, `text`, `source`, `powertrain`); `market[]` evidence rows | `CpmView`, `CpmBlock`, `CpmNarration` |
| `POST /cpm/effort` (step 15) | For a change (subsystem, own impact, carryover): effort percent, low and high scenario, class (adapt, major revision, new generation), the affected subsystems with their risk | `CpmEffort` (defined in step 15) |

Every quote carries `evidenceRef` in the backend's form (`verbatim:G60-1249`) so the evidence
drawer of the later screens resolves it through `GET /verbatims/{id}`.

## 8. Next screens (outline, re-planned when they start)

| Step | Screen | What | Rules |
|---|---|---|---|
| 14 | PM constraints | A comment box on the vehicle screen; the text becomes a constraint (exclude, require, prefer), each reversible, with the parameters it changed listed | 26 to 30 |
| 15 | Feature set and effort verdict | The proposed feature set for the market and series (powertrain first by market share, comfort features by tier), each change classified K0 to K3 with its effort percent from the engine and the verdict adapt / major revision / new generation with the thresholds visible and editable | 11, 14 to 25, 41 to 52 |
| 16 | Decision log and report | The chronological log of constraints, rules applied and PM changes; the report with every figure's source | 38 to 40 |

## 9. Verification per step

`pnpm check` (lint, typecheck, tests, build); `pnpm audit:pages` on the eight pages, including
the open dialog on the vehicle pages; `pnpm shots`; the forbidden-list checklist; a step report
under `reports/` with what was not done.
