# Step 05 (UI track) – Review of step 04 and the dotted world map

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – the globe hero is replaced by the full-page dotted map; built, measured, documented |
| Track | Frontend, in parallel with the Phase 1 backend track; no backend files touched |
| Scope | (1) Re-read the anti-slop rules and write down why step 04 failed them; (2) white page, one blue, no dark mode; (3) nothing on screen but the map; (4) a flat dotted world map instead of the globe; (5) desktop only |

---

## 1. Why step 04 was slop

The team's verdict was right. Against the forbidden lists and the installed taste skill the step 04
hero carried eight tells: a mono uppercase eyebrow with middle dots, a status label in the header,
a decoration text strip at the bottom of the hero, the default split hero (headline column left,
object right, three buttons), the dark page with a warm accent and mono labels everywhere, the
component-library globe look (graticule, rim gradient), chip buttons with a coloured code prefix,
and a headline that was a claim rather than something the page proves. The table is recorded in
`frontend/docs/02-forbidden-list.md`, section 0, with the rule each one broke, and the
pre-delivery checklist now asks for them by name.

## 2. What was built

* **One object, nothing else.** The page is a dotted world map on white, fitted to the window
  (Natural Earth projection, 48 px padding). No header, copy or footer; the h1, the three market
  buttons and the status line exist for keyboard and assistive technology and are visually hidden
  (the buttons appear at their market's place while focused).
* **Halftone land.** A square screen-space grid of light grey dots over the land, pitch about
  5.8 px at 1440 and 7.9 px at 1920, radius 0.3 of the pitch, about 9,000 dots at 1440 by 900.
  The three markets' dots are a touch darker and carry a faint blue outline at rest.
* **Hover.** The market's dots turn blue, a 7 % blue fill and a crisp outline with a soft 8 px
  halo appear (180 ms in, 320 ms out).
* **Click.** The map magnifies around the market (CN 2.6, US 2.4, EU 3.2 times) in 900 ms with a
  cubic in-out; Escape or a click on open sea returns; another market flies directly.
* **Classification mask.** Land and markets are painted once per resize into an offscreen canvas
  with additive compositing, one channel per class, decoded by a 50 % coverage threshold. This
  replaced a red-level scheme whose anti-aliased edges leaked US border dots into the EU class
  (caught in the first screenshot round).
* **Palette.** White page, ink `#14171c`, one blue `#1c69d4`; dot greys `#cdd1d6` and `#a9b0b8`.
  No dark mode. Fonts stay installed, not preloaded.
* Globe code, hero copy, header, footer and the mobile considerations were removed.

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm check` (ESLint, `tsc --noEmit`, vitest, `next build`) | Clean; 3 unit tests pass (EU merge, 13 city classifications, projection fit with market centres inside their outlines) |
| `pnpm audit:pages` on `/` | 0 findings, 3 keyboard stops with visible focus rings |
| Horizontal overflow at 375 px | 0 px (desktop is the target, the check stays) |
| Console errors or warnings | None |
| Script weight referenced by `/` | 197 KB gzipped in total, framework included; map data 39 KB gzipped; no font request on the first view |
| Screenshots (`frontend/docs/screenshots/`) | Resting at 1440 and 1920, hover EU, magnified EU, CN and US, keyboard focus on US, reduced motion |
| Forbidden-list checklist, including the new section 0 | Passed; the page has no visible text, no label, no strip, no chip |

Not measured: frame rate on a real device; Lighthouse on real hardware (software rendering here
inflates canvas numbers).

## 4. Decisions recorded

D-039 to D-042 in `plan/decisions.md`: light palette with one blue, map alone on first view,
flat dotted map instead of the globe, desktop only. The frontend rows of step 04 were renumbered
from D-027 to D-032 to D-033 to D-038: the backend track had used the same ids in parallel and
both sets were merged, so the log carried duplicates.

## 5. Open for the team

1. The exact blue: `#1c69d4` is used; a different BMW or Bavaria blue is a one-token change.
2. Whether the resting markets should keep their faint outline and darker dots, or sit
   indistinguishable until hovered.
3. What the magnified state carries in the next phase (the team mentioned region content such as
   3D cars); the stage already exposes the selected market and its screen position.
4. Whether the dots should re-sample at full magnification (finer grid) instead of magnifying like
   a print.

## 6. Next

* Team review of the map.
* Content for the magnified state, fed by the evidence store API once Phase 1 exposes it.
