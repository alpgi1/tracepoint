# Landing page: the dotted world map, its readouts and the market panel

| Field | Value |
|---|---|
| Date | 2026-10-10 (replaces the globe of step 04; markets made solid layers in step 06; readouts, panel and vehicle cards added in step 07) |
| Status | Built and verified in steps 05 to 07 |
| Files | `components/ui/dotted-world-map.tsx` (React wrapper), `lib/map/renderer.ts` (drawing and animation), `lib/map/data.ts`, `lib/map/regions.ts`, `components/landing/map-stage.tsx`, `components/landing/market-readout.tsx`, `components/landing/market-panel.tsx`, `components/landing/vehicle-card.tsx`, `lib/content/markets.ts` (figures), `lib/site.ts` (copy), `app/globals.css` (tokens) |

## 1. What it does

The whole page is a dotted world map on white: no header, no copy, no footer. Plain land is a
square grid of light grey dots, like a printed halftone. Antarctica is left off. The three
markets, China (CN), the United States (US) and the European Union (EU, 27 member states merged
into one outline), are solid layers: a light blue fill under a darker and thicker blue outline,
with no dots inside.

Each market carries a readout at rest, so the map is the first layer of the analysis and not a
decoration: the market's name, its 2025 sales and verbatim count, and the domain with the
highest complaint share (or, where no verbatims are classified yet, the lowest study score).
Every figure comes from `content/markets.json`, which `scripts/build-content.py` generates from
the baseline reports, the sales workbook, the customer studies and the configuration; each value
carries its source there.

Hovering a market deepens its fill and outline. Clicking a market magnifies the map around it
(900 ms); the market comes to rest in the upper part of the viewport and a panel appears below it
with the market's figures and one card per vehicle sold there: the vehicle as a drawing (dots
inside the silhouette, lines on top), its name and code, 2025 units, verbatims and its weakest
domain. Clicking a card grows the drawing into the place it has on the vehicle screen and
navigates there (`/markets/<market>/<vehicle>`, see `05-vehicle-drawings.md`). Escape, Close or
a click on open sea returns to the resting map. Desktop is the target; nothing is tuned for
touch.

Keyboard and assistive technology get the same states through three real buttons, one per
market, visually hidden until focused; a focused button shows the market's name at its place on
the map, Enter selects, Escape returns, a polite live region names the state. The panel's cards
are links and its Close is a button.

## 2. Why it looks like this

The step 04 hero (dark page, globe, headline column, mono labels, chips, status strip) was the
generic "dark tech" landing and failed the forbidden list (`02-forbidden-list.md`, section 0).
The team asked for a white page, a blue accent, a flat halftone map and no text on first view
(D-039 to D-042), then in step 07 for figures on the markets, no Antarctica, a larger map, and
vehicles as dotted drawings that grow when clicked (D-044 to D-048).

## 3. Data

* Boundaries: Natural Earth 1:110m admin-0 (public domain) packaged by `world-atlas` 2.0.2 (ISC).
  `scripts/sync-map-data.mjs` copies `countries-110m.json` (105 KB, 39 KB gzipped) into
  `public/map/` on `predev` and `prebuild`; the copy is git-ignored.
* Land is the merge of all country geometries except Antarctica (id 010). Each market is the
  merge of its member ids (`lib/map/regions.ts`); for the EU, merged polygons outside longitude
  -32 to 45 are dropped, which removes French Guiana. Malta is below the resolution and absent.
  Switzerland is a hole in the EU outline and counts as plain land.
* Figures: `content/markets.json` (generated, committed). Per market: 2025 units summed over the
  vehicle sheets of `docs/sales_volumes.xlsx`; unique verbatims summed from the baseline reports'
  `coverage.verbatims`; the weakest domain is the highest complaint share among domains with at
  least 50 classified rows, summed over the market's baseline reports; for CN, which has no
  classified verbatims, the lowest attribute mean of the CN_EU_2025 study across its vehicles.
  Per vehicle the same, plus the domain table, the top complaint themes and the study's three
  lowest attributes. Vintage and sources are in the file's header.
* Unit tests (`lib/map/map.test.ts`): the EU merge drops exactly one polygon; thirteen cities
  classify correctly; the fit window stays inside the padded extent, is larger than the old
  sphere fit, and keeps every market centre and readout anchor on the map; Antarctica is sea and
  Ushuaia is land.

## 4. Rendering

* Projection: `geoNaturalEarth1`, fitted with 16 px padding to a window covering all land but
  Antarctica (longitude -168 to 180, latitude -56 to 84, `FIT_WINDOW` in `lib/map/data.ts`; the
  window ring is densified every 5 degrees so its edges follow the parallels). The world is wider
  than any viewport, so the fit stays width-limited: the gain over the step 06 sphere fit is
  about 6 % of scale at 1440 by 900, and the land block is centred vertically instead of leaving
  Antarctica at the bottom.
* Mask: the land and the three markets are painted once per resize into an offscreen canvas with
  additive compositing (land in the blue channel, markets in the red and green channels); a pixel
  belongs to a class when that channel is at least half covered, so anti-aliased edges never leak.
  The mask answers both "which dot is where" and "what is under the pointer" in one pixel read.
