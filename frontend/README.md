# Tracepoint frontend

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn project structure, pnpm. Node 22.

The first surface is the landing page: a dotted world map with three selectable markets (China,
United States, European Union), each carrying its figures; a selected market shows the vehicles
sold there as photos of the configured cars, and a vehicle opens its screen (`/markets/<market>/<vehicle>`),
where the car is a technical sketch beside the twelve CPM subsystems; a subsystem opens a dialog
with what customers like and criticise there and the market evidence. The vehicle screen is
stage 1 of the scope workspace; its header's stage bar leads to stage 2, Structure & context
(`/markets/<market>/<vehicle>/structure`): every potential requirement with the agent's 0/1
proposal, the views needs a decision, all and left out, filters, and the effort of each change
from the CPM engine; and to stage 3, Requirements definition (`/requirements`, `/requirements/<id>`):
the requirement with its criteria, evidence (verbatims as written), assumptions, CPM effort, and
history; and to stage 4, Prioritization (`/priorities`):
effort against customer evidence as a matrix with its table, the engine's H1, H2 and ALL packages,
a package builder that asks the backend API for any set, and the CPM method sheet
(`/priorities/method`) with the weights, the link matrix and the back-test. The CPM rows and the
subsystem dialog name the requirements that change each subsystem; stage 5, Documentation
(`/log`), holds the decision record, the audit trail and the requirement list as the backend's
exporter writes it (CSV and Markdown). Since step 19 stage 2 opens with the analyst's brief, stage 1
links to the series across its regions (`/regions`) and to the market evidence of the external
sources (`/market`), and a stage exists only where the backend holds something for the scope.
Desktop first.

