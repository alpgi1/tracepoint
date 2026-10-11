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
the requirement with its criteria, evidence (verbatims as written), assumptions, CPM effort with
the footprint over the subsystems, and history; and to stage 4, Prioritization (`/priorities`):
effort against customer evidence as a matrix with its table, the engine's H1, H2 and ALL packages,
a package builder that asks the backend API for any set, and the CPM method sheet
(`/priorities/method`) with the weights, the link matrix and the back-test. The CPM rows and the
subsystem dialog name the requirements that change each subsystem. Desktop only. Stage 5 and the
live mode follow `plan/08-engineering-workbench-plan.md`.
Documentation lives in `docs/` (start with `docs/README.md`).

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Development server (copies the world topology into `public/map/` first) |
| `pnpm build` and `pnpm start` | Production build and server on port 3400 |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | ESLint, route typegen plus `tsc --noEmit`, vitest (market outlines, classification, projection fit, vehicle drawings and zones, the CPM content, the workspace snapshots, the candidate rules, the requirement helpers, the matrix and the packages, the effort model file) |
| `pnpm check` | All of the above plus the build; must pass before a step is committed |
| `pnpm audit:pages` | Page audit in Chromium against a running server, on the landing page, the seven vehicle pages, five states of the structure page, five of stage 3, four of stage 4, three of stage 5 and the requirement page with a decision notice: landmarks, headings, accessible names, tap targets, keyboard tour, 375 px overflow, forbidden text (quoted verbatims excepted), console errors, and the open subsystem dialog (name, headings, tap targets, keyboard tour that never reaches the inert page, Escape and the return of focus); exit code 1 on findings |
| `pnpm shots` | Screenshots of the states (resting with callouts, hover, the three magnified markets with their panels, card hover, the photo on its way and fading on the vehicle screen, vehicle screens, keyboard focus, 1920 px, reduced motion, the subsystem dialog in four states, the stage bar and stage 2 in six states, stage 3 and the bridges in five, stage 4 and the method sheet in four, stage 5 and gate G2 in five) into `tools/audit/out/` |
| `pnpm content` | Regenerates `content/markets.json` and `content/cpm.json` from `reports/baseline`, `docs/*.xlsx` and `config/` (Python 3 with openpyxl and PyYAML); the CPM build stops if its counts differ from the baseline reports |
| `pnpm snapshot` | Reads the running backend API (`TRACEPOINT_API_URL`, default `http://127.0.0.1:8000`) once per vehicle and market pair and writes its responses unchanged to `content/workspace/<VEHICLE>_<MARKET>.json` (requirements, effort per requirement, the package variations, excluded candidates, events, the detail of every requirement, and the verbatims, study metrics and catalogue items its findings reference) and `content/effort.json` (the effort model and the back-test); the stage pages read these files, and in the live mode (below) the running API as well; the package builder asks the running API (`TRACEPOINT_API_URL`) at request time in both modes |
| `pnpm vehicles` | Regenerates the vehicle drawings (body, lines and contour masks under `public/vehicles/`, `content/vehicles/*.json`) from `assets/vehicles/sources` |
| `pnpm photos` | Regenerates the photo cut-outs of the configured cars (`public/vehicles/*-photo-side.webp`, `content/vehicles/*-photo.json`) from `assets/vehicles/photos` |

Run the audit and the screenshots against a built app started in another shell
(`pnpm build && pnpm start`). Both use the Playwright Chromium installed in this environment
(`/opt/pw-browsers/chromium`). In the live mode the screenshots make one decision (Defer on
`REQ-G60-US-PR-03`, with a rationale that names the audit) for the states after a decision.

## Live mode

| Variable | Default | Effect |
|---|---|---|
| `TRACEPOINT_LIVE` | unset | `1` turns the live mode on: every stage page and the CSV export read the backend API at request time (the requirement list with its gate statuses, the estimates, the packages, the excluded candidates, the events, the requirement on its page) and merge them into the committed snapshot, whose evidence rows stay; the gate G2 controls on the requirement page become a form whose decision a server action forwards to `POST /requirements/{id}/decision`. When the API does not answer, the page shows the snapshot and says so on its source line |
| `TRACEPOINT_API_URL` | `http://127.0.0.1:8000` | Where the Next.js server finds the backend API, for the live mode, the package builder and `pnpm snapshot` |

Both are read when the server starts, not when it is built: `pnpm build` once, then
`TRACEPOINT_LIVE=1 pnpm start` with the backend up (`cd backend && uv run uvicorn
tracepoint.api.app:app --port 8000`). The browser never calls the API in either mode.

## Layout

```
app/            layout (with the hand-over layer), page, tokens (globals.css), fonts (self-hosted subsets, OFL)
  markets/[market]/[vehicle]/   the vehicle screen, stage 1 (static routes for the seven pairs)
  markets/[market]/[vehicle]/structure/   stage 2, Structure & context (the table streams behind the prerendered shell)
  markets/[market]/[vehicle]/requirements/   stage 3, the index and [id]/ the requirement page (static per requirement)
  markets/[market]/[vehicle]/priorities/     stage 4, the matrix, the packages and the builder (the estimate streams); method/ the CPM method sheet
assets/vehicles/sources/        brochure pages and the press sheet the drawings come from, with README
assets/vehicles/photos/         side-profile renders of the configured cars from the BMW configurator, with README
components/
  landing/      map stage with callouts and connectors, market panel, vehicle cards (photo, hand-over)
  vehicles/     vehicle-drawing (layered sketch: wash, lines, contour), handoff-layer (the photo across the route change)
  workspace/    workspace-header and stage-bar (shared by the stages), vehicle-workspace (sketch, hand-over target), cpm-list (the twelve subsystems with the requirements that change them), cpm-dialog (four bands: liked, disliked, market analysis, requirements), candidate-filters and candidate-table (stage 2), requirement-page, evidence-list and effort-block (stage 3), priority-matrix and package-table (stage 4), no-requirements (the empty state of the stages)
  ui/           dotted-world-map (canvas map), shadcn components
content/        markets.json (figures with sources), cpm.json (subsystems, per vehicle and market the themes, verbatims and market rows), effort.json (the effort model and the back-test), workspace/*.json (the backend API's responses per vehicle and market: requirements, effort, packages, excluded candidates, events), vehicles/*.json (drawing and photo sizes and boxes), generated and committed
lib/
  content/      types, loaders, number formats; cpm-types.ts and workspace-types.ts are the contracts of the backend's endpoints
  data/         workspace.ts, the reads of the stage pages (snapshots today, the API in the live mode); effort.ts, the effort model file and the package estimate (POST /effort/estimate at request time)
  workspace/    candidates (the inbox rules, filters, grouping, stage counts), requirements (routes, evidence resolution, the footprint, the bridges), priorities (the matrix points, packages, the builder's set), stages (routes and figures of the stage bar)
  map/          regions, data (topology to outlines), renderer (mask, dots, zoom, focus, highlight)
  vehicles/     drawings and photos, shared stage geometry and hand-over targets, the hand-over store, zones (unused)
  motion/       reduced-motion hook
  site.ts       metadata and copy, one place
public/vehicles/  the drawings' masks and the photo cut-outs, generated and committed
scripts/        sync-map-data.mjs, build-content.py, build-cpm.py, snapshot-workspace.mjs, vehicles/build.mjs, vehicles/photos.mjs
tools/audit/    page-audit.mjs, screenshots.mjs
docs/           research notes, forbidden list, specifications, screenshots, raw research
```

Rules that bind: `docs/02-forbidden-list.md` before every delivery; decisions in
`plan/decisions.md`; English everywhere (D-001).