* Dots: a square screen-space grid over the plain land of the fit (markets get none). Pitch is
  the map width divided by 225, clamped to 4 to 9 px; radius is 0.3 of the pitch.
* Zoom: an affine transform (scale k, translation) applied to the base coordinates; the market
  outlines are drawn by a second projection carrying the same transform. A selected market's view
  centre is placed at the focus anchor (50 % across, 40 % down) instead of the viewport centre,
  which leaves the lower part of the viewport to the panel; the anchor is interpolated during the
  flight so the transform stays continuous. A flight whose target equals the current state (the
  first fly-home after loading) settles at once.
* Readouts are HTML, positioned by the renderer after every settle (resize or flight end), hidden
  while the map flies and while a market is selected. US and CN readouts sit inside their fills;
  the EU readout, too wide for Europe at rest, sits on the Atlantic with its right edge at the
  Irish coast. A paper-coloured text halo keeps them readable over dots.
* Colours from `:root` custom properties: `--map-dot #cdd1d6`; market fill `--map-fill #dce7f8`
  and `--map-fill-active #b9cff2`; market outline `--map-outline #1c69d4` and
  `--map-outline-active #0f4fae`, always darker than the fill. Vehicle tokens are in
  `05-vehicle-drawings.md`.
* Draw order per frame: all dots in one fill, then each market as a solid fill under a 1.6 px
  outline (plus 0.35 px per unit of magnification); hover and selection cross-fade the active fill
  and outline on top, scaled by the market's highlight value (0 to 1).
* Renders on demand; a frame loop runs only during a flight or a highlight transition.

## 5. Interaction and timing

| State | Behaviour | Timing |
|---|---|---|
| Entrance | The canvas fades in once its data is there; readouts appear with the first settle | 600 ms, once |
| Hover | Fill and outline deepen; the highlight value rises at 1 / 180 ms and falls at 1 / 320 ms; `pointer` cursor over a market | 180 ms in, 320 ms out |
| Click on a market | Flight: the market's view centre moves to the focus anchor while k goes to the market's zoom (CN 2.6, US 2.4, EU 3.2), geometric interpolation, cubic in-out; readouts fade out at the start | 900 ms |
| Settle | The panel appears below the market (fade and 8 px rise) | 240 ms |
| Card hover | The vehicle's dots deepen (`--vehicle-dot-active`) | 180 ms |
| Card click | The drawing grows from the card to the vehicle screen's stage (translate and scale, cubic in-out), then the route changes | 480 ms |
| Close, Escape, click on sea | Flight back to k = 1; the panel leaves at once; readouts return on settle | 900 ms |
| Resize | Refit, repaint the mask, resample the dots; a selected market stays in focus | immediate |
| Reduced motion | No fade, instant flights and highlights, no card growth (direct navigation) | |

## 6. Accessibility

* The canvas has `role="img"` and a label naming the three markets and the interactions.
* The market keys are real buttons with `aria-pressed`, positioned at the market centres; they
  take no pointer events, so the canvas keeps the pointer; the audit skips them as tap targets for
  that reason.
* The panel is a `section` labelled by its heading; Close is a 44 px button; the cards are links
  with the vehicle's name and figures as their text. Readouts are plain text in the document.
* The hidden h1 keeps the document outline; the live region announces hover and selection.

## 7. Tokens

```
--color-paper #ffffff   page
--color-ink #14171c     text
--color-ink-2 #5b6470   secondary text and figures
--color-blue #1c69d4    the one accent, also the market outline and the vehicle lines
--map-dot #cdd1d6
--map-fill #dce7f8 · --map-fill-active #b9cff2
--map-outline #1c69d4 · --map-outline-active #0f4fae
--vehicle-dot #c5d5ef · --vehicle-dot-active #9fb9e3 · --vehicle-line #1c69d4
--vehicle-heat #1c69d4 · --vehicle-heat-active #0f4fae
```

## 8. How to tune

* Market view centres, magnification, readout anchors and alignment: `lib/map/regions.ts`.
* Fit window and Antarctica: `FIT_WINDOW` and `landFeature` in `lib/map/data.ts`.
* Focus anchor and padding: `RendererOptions.focus` (0.5, 0.4) and `padding` (16 px).
* Dot pitch and radius: `rebuild` and `drawDots` in `lib/map/renderer.ts`. Outline weight:
  `lineWidth` in `render`. Timings: `GLOW_IN`, `GLOW_OUT`, `FLIGHT_MS`.
* Readout copy and panel copy: `lib/site.ts`. Figures: regenerate `content/markets.json` with
  `pnpm content` after the baseline reports change.
* Card width (420 px, same for two or three vehicles): `.market-panel-cards` in `globals.css`.

## 9. Known limits

* 1:110m geometry is coarse; at full magnification the outlines are angular. A 1:50m topology
  (756 KB) is the next step if the magnified state needs detail.
* The mask encodes at most three markets; a fourth needs a second mask.
* The fit is width-limited; the only ways to a larger map are cropping longitude (which cuts
  Alaska or Russia) or letting the map bleed past the viewport.
* The card growth and the route change are two steps: the drawing animates to the stage's
  geometry (`lib/vehicles/layout.ts`, mirrored in `.workspace` CSS), then the new page renders
  in the same place. A shared-element view transition would remove the cut.
* Touch and narrow screens are not tuned (team decision: desktop only).
