# Tracepoint frontend

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn project structure, pnpm. Node 22.

The first surface is the landing page: a dotted world map with three selectable markets (China,
United States, European Union), each carrying its figures; a selected market shows the vehicles
sold there as photos of the configured cars, and a vehicle opens its screen (`/markets/<market>/<vehicle>`),
where the car is a technical sketch beside the twelve CPM subsystems; a subsystem opens a dialog
with what customers like and criticise there and the market evidence. Desktop only. The next
screens follow `plan/07-frontend-plan.md`. Documentation lives in `docs/` (start with `docs/README.md`).

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Development server (copies the world topology into `public/map/` first) |
| `pnpm build` and `pnpm start` | Production build and server on port 3400 |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | ESLint, route typegen plus `tsc --noEmit`, vitest (market outlines, classification, projection fit, vehicle drawings and zones) |
| `pnpm check` | All of the above plus the build; must pass before a step is committed |
| `pnpm audit:pages` | Page audit in Chromium against a running server, on the landing page and the seven vehicle pages: landmarks, headings, accessible names, tap targets, keyboard tour, 375 px overflow, forbidden text (quoted verbatims excepted), console errors, and the open subsystem dialog (name, headings, tap targets, keyboard tour that never reaches the inert page, Escape and the return of focus); exit code 1 on findings |
| `pnpm shots` | Screenshots of the states (resting with callouts, hover, the three magnified markets with their panels, card hover, the photo on its way and fading on the vehicle screen, vehicle screens, keyboard focus, 1920 px, reduced motion, the subsystem dialog in four states) into `tools/audit/out/` |
| `pnpm content` | Regenerates `content/markets.json` and `content/cpm.json` from `reports/baseline`, `docs/*.xlsx` and `config/` (Python 3 with openpyxl and PyYAML); the CPM build stops if its counts differ from the baseline reports |
| `pnpm vehicles` | Regenerates the vehicle drawings (body, lines and contour masks under `public/vehicles/`, `content/vehicles/*.json`) from `assets/vehicles/sources` |
| `pnpm photos` | Regenerates the photo cut-outs of the configured cars (`public/vehicles/*-photo-side.webp`, `content/vehicles/*-photo.json`) from `assets/vehicles/photos` |

Run the audit and the screenshots against a built app started in another shell
(`pnpm build && pnpm start`). Both use the Playwright Chromium installed in this environment
(`/opt/pw-browsers/chromium`).

## Layout

```
app/            layout (with the hand-over layer), page, tokens (globals.css), fonts (self-hosted subsets, OFL)
  markets/[market]/[vehicle]/   the vehicle screen (static routes for the seven pairs)
assets/vehicles/sources/        brochure pages and the press sheet the drawings come from, with README
assets/vehicles/photos/         side-profile renders of the configured cars from the BMW configurator, with README
components/
  landing/      map stage with callouts and connectors, market panel, vehicle cards (photo, hand-over)
  vehicles/     vehicle-drawing (layered sketch: wash, lines, contour), handoff-layer (the photo across the route change)
  workspace/    vehicle-workspace (sketch, hand-over target), cpm-list (the twelve subsystems), cpm-dialog (three bands: liked, disliked, market analysis)
  ui/           dotted-world-map (canvas map), shadcn components
content/        markets.json (figures with sources), cpm.json (subsystems, per vehicle and market the themes, verbatims and market rows), vehicles/*.json (drawing and photo sizes and boxes), generated and committed
lib/
  content/      types, loaders, number formats; cpm-types.ts is the contract of the backend's CPM endpoints
  map/          regions, data (topology to outlines), renderer (mask, dots, zoom, focus, highlight)
  vehicles/     drawings and photos, shared stage geometry and hand-over targets, the hand-over store, zones (unused)
  motion/       reduced-motion hook
  site.ts       metadata and copy, one place
public/vehicles/  the drawings' masks and the photo cut-outs, generated and committed
scripts/        sync-map-data.mjs, build-content.py, build-cpm.py, vehicles/build.mjs, vehicles/photos.mjs
tools/audit/    page-audit.mjs, screenshots.mjs
docs/           research notes, forbidden list, specifications, screenshots, raw research
```

Rules that bind: `docs/02-forbidden-list.md` before every delivery; decisions in
`plan/decisions.md`; English everywhere (D-001).
