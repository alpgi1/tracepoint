# Step 15 (UI track) – Stage 3, the requirement page, and the bridges from the vehicle screen

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured; rebased onto main after the backend's step 16 (the CPM endpoints of plan 08 section 7 now exist); stages 4 and 5 follow in steps 16 and 17 of plan 08 |
| Track | Frontend, in parallel with the backend track; no backend code touched. The local backend of step 14 was read again for the snapshots |
| Plan | `plan/08-engineering-workbench-plan.md` (version 0.3), step 15 |

## 1. What the team asked for

Continue with the proposals of plan 08: UI step 15, the requirement page (criteria, evidence,
CPM effort block and footprint) and the three bridges from the vehicle screen into the tool.

## 2. What was done

* **Snapshot grown** (D-083). `pnpm snapshot` now also reads `GET /requirements/{id}` for every
  requirement and the evidence its findings reference, unchanged: `GET /verbatims/{id}` for every
  cited verbatim, the cited rows of `GET /studies` (peers and other markets included) and of
  `GET /equipment?vehicle=`. The types mirror them (`RequirementDetail`, `FindingDetail`,
  `EvidenceRow`, `Verbatim`, `StudyMetric`, `EquipmentItem`). Per scope with a requirement set the
  file is now about 1 MB (G60 US: 313 verbatims, 18 metrics, 13 catalogue items); it is imported
  by server components only.
