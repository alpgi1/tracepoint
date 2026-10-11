# Step 17 (UI track) – The live mode, gate G2 decisions, and stage 5 Documentation with the CSV export

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured in both modes; step 18 (the analyst brief) waits on the backend's analyses endpoints |
| Track | Frontend, in parallel with the backend track; no backend code touched. The local backend ran from the rebased `main` |
| Plan | `plan/08-engineering-workbench-plan.md` (version 0.5), step 17 |

## 1. What the team asked for

Continue with plan 08: UI step 17, the live mode (reads from the running API), gate G2
decisions through server actions, and stage 5 with the decision record, the timeline and the
export. Before that, a build error on a fresh checkout ("Module not found: Can't resolve
'@/lib/data/workspace'") was to be fixed and pushed on its own.

## 2. What was done

* **The build on a fresh checkout** (commit `7127497`, pushed first). The root `.gitignore`
  rule `data/` for the backend's generated data also matched `frontend/lib/data/`, so
  `lib/data/workspace.ts` and `lib/data/effort.ts` never reached the branch in steps 14 to 16
  and every workspace page failed anywhere but on the author's machine. The folder is
  un-ignored (`!frontend/lib/data/`) and the two files are committed; the committed tree was
  type-checked in an isolated copy before the push.
* **One read for every stage** (`lib/data/workspace.ts`, D-085). `readWorkspace(vehicle, market,
  { detailOf? })` returns the snapshot, or in the live mode the snapshot with the API's current
  answers merged in: the requirement list with its gate statuses, the estimates, the packages,
  the excluded candidates (from the scope events), the requirement events kept to the scope's id
  prefix and sorted, and on a requirement page `GET /requirements/{id}`; five calls in parallel
  with a 4 s timeout each. The evidence (verbatims, study metrics, catalogue items) stays from
  the snapshot. `mergeLive` is pure and tested. Every call that fails sends the page to the
  snapshot with the reason on its source line. The read calls `connection()` first, so every
  stage body streams at request time behind a Suspense boundary in both modes: the live mode is
  a start-time setting (`TRACEPOINT_LIVE=1` on `pnpm start`), never a build-time one. The six
  pages of steps 14 to 16 (the vehicle screen, structure, the requirements index, the
  requirement page, priorities, the method sheet) were moved onto it; the source line of every
  stage is one component (`source-line.tsx`) that names the API and the time of a live read or
  the snapshot's date, the model hash, the backend code version and a fallback reason.
* **Gate G2 as a form** (`components/workspace/decision-form.tsx`, `app/actions/decide.ts`). In
  the live mode the block under "Decision at gate G2" is a form with the mandatory rationale
  and Approve, Reject and Defer as submit controls. The server action checks the id, the
  decision, the rationale (three characters, as the API demands) and the return address (a
  requirement page of this app only), forwards `POST /requirements/{id}/decision` with
  `{decision, note}` and redirects back with the outcome in the URL (`?decision=defer`, or
  `failed` with the API's reason, `invalid`, `note`, `offline`) and `#decision`. The page then
  shows the outcome as one line with the rule in the one blue, the new status, and the
  `requirement.decided` event in the history, read live. Outside the live mode the controls stay
  disabled with the sentence that names the snapshot's date, as before.
* **Stage 5, Documentation** (`/log`, `lib/workspace/log.ts`): the decision record (one row
  per requirement with status, version, the latest decision event's decision, actor, time and
  rationale, led by "n decided of m" counted as the stage bar counts it), the export link, and
  the audit trail newest first on the hairline timeline of stage 3, now shared
  (`timeline.tsx`), with the requirement id leading each item as a link. The stage bar's fifth
  stage links here. Under 600 px the timeline's time stands above the text.
* **The CSV export** (`/log/requirements.csv`, a route handler): the D2 list from the same read,
  28 columns in the API's names (the requirement's fields, the criteria, assumptions,
  uncertainties and findings joined, the engine's effort, range, class, layer and model hash,
  status and version, the latest decision with actor, time and rationale), quoted where a cell
  holds a comma, a quote or a line break, CRLF line ends, `text/csv` with a
  `Content-Disposition` that names the scope and the day of the read.
* **Copy** in `lib/site.ts` only (the live source lines, the form, the outcomes, stage 5);
  no new tokens, dependency or colour. The 21st.dev survey of the earlier steps covers the
  pieces of this one (the field style of the filters from 6.3, the timeline of 6.4, the tables
  of 6.5); no new survey was run, and nothing of the survey was pasted.
* **Tests**: `lib/data/workspace.test.ts` (the merge: lists replaced, excluded from the scope
  events, events of this scope sorted, the detail replaced, the evidence and the base
  untouched) and `lib/workspace/log.test.ts` (the latest decision per requirement, the
  timeline order, the CSV's header, row count, quoting, the decision and effort cells).

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm check` (lint, typecheck, 52 tests, build) | Clean; every workspace page a partial prerender (the shells of 133 paths prerendered), the CSV route dynamic |
| `pnpm audit:pages` on 26 pages (4 new: the log of US G60, CN G68 and EU G70, the requirement page with a notice), in the snapshot mode and in the live mode | 0 findings after one fix: the timeline's 150 px time column left 93 px for the text at 375 px, and the run ids pushed the log page 4 px over the viewport (the requirement pages' timelines overflowed their box too, without crossing it). Keyboard stops: log 40, the requirement page with the form 13 (PR-03) and 17 (IC-01) |
| Screenshots (`frontend/docs/screenshots/`, 38 states, 5 new, taken in the live mode) | The decision record before any decision, the form on PR-03, the page after the decision with the outcome line and the event, the audit trail with links, EU F70 at 1920 px |
| The live read | The source line reads "Source: the backend API at http://127.0.0.1:8000, read live on 2026-10-11 05:22 UTC; effort model 789fcb7624b8, assumption, not calibrated; backend code e06b37f" |
| One decision end to end | Defer on REQ-G60-US-PR-03 with a rationale naming the audit: the API answered, the requirement reads `deferred`, version 1; audit event 3217 by `human:pm` with before `proposed`, after `deferred`, `replayed: false` and the rationale; the backend wrote `config/decisions/requirements.jsonl` with one line (removed after the test, not committed); the page returned to `?decision=defer#decision` and showed "Decision recorded: deferred.", the status and the event; the log page read "1 decided of 20" and 41 events with the decision first |
| The fallback | With `TRACEPOINT_API_URL` pointed at a port where nothing listens: the snapshot shown, the controls disabled, the source line "The live read fell back to the snapshot; the API did not answer at http://127.0.0.1:8999: fetch failed.", first byte in 0.08 s |
| The CSV | 21 lines (the header and 20 rows), 28 columns, 20.7 KB, `requirements-G60-US-2026-10-11.csv`; the test pins the quoting and the decision cells |
| The snapshots | Re-read from the running API before the test decision: identical to the committed files apart from the time taken, so the step 16 files stay |
| Page weight | The log page of US G60 127 KB of HTML (the record table and the 40-event timeline, repeated once in the flight payload), EU F70 116 KB; the requirement page PR-03 74 KB |
| Forbidden-list checklist (section 8) | Passed, see section 5 |

## 4. Figures on screen (G60 US)

Decision record: 20 requirements, 0 decided before the test and 1 after; 40 events (20
`requirement.created` by `agent assistant:claude-opus-5-5`, 20 `effort.estimated` by
`system effort-engine`), 41 with the decision; the stage bar reads "0 decided of 20 · 40
events". The CSV's effort cells equal the stored estimates (test).

## 5. Forbidden-list checklist

* Every figure is the backend's or a count of its rows; the live source line names the API
  and the minute of the read, the snapshot line the snapshot's date; the model hash and
  "assumption, not calibrated" stay on every effort figure.
* No em or en dash, emoji, exclamation mark, cliché, question heading, "coming soon" or
  decorative label (checked on the new files and on 26 pages).
* One accent: the outcome line's rule, the links, the current stage. The outcome is a sentence
  with a rule, not a pill or a coloured box.
* No gradient, glow, shimmer, imagery, loader; the pending state of a stage is an empty shell
  with `aria-busy`.
* Motion on interaction only; nothing animates on the new page or the form.
* Keyboard: the textarea, the three controls, every link of the record and the trail reachable
  with a ring; tap targets at 44 px or more, measured, including the inline id links of the
  timeline.
* No overflow at 375 px after the timeline fix; the record table scrolls in its own box.
* No placeholder comment, hard-coded colour or figure, or new dependency.
* Team decisions: none changed silently; D-085 records what this step settled; plan 08 v0.5
  marks step 17 built and updates the two backend requests it touched.

## 6. Decisions

D-085 in `plan/decisions.md`.

## 7. Not done, and open for the team

1. **The local database of this container holds the test decision.** The backend has no undo
   (the audit log is append-only, D-026) and a re-import leaves an unchanged requirement's
   status alone, so `REQ-G60-US-PR-03` reads `deferred` on this machine's API until the
   database is rebuilt. The committed snapshots were read before the decision and carry no
   trace of it; `pnpm snapshot` must not be run against this database without a rebuild.
2. **The vehicle screen streams its body.** The hand-over from the map shows the empty shell
   for the length of the read (milliseconds with the snapshot, the five API calls in the live
   mode). If that shows, the stage bar's figures and the bridges can travel as a promise into
   the client component and resolve inside it while the drawing is already up.
3. **The events read is one call with `limit=5000`** over every requirement, kept to the scope
   on the Next.js server; the P0 request of plan 08 section 7 (a scope filter on
   `GET /events`) stands and grows more useful with every scope.
4. **The routes are the snapshot's.** A requirement the API holds but the snapshot does not
   has no page until `pnpm snapshot` runs; the live mode updates what exists, it does not add
   routes.
5. **No confirmation step and no undo on the form**, as the backend has none; the mandatory
   rationale is the one brake. A decision on a stale page (the version changed in between) is
   the API's to refuse; the page shows its reason.
6. **The actor is the backend's configured product manager** (D-014); there is no login, and
   the API stays bound to localhost (D-069) with the Next.js server as its only client.
7. **The Markdown export stays with the CLI** (`tracepoint requirements export`); the page
   offers the CSV only.
