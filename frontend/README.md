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
from the CPM engine. Desktop only. The next stages follow `plan/08-engineering-workbench-plan.md`.
Documentation lives in `docs/` (start with `docs/README.md`).

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Development server (copies the world topology into `public/map/` first) |
| `pnpm build` and `pnpm start` | Production build and server on port 3400 |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | ESLint, route typegen plus `tsc --noEmit`, vitest (market outlines, classification, projection fit, vehicle drawings and zones, the CPM content, the workspace snapshots and the candidate rules) |
| `pnpm check` | All of the above plus the build; must pass before a step is committed |
| `pnpm audit:pages` | Page audit in Chromium against a running server, on the landing page, the seven vehicle pages and five states of the structure page: landmarks, headings, accessible names, tap targets, keyboard tour, 375 px overflow, forbidden text (quoted verbatims excepted), console errors, and the open subsystem dialog (name, headings, tap targets, keyboard tour that never reaches the inert page, Escape and the return of focus); exit code 1 on findings |
| `pnpm shots` | Screenshots of the states (resting with callouts, hover, the three magnified markets with their panels, card hover, the photo on its way and fading on the vehicle screen, vehicle screens, keyboard focus, 1920 px, reduced motion, the subsystem dialog in four states, the stage bar and stage 2 in six states) into `tools/audit/out/` |
| `pnpm content` | Regenerates `content/markets.json` and `content/cpm.json` from `reports/baseline`, `docs/*.xlsx` and `config/` (Python 3 with openpyxl and PyYAML); the CPM build stops if its counts differ from the baseline reports |
| `pnpm snapshot` | Reads the running backend API (`TRACEPOINT_API_URL`, default `http://127.0.0.1:8000`) once per vehicle and market pair and writes its responses unchanged to `content/workspace/<VEHICLE>_<MARKET>.json` (requirements, effort per requirement, the package variations, excluded candidates, events); the stage pages read these files until the live mode exists |
| `pnpm vehicles` | Regenerates the vehicle drawings (body, lines and contour masks under `public/vehicles/`, `content/vehicles/*.json`) from `assets/vehicles/sources` |
| `pnpm photos` | Regenerates the photo cut-outs of the configured cars (`public/vehicles/*-photo-side.webp`, `content/vehicles/*-photo.json`) from `assets/vehicles/photos` |

Run the audit and the screenshots against a built app started in another shell
(`pnpm build && pnpm start`). Both use the Playwright Chromium installed in this environment
(`/opt/pw-browsers/chromium`).

## Layout

```
app/            layout (with the hand-over layer), page, tokens (globals.css), fonts (self-hosted subsets, OFL)
  markets/[market]/[vehicle]/   the vehicle screen, stage 1 (static routes for the seven pairs)
  markets/[market]/[vehicle]/structure/   stage 2, Structure & context (the table streams behind the prerendered shell)
assets/vehicles/sources/        brochure pages and the press sheet the drawings come from, with README
assets/vehicles/photos/         side-profile renders of the configured cars from the BMW configurator, with README
components/
  landing/      map stage with callouts and connectors, market panel, vehicle cards (photo, hand-over)
  vehicles/     vehicle-drawing (layered sketch: wash, lines, contour), handoff-layer (the photo across the route change)
  workspace/    workspace-header and stage-bar (shared by the stages), vehicle-workspace (sketch, hand-over target), cpm-list (the twelve subsystems), cpm-dialog (three bands: liked, disliked, market analysis), candidate-filters and candidate-table (stage 2)
  ui/           dotted-world-map (canvas map), shadcn components
content/        markets.json (figures with sources), cpm.json (subsystems, per vehicle and market the themes, verbatims and market rows), workspace/*.json (the backend API's responses per vehicle and market: requirements, effort, packages, excluded candidates, events), vehicles/*.json (drawing and photo sizes and boxes), generated and committed
lib/
  content/      types, loaders, number formats; cpm-types.ts and workspace-types.ts are the contracts of the backend's endpoints
  data/         workspace.ts, the reads of the stage pages (snapshots today, the API in the live mode)
  workspace/    candidates (the inbox rules, filters, grouping, stage counts), stages (routes and figures of the stage bar)
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
