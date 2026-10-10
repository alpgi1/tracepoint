# Step 10 (UI track) – The vehicle screen as an annotated sketch, crisp cards

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured |
| Track | Frontend, in parallel with the backend track; no backend files touched |

## 1. What the team asked for

After step 08 the cars were judged broken and poor. The team supplied a reference image of the
vehicle screen (a grey line sketch with soft blue heat spots, leader lines from the spots to a
domain list with bars, a themes card) as an idea, not as a design to copy, and asked for
21st.dev components where they fit. The survey of step 09 (`frontend/docs/01-research-notes.md`
6.1) found nothing that annotates an image with zones; the hotspot and heat-map results were
grid heat maps, popovers and spotlight effects. The reference's method was taken instead.

## 2. What was built (D-052)

* **Crisp lines at card size.** The pipeline writes a second lines mask per view at 520 px with
  every stroke raised to 0.8 pt (vector pages) or the ink dilated before resizing (the G70
  raster), so the drawings on the market panel's cards keep whole lines instead of the broken
  sub-pixel strokes the 1600 px mask gave at a quarter of its width. The contour is thinner
  (3 px at 1600 px).
* **Heat as radial washes, relative within the vehicle.** One ellipse per zone rectangle with a
  radial gradient of the one blue, clipped to the body; the lowest complaint share of the car
  stays almost clear and the highest is full, so the washes show where this car's complaints
  concentrate. The active domain is full blue.
* **Leader lines.** One SVG over both columns joins each side-view zone (a dot at its centre)
  to its row in the domain list with a single curve, measured from the DOM after layout and on
  resize; the hovered or selected domain's line turns blue. Zones, dots, lines and rows all
  select the same domain.
* **Cards.** The domain list and the themes are two hairline cards; the selected row carries a
  blue outline; bars are the one blue on a hairline track; the back control is a bordered chip.
  The reference's gradient bars, glass surfaces and per-theme icons were not taken.

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm lint`, `pnpm typecheck`, `pnpm test` (7 tests), `pnpm build` | Clean |
| `pnpm audit:pages` on `/` and the seven vehicle pages | 0 findings |
| Screenshots (13 states refreshed) | Cards with whole lines; the vehicle screen for EU F70, US G70 with a hovered domain, CN G68 without heat |
| Layout probes at 1280, 1440 and 1920 px | No horizontal overflow; the card growth lands on the stage rectangle at every width; no leftover transform after going back |
| Forbidden-list checklist | Passed: one accent, hairline cards, no gradient fills beyond the heat washes of the one blue, icons from the one set, every figure sourced |

## 4. Open for the team

1. Leader lines cross the drawing where a zone sits at the front of the car; the reference does
   the same. Say if the lines should instead leave the stage at its right edge.
2. The G70 wheels read heavier than the others (tyres drawn apart from the arches in the press
   sheet); a vector drawing from BMW would fix it.
3. Heat is scaled within each vehicle, so two vehicles with different absolute shares look alike;
   the list carries the absolute figures. An absolute scale across vehicles is a switch away if
   wanted.
