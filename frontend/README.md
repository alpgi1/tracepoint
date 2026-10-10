# Tracepoint frontend

Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn project structure, pnpm. Node 22.

The first surface is the landing page with the interactive market globe (China, United States,
European Union). The PM workspace follows in Phase 6 of the master plan. Documentation lives in
`docs/` (start with `docs/README.md`).

## Commands

| Command | What it does |
|---|---|
| `pnpm install` | Install dependencies |
| `pnpm dev` | Development server (copies the globe topology into `public/globe/` first) |
| `pnpm build` and `pnpm start` | Production build and server on port 3400 |
| `pnpm lint`, `pnpm typecheck`, `pnpm test` | ESLint, `tsc --noEmit`, vitest (globe geometry and projection tests) |
| `pnpm check` | All of the above plus the build; must pass before a step is committed |
| `pnpm audit:pages` | Page audit in Chromium against a running server: landmarks, headings, accessible names, tap targets, keyboard tour, 375 px overflow, forbidden text, console errors (exit code 1 on findings) |
| `pnpm shots` | Screenshots of the hero states (resting, hover, selected markets, mobile, reduced motion) into `tools/audit/out/` |

Run the audit and the screenshots against a built app started in another shell
(`pnpm build && pnpm start`). Both use the Playwright Chromium installed in this environment
(`/opt/pw-browsers/chromium`).

## Layout

```
app/            layout, page, tokens (globals.css), fonts (self-hosted subsets, OFL)
components/
  landing/      hero copy and the market stage (shared hover and selection state)
  site/         header and footer
  ui/           wireframe-dotted-globe (canvas globe), shadcn components
lib/
  globe/        regions, data (topology to outlines and dots), raster classifier, math, renderer
  motion/       reduced-motion hook
  site.ts       all product copy, one place
scripts/        sync-globe-data.mjs (world-atlas topology into public/globe/)
tools/audit/    page-audit.mjs, screenshots.mjs
docs/           research notes, forbidden list, globe specification, screenshots, raw research
```

Rules that bind: `docs/02-forbidden-list.md` before every delivery; decisions in
`plan/decisions.md`; English everywhere (D-001).