**Every figure on screen is the backend's.** `pnpm snapshot` reads the running backend API and
writes its answers unchanged under `content/`; the screens read those files, and in the live mode
the API itself (`docs/07-workspace.md`, `reports/step-19-backend-frontend-integration.md`).
Documentation lives in `docs/` (start with `docs/README.md`).

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Development server (copies the world topology into `public/map/` first) |
| `pnpm build` and `pnpm start` | Production build and server on port 3400 |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | ESLint, route typegen plus `tsc --noEmit`, vitest (market outlines, classification, projection fit, vehicle drawings and zones, the CPM content, the workspace snapshots, the candidate rules, the requirement helpers, the matrix and the packages, the effort model file) |
| `pnpm check` | All of the above plus the build; must pass before a step is committed |
| `pnpm audit:pages` | Page audit in Chromium against a running server, on 30 pages: the landing page, the seven vehicle pages, six states of stage 2 (with the analyst's brief), stage 3, stage 4 with the method sheet, stage 5, the requirement page with a decision notice, three series pages and three market evidence pages: landmarks, headings, accessible names, tap targets, keyboard tour, 375 px overflow, forbidden text (quoted verbatims excepted), console errors, and the open subsystem dialog (name, headings, tap targets, keyboard tour that never reaches the inert page, Escape and the return of focus); exit code 1 on findings |
| `pnpm shots` | Screenshots of 49 states (the map, the vehicle screens, the subsystem dialog, the five stages, gate G2, and since step 19 the analyst's brief, the series across its regions at 1440 and 375 px, the market evidence, the dialog with external sources and the rules of the effort engine) into `tools/audit/out/` |
| `pnpm snapshot` | The one data feed (`scripts/snapshot.mjs`): reads the running backend API (`TRACEPOINT_API_URL`, default `http://127.0.0.1:8000`) and writes its answers unchanged: `content/markets.json` (`GET /overview`), `content/cpm.json` (`GET /effort/model` and `GET /cpm/{vehicle}` per pair), `content/effort.json` (the model and the back-test), `content/analyses/` (`GET /analyses` and every `GET /analyses/{key}/brief`) and per vehicle and market pair `content/workspace/<VEHICLE>_<MARKET>.json` (requirements, effort, packages, excluded candidates, the scope's events, the detail of every requirement with the evidence it cites, the external evidence of `GET /external`, and the requirement list of `GET /requirements/export` as CSV and Markdown). `node scripts/snapshot.mjs G60 US` refreshes one workspace file |
| `pnpm vehicles` | Regenerates the vehicle drawings (body, lines and contour masks under `public/vehicles/`, `content/vehicles/*.json`) from `assets/vehicles/sources` |
| `pnpm photos` | Regenerates the photo cut-outs of the configured cars (`public/vehicles/*-photo-side.webp`, `content/vehicles/*-photo.json`) from `assets/vehicles/photos` |

Run the audit and the screenshots against a built app started in another shell
(`pnpm build && pnpm start`). Both use the Playwright Chromium installed in this environment
(`/opt/pw-browsers/chromium`). The app goes live whenever the backend answers; start it with
`TRACEPOINT_LIVE=0` for the stored states. In the live mode the screenshots make one decision
(Defer on `REQ-G60-US-PR-03`, with a rationale that names the audit) for the states after a
decision only when `TRACEPOINT_SHOTS_DECIDE=1` is set for the script, since the backend keeps it.

## Live mode

| Variable | Default | Effect |
|---|---|---|
| `TRACEPOINT_LIVE` | unset | Unset: live whenever the backend API answers its health check (asked at most once every 5 s), the stored data otherwise, so gate G2 works as soon as the backend runs (D-106). `1`: always live. `0`: the stored data only, no decisions. In the live mode every stage page and the exports read the backend API at request time (the requirement list with its gate statuses, the estimates, the packages, the excluded candidates, the scope's events in one filtered call, the requirement on its page, the analyst's briefs, the D2 export) and merge them into the committed snapshot, whose evidence rows stay; the gate G2 controls on the requirement page become a form whose decision a server action forwards to `POST /requirements/{id}/decision`, and the package builder asks `POST /effort/estimate`. When the API does not answer, the page shows the stored data and says so in one plain line |
| `TRACEPOINT_API_URL` | `http://127.0.0.1:8000` | Where the Next.js server finds the backend API, for the live mode and `pnpm snapshot` |

Both are read when the server starts, not when it is built: `pnpm build` once, then
`pnpm start` with the backend up (`cd backend && uv run uvicorn tracepoint.api.app:app --port
8000`, or `./start.sh --api` from the repository root); Approve, Reject and Defer on a
requirement page then record the decision. Without the backend the three controls are disabled
and say that the service does not answer; a backend started later is picked up on the next page.
The browser never calls the API in either mode.

## Layout

```
app/            layout (with the hand-over layer), page, tokens (globals.css), fonts (self-hosted subsets, OFL)
  markets/[market]/[vehicle]/   the vehicle screen, stage 1 (static routes for the seven pairs)
  markets/[market]/[vehicle]/structure/   stage 2, Structure & context (the table streams behind the prerendered shell)
  markets/[market]/[vehicle]/requirements/   stage 3, the index and [id]/ the requirement page (static per requirement)
  markets/[market]/[vehicle]/priorities/     stage 4, the matrix, the packages and the builder (the estimate streams); method/ the CPM method sheet
  markets/[market]/[vehicle]/log/            stage 5, the decision record and the audit trail; requirements.csv and requirements.md, the D2 exports
  markets/[market]/[vehicle]/regions/        the series across its regions (a page of stage 1, where a series analysis covers the scope)
  markets/[market]/[vehicle]/market/         the market evidence of the external sources (a page of stage 1)
assets/vehicles/sources/        brochure pages and the press sheet the drawings come from, with README
assets/vehicles/photos/         side-profile renders of the configured cars from the BMW configurator, with README
components/
  landing/      map stage with callouts and connectors, market panel, vehicle cards (photo, hand-over)
  vehicles/     vehicle-drawing (layered sketch: wash, lines, contour), handoff-layer (the photo across the route change)
  workspace/    workspace-header and stage-bar (shared by the stages), vehicle-workspace (sketch, hand-over target), cpm-list (the twelve subsystems with the requirements that change them), cpm-dialog (four bands: liked, disliked, market analysis, requirements), candidate-filters and candidate-table (stage 2), analyst-brief, series-view and brief-parts (the backend's briefs), external-rows (the external statements), requirement-page, evidence-list and effort-block (stage 3), priority-matrix and package-table (stage 4), decision-form, timeline and source-line
  ui/           dotted-world-map (canvas map), shadcn components
content/        the backend API's answers, written by pnpm snapshot and committed: markets.json (GET /overview), cpm.json (the CPM views), effort.json (the effort model and the back-test), analyses/ (the briefs), workspace/*.json (per vehicle and market: requirements, effort, packages, excluded candidates, events, evidence, external evidence, exports); vehicles/*.json (drawing and photo sizes and boxes, from pnpm vehicles)
lib/
  content/      types, loaders, number formats; cpm-types.ts and workspace-types.ts are the contracts of the backend's endpoints
  data/         workspace.ts, the reads of the stage pages (the snapshot, the API in the live mode); analyses.ts, the briefs; exports.ts, the D2 exports; effort.ts, the effort model file and the package estimate (POST /effort/estimate in the live mode)
  workspace/    candidates (the inbox rules, filters, grouping, stage counts), requirements (routes, evidence resolution, the footprint, the bridges), priorities (the matrix points, packages, the builder's set), stages and figures (which stages exist per scope, routes and figures of the stage bar), market (the external statements per subsystem), log (the decision record and the timeline)
  map/          regions, data (topology to outlines), renderer (mask, dots, zoom, focus, highlight)
  vehicles/     drawings and photos, shared stage geometry and hand-over targets, the hand-over store, zones (unused)
  motion/       reduced-motion hook
  site.ts       metadata and copy, one place
public/vehicles/  the drawings' masks and the photo cut-outs, generated and committed
scripts/        snapshot.mjs (the data feed from the backend API), sync-map-data.mjs, vehicles/build.mjs, vehicles/photos.mjs
tools/audit/    page-audit.mjs, screenshots.mjs
docs/           research notes, forbidden list, specifications, screenshots, raw research
```

Rules that bind: `docs/02-forbidden-list.md` before every delivery; decisions in
`plan/decisions.md`; English everywhere (D-001).