* **Stage 3, Requirements definition.** The index (`/requirements`): the scope's requirements
  grouped by customer domain with the criteria count and how many rest on evidence, each row a
  link. The requirement page (`/requirements/[id]`, one static route per requirement, 57 today):
  breadcrumb; the title; the facts (proposal 1 or 0 with the rationale, horizon with the
  rationale, domain, markets, evidence level, status and version); the statement; the acceptance
  criteria table with the basis of each; the evidence: the linked findings by role as accordion
  rows (the primary open) with the backend's statement, its figures labelled per kind, its links
  to other findings, and every evidence row it linked, verbatims as written in a blockquote with
  their id, source, country, powertrain, classification and workbook row, study attributes with
  mean and shares, catalogue items with availability, counts and references; assumptions and
  uncertainties; the **CPM effort block**: the lead line (effort, P5 to P95, class, stability,
  size, layer, certification add-on), the change profile, the footprint over the vehicle's twelve
  subsystems (the weight as the track, the propagated risk as the fill, the effort it adds and the
  share of the subsystem's work as text, the strongest path as "via HV battery, E/E
  architecture"), the catalogue scan, the flags with rule numbers, the model hash; the **gate G2
  controls** (Approve, Reject, Defer) disabled with the sentence that a decision needs the running
  API and that the page reads a snapshot of a named time; the **history** as a hairline timeline
  of the requirement's audit events. The stage bar links stage 3; the ids on stage 2 link to the
  pages.
* **The three bridges** on the vehicle screen (plan 08 section 3.1): each CPM row carries "2
  requirements start here · reached by 5 · up to 4.6 %" from the scope's estimates; the subsystem
  dialog gains a fourth band, "Requirements that change {subsystem}", listing those that start
  there and those the change propagates into, each a link to its page, with a link to stage 2
  filtered to the subsystem; under the disliked suggestion the requirements citing the
  subsystem's criticised themes, theme by theme. Scopes without a requirement set say so in all
  three places. The bridge data is computed on the server and handed to the list as six fields
  per requirement line.
* **21st.dev survey** (`frontend/docs/01-research-notes.md` 6.4): 14 queries, 138 demos, 13
  contact sheets. Methods taken and rewritten with the tokens: the breadcrumb with a slash
  (Origin UI), the vertical table for the facts, the hairline table for the criteria, the quote
  card for the verbatims (without its coloured dot), the accordion rows for the findings, the
  timeline for the history (without cards or images), the bordered button group with a disabled
  state for the gate controls. Bar charts and animated path tracing rejected for the footprint
  and the path. Nothing installed.
* **Skills used**: `dataviz` for the footprint rows (one hue, thin marks, the value as text, the
  weight as the track so a fill is always read against its subsystem).
* **Audit tools**: five stage-3 pages added to the page audit; five screenshot states added.
  `frontend/docs/07-workspace.md` section 4a documents stage 3 and the bridges; `06-cpm-subsystems.md`
  points to it; `frontend/README.md` updated.

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm check` (lint, typecheck, 34 tests, build) | Clean; 100 routes (57 requirement pages, 7 indexes, the rest as before) |
| `pnpm audit:pages` on 18 pages | 0 findings after two fixes found by the first run (the inline links of bridge 3 were 14 px tall and the finding ids did not wrap at 375 px). Keyboard stops: requirement page 10 (IC-01) and 6 (PR-03), index 40, the dialog 11 on US G60 (the fourth band's links) |
| Screenshots (`frontend/docs/screenshots/`, 29 states, 5 new) | The index, the seats requirement IC-01 in full, the battery requirement PR-03 scrolled to the effort block, the Seats dialog scrolled to the fourth band, the vehicle screen with the requirement lines; the vehicle and dialog states retaken |
| Evidence resolution | Every evidence row of the three scopes resolves to a verbatim, a metric, a catalogue item, a count or a finding (test); no "reference not in the snapshot" on the pages |
| Footprint against the engine | PR-03: HV battery 10.0 % at risk 1.0, Body/structure 7.6 % at 0.42 via HV battery, Seats 0.1 % via HV battery, Body/structure, Interior/console; the sum of the subsystem shares never exceeds the requirement's effort (test) |
| Bridges against the data | Seats on G60 US: IC-01 and IC-03 start there, eight requirements propagate into it, PR-03 the largest at 49.0 %; HV battery: only PR-03 starts there; the MSA theme cites PR-01 (tests) |
| Page weight | Requirement page IC-01 HTML 107 KB (22 verbatims and the flight payload that repeats the page once); the index 47 KB; the vehicle page grew from 124 KB to 149 KB, since the bridge lines of all twelve subsystems travel with the page for the dialog |
| Forbidden-list checklist (section 8) | Passed, see section 5 |

## 4. Figures on screen (G60 US)

| Requirement | Findings (evidence rows) | Criteria (on evidence) | Effort | Footprint |
|---|---|---|---|---|
| REQ-G60-US-IC-01 seats | 5 (22) | 4 (3) | 4.6 %, adapt, K1, size S | starts in Seats (25 % of its 5); reaches Software/HMI 2.2 %, E/E 0.8 %, Thermal 0.4 % |
| REQ-G60-US-PR-03 range | 1 (9) | 2 (0) | 49.0 %, new generation, K3, certification add-on | starts in HV battery (100 % of its 10); reaches ten subsystems, Body/structure 7.6 % and Software/HMI 4.5 % the largest |

Bridges: Body/structure reached by 5, up to 49.0 %; Software/HMI 11 start there, reached by 7;
HV battery 1 starts there.

## 5. Forbidden-list checklist

* Every figure is a field of the API's response or a count of rows; the source line names the
  snapshot's time and the backend code version; the effort block names the model hash with
  "assumption, not calibrated"; criteria carry their basis; verbatims are shown as written under
  E5 (blockquote, excluded from the text scan).
* No em or en dash, emoji, exclamation mark, cliché, question heading or decorative label in UI
  copy (measured on 18 pages; the arrows in the footprint paths are arrows, not dashes).
* One accent: the current stage and view, the links, the bars, the chevron on hover. No status
  pills, no colour-only state (class and level are text).
* No gradient, glow, shimmer, imagery, loader; the gate controls are disabled with the reason, not
  hidden behind "coming soon".
* Motion on interaction only (the chevron, 180 ms); none under reduced motion.
* Keyboard: every link and control reachable with a ring; tap targets at 44 px or more, measured,
  including the inline bridge links.
* No overflow at 375 px (the tables scroll in their own box; long ids wrap).
* No placeholder comment, hard-coded colour or figure, or new dependency.
* Team decisions: none changed silently; D-083 records what this step settled.

## 6. Decisions

D-083 in `plan/decisions.md` (D-081 and D-082 were taken by the backend track the same day: the CPM subsystem view and the endpoints `GET /cpm/{vehicle}`, `GET /effort/model`, `POST /effort/estimate`, `GET /requirements/{id}/effort`, backend step 16).

## 7. Not done, and open for the team

1. **Stages 4 and 5 have no page** (step 16: priorities and the CPM method sheet; step 17: the
   live mode with gate G2 decisions and the log). The gate controls on the requirement page are
   disabled until step 17.
2. **Snapshot size.** About 1 MB per scope with a requirement set, mostly the requirement details
   (each finding carries its own events and links) and the verbatims. It stays on the server. If
   the repository size matters, the script could leave the finding events out; they are not shown.
3. **The analyst's brief is still not on stage 2**; reading `reports/analysis/G60_US.json` needs
   no endpoint and remains the cheapest next gain.
4. **Equipment prices are not shown.** The catalogue items carry a German price; the page shows
   name, code, section and availability only, since no currency appears anywhere in the tool
   (rule 49). If the team wants the price as catalogue context, it is one line in
   `evidence-list.tsx`.
5. **Bridge 3 relies on the backend's finding title convention** ("{theme}: …"). A title change
   on the backend would silently empty the line; the test on the MSA theme would catch it.
6. **The backend delivered the P0 and P1 CPM endpoints while this step was in work** (backend
   step 16, D-081): `GET /cpm/{vehicle}?market=`, `GET /effort/model`, `POST /effort/estimate`,
   `GET /requirements/{id}/effort`. Nothing here uses them yet: the snapshot still reads
   `GET /effort/requirements`, and the CPM view still comes from `content/cpm.json`. Step 16 (the
   priorities and the package builder) is where `POST /effort/estimate` enters; swapping
   `content/cpm.json` for `GET /cpm/{vehicle}` in the snapshot is a small follow-up, once the
   counting basis (`labels=given`) is confirmed equal, which the backend's report says it is.
   Still open on the backend: `GET /analyses`, the scope filter on `GET /events`, the export.
