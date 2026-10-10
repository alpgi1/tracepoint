# Tracepoint frontend

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn project structure, pnpm. Node 22.

The first surface is the landing page: a dotted world map with three selectable markets (China,
United States, European Union), each carrying its figures; a selected market shows the vehicles
sold there as dotted drawings, and a vehicle opens its screen (`/markets/<market>/<vehicle>`),
where the car is the domain selector. Desktop only. The PM workspace follows in Phase 6 of the
master plan. Documentation lives in `docs/` (start with `docs/README.md`).

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Development server (copies the world topology into `public/map/` first) |
| `pnpm build` and `pnpm start` | Production build and server on port 3400 |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | ESLint, route typegen plus `tsc --noEmit`, vitest (market outlines, classification, projection fit, vehicle dot runs and zones) |
| `pnpm check` | All of the above plus the build; must pass before a step is committed |
| `pnpm audit:pages` | Page audit in Chromium against a running server, on the landing page and the seven vehicle pages: landmarks, headings, accessible names, tap targets, keyboard tour, 375 px overflow, forbidden text, console errors (exit code 1 on findings) |
| `pnpm shots` | Screenshots of the states (resting with readouts, hover, the three magnified markets with their panels, card hover and growth, vehicle screens, keyboard focus, 1920 px, reduced motion) into `tools/audit/out/` |
| `pnpm content` | Regenerates `content/markets.json` from `reports/baseline`, `docs/*.xlsx` and `config/` (Python 3 with openpyxl and PyYAML) |
| `pnpm vehicles` | Regenerates the vehicle drawings (`public/vehicles/*.png`, `content/vehicles/*.json`) from `assets/vehicles/sources` |

Run the audit and the screenshots against a built app started in another shell
(`pnpm build && pnpm start`). Both use the Playwright Chromium installed in this environment
(`/opt/pw-browsers/chromium`).

## Layout

```
app/            layout, page, tokens (globals.css), fonts (self-hosted subsets, OFL)
  markets/[market]/[vehicle]/   the vehicle screen (static routes for the seven pairs)
assets/vehicles/sources/        brochure pages and the press sheet the drawings come from, with README
components/
  landing/      map stage, market readouts, market panel, vehicle cards
  vehicles/     vehicle-drawing (dots and lines, heat by zone)
  workspace/    vehicle-workspace (the car as domain selector, domain list, themes)
  ui/           dotted-world-map (canvas map), shadcn components
content/        markets.json (figures with sources) and vehicles/*.json (dot runs), generated and committed
lib/
  content/      types, loaders, number formats
  map/          regions, data (topology to outlines), renderer (mask, dots, zoom, focus, highlight)
  vehicles/     drawings, dot runs by zone, zones, shared stage geometry
  motion/       reduced-motion hook
  site.ts       metadata and copy, one place
public/vehicles/  the drawings' lines as alpha masks, generated and committed
scripts/        sync-map-data.mjs, build-content.py, vehicles/build.mjs
tools/audit/    page-audit.mjs, screenshots.mjs
docs/           research notes, forbidden list, specifications, screenshots, raw research
```

Rules that bind: `docs/02-forbidden-list.md` before every delivery; decisions in
`plan/decisions.md`; English everywhere (D-001).
