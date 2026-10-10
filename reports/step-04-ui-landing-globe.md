# Step 04 (UI track) – Frontend research and the landing page market globe

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – research filed, landing hero built and measured; accent colour, copy and four smaller choices wait for the team (section 6) |
| Track | Frontend, in parallel with the Phase 1 backend track (step 03); no backend files touched |
| Scope | (1) Read the design rules, research and process of the team's three other frontends and view their reference material; (2) write the notes, the adapted forbidden list and the ideas; (3) scaffold the web UI and build only the landing hero: an interactive dotted globe with three selectable markets |

---

## 1. What was done

### 1.1 Research (`frontend/docs/01-research-notes.md`, raw notes in `frontend/docs/research/`)

* Read: Mentor-Website (plan, reference notes, design direction, 21st.dev candidates, font and
  token pipeline), portfolio (research R1 with the 21st.dev inventory of 1,431 components,
  forbidden list, plan and decisions D1 to D15, step log, hero and motion code, audit tools),
  REGU (CLAUDE.md, forbidden list, design system folder, R13 references, ADRs, upgrade plan,
  session hand-over, skills inventory, audit tools).
* Viewed: 196 captures of 64 award-level sites, 92 captures of 38 AI and infrastructure startups
  plus REGU, 22 reference boards, 35 21st.dev category captures, the Lando Norris case study, and
  7 reference videos sampled frame by frame.
* Written: the research notes (process rules adopted, pattern counts, globe and map references in
  detail, measured motion norms, 21st.dev verdicts and shortlist, 17 ideas beyond the brief), the
  forbidden list for Tracepoint with two written exemptions, and the globe specification.
* Limits: two review passes ended early on a session limit (the REGU document notes are partial
  and the written report on the Mentor boards and the 21st.dev category captures was lost after
  viewing). The forbidden list and skills inventory were read directly instead; the 21st.dev
  material is covered by the portfolio inventory. The team asked to stop the image review at that
  point and use what had been learned.

### 1.2 Frontend scaffold (`frontend/`)

Next.js 16.4 (App Router), React 19.3, TypeScript 5.9 strict, Tailwind CSS 4.3, shadcn project
structure (`components.json`, `components/ui`, `lib/utils.ts`), pnpm 10, Node 22. Dependencies for
the globe: `d3-geo`, `topojson-client`, `world-atlas`. Self-hosted Archivo and Geist Mono subsets
(96 KB, OFL texts alongside). Scripts: `dev`, `build`, `start` (port 3400), `lint`, `typecheck`,
`test` (vitest), `check`, `audit:pages`, `shots`. Tokens in `app/globals.css`; all copy in
`lib/site.ts`.

### 1.3 Landing hero (`frontend/docs/03-landing-globe.md`)

* Dotted wireframe globe on a 2d canvas, d3 orthographic projection. No auto-rotation. Drag to
  rotate with a short coast; touch drags rotate longitude and leave page scrolling alone.
* Three markets: China, United States, European Union (27 members merged into one outline, French
  Guiana dropped, Malta absent at 1:110m). Hover on the globe or on a market button brightens the
  market's dots, fills it softly and draws its outline (180 ms in, 320 ms out). Click flies the
  camera to the market and scales the globe 2.1 to 2.6 times (1.1 s). Back by button, Escape or a
  click on open sea. Entrance plays once; reduced motion disables entrance, coasting and flights.
* Data served from our origin: `world-atlas` 2.0.2 topology copied into `public/globe/` before
  every build (105 KB, 39 KB gzipped). Dots on latitude rows with arc-length column spacing;
  classification by a raster mask; dots projected by a rotation matrix derived from d3 itself.
* Accessibility: labelled canvas, real buttons with `aria-pressed`, live readout, visible focus
  rings, Escape, 44 px targets.
* The 21st.dev component was taken as the method and rewritten (spec section 2 lists every change).

### 1.4 Measurement tools (`frontend/tools/audit/`)

`page-audit.mjs` (landmarks, headings, accessible names, tap targets measured, keyboard tour with
real Tab presses, 375 px overflow, forbidden-text scan, console errors; exit code 1 on findings) and
`screenshots.mjs` (eight hero states). Both ported from the sister projects with their documented
false-alarm fixes.

## 2. What was verified

| Check | Result |
|---|---|
| `pnpm check` (ESLint, `tsc --noEmit`, vitest, `next build`) | Clean; 7 unit tests pass (EU merge, 13 city classifications, projection matrix within 1e-6, dot row density, resting view geometry) |
| `pnpm audit:pages` on `/` | 0 findings, 5 keyboard stops with visible focus rings (one finding, a 38 px skip link, was fixed during the step) |
| Horizontal overflow at 375 px | 0 px |
| Console errors or warnings during the audit and screenshots | None |
| Script weight referenced by `/` | 202 KB gzipped in total, framework included; globe data 39 KB gzipped on top |
| Screenshots (`frontend/docs/screenshots/`) | Resting, hover EU, selected EU, selected CN, selected US, mobile resting and selected, reduced motion |
| Forbidden-list checklist (`02-forbidden-list.md` section 8) | Passed; no number on the page is invented (markets, vehicles, data source and resolution are facts from the plan and the data file) |

Not measured: frame rate on a real device and Lighthouse on real hardware (software rendering in
this container inflates canvas numbers, as REGU documented); hover behaviour on a real touchpad.

## 3. Decisions recorded

D-033 to D-038 in `plan/decisions.md` (renumbered in step 05: the backend track had used D-027 to D-032 at the same time): Next.js stack for `frontend/`, the frontend track and its
documents, the globe hero and its data, the forbidden list with exemptions E1 and E2, the dark
token set with a draft accent, and the measurement gate.

## 4. Rules adopted from the sister projects

Research before code; coded decisions; one step with its own verification and backward check;
no delivery without measurement and "question the tool first"; forbidden list before every
delivery with written exemptions only; tokens and copy in one place with sources; server renders
everything visible, nothing waits behind a loader; fonts produced, not added; 21st.dev gives
methods, not components; skills are scoped and ranked below team decisions.

## 5. Ideas beyond the brief

Seventeen proposals in the research notes, section 7: among them an evidence strip with real
counts, the zoomed state as a report cover with six layer tiles, the evidence layers as globe
toggles, a sticky-split "how the evidence is built" with the mini globe pinned, corner brackets and
a self-drawing outline, a dated refresh log, and "FIG. n" captions as the shared document voice.

## 6. Open for the team

1. Accent colour: amber (built), ice blue (kinship with REGU) or acid yellow.
2. Drag affordance: none (built) or one mono hint line under the globe.
3. Idle motion after the entrance: none (built) or a single sweep every few minutes.
4. Mobile: the canvas with horizontal drag (built) or a static pre-rendered map with buttons.
5. Hero sentence and lead: drafts derived from the master plan, to be reviewed.
6. Whether the research notes and this report should also carry a Turkish summary for the team
   chat; the repository stays English (D-001).

## 7. Next

* Team review of the hero and the six questions above.
* Phase-specific content for the selected state (the slot for region content such as 3D cars),
  fed by the evidence store API once Phase 1 exposes it.
* A `/` evidence strip and the sections of research notes section 7 as they become data-backed.
