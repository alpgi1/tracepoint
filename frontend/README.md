# Tracepoint frontend

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn project structure, pnpm. Node 22.

The first surface is the landing page: a dotted world map with three selectable markets (China,
United States, European Union), nothing else on screen. Desktop only. The PM workspace follows in
Phase 6 of the master plan. Documentation lives in `docs/` (start with `docs/README.md`).

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Development server (copies the world topology into `public/map/` first) |
| `pnpm build` and `pnpm start` | Production build and server on port 3400 |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | ESLint, `tsc --noEmit`, vitest (market outlines, classification and projection fit) |
| `pnpm check` | All of the above plus the build; must pass before a step is committed |
| `pnpm audit:pages` | Page audit in Chromium against a running server: landmarks, headings, accessible names, tap targets, keyboard tour, 375 px overflow, forbidden text, console errors (exit code 1 on findings) |
| `pnpm shots` | Screenshots of the map states (resting, hover, the three magnified markets, keyboard focus, 1920 px, reduced motion) into `tools/audit/out/` |

Run the audit and the screenshots against a built app started in another shell
(`pnpm build && pnpm start`). Both use the Playwright Chromium installed in this environment
(`/opt/pw-browsers/chromium`).

## Layout

```
app/            layout, page, tokens (globals.css), fonts (self-hosted subsets, OFL)
components/
  landing/      map stage (shared hover and selection state, hidden market keys)
  ui/           dotted-world-map (canvas map), shadcn components
lib/
  map/          regions, data (topology to outlines), renderer (mask, dots, zoom, highlight)
  motion/       reduced-motion hook
  site.ts       metadata and assistive copy, one place
scripts/        sync-map-data.mjs (world-atlas topology into public/map/)
tools/audit/    page-audit.mjs, screenshots.mjs
docs/           research notes, forbidden list, map specification, screenshots, raw research
```

Rules that bind: `docs/02-forbidden-list.md` before every delivery; decisions in
`plan/decisions.md`; English everywhere (D-001).
