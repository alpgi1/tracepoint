# Landing page: the dotted world map, its readouts and the market panel

| Field | Value |
|---|---|
| Date | 2026-10-10 (replaces the globe of step 04; markets made solid layers in step 06; readouts, panel and vehicle cards added in step 07; markets grey at rest and vehicles as layered sketches in step 08; readouts replaced by callout cards in step 09; vehicle cards show the configured cars' photos and hand over to the sketch in step 11) |
| Status | Built and verified in steps 05 to 11 |
| Files | `components/ui/dotted-world-map.tsx` (React wrapper), `lib/map/renderer.ts` (drawing and animation), `lib/map/data.ts`, `lib/map/regions.ts`, `components/landing/map-stage.tsx` (stage and connectors), `components/landing/market-callout.tsx`, `components/landing/market-panel.tsx`, `components/landing/vehicle-card.tsx`, `lib/content/markets.ts` (figures), `lib/content/icons.ts`, `lib/site.ts` (copy), `app/globals.css` (tokens) |

## 1. What it does

The whole page is a dotted world map on white: no header, no copy, no footer. Plain land is a
square grid of light grey dots, like a printed halftone. Antarctica is left off. The three
markets, China (CN), the United States (US) and the European Union (EU, 27 member states merged
into one outline), are solid layers: at rest a light grey fill under a darker and thicker grey
outline, with no dots inside; hover and selection turn fill and outline blue.

Each market carries a callout at rest, so the map is the first layer of the analysis and not a
decoration: a card pinned in open water, joined to the market by an elbow connector that ends
with a dot on the market's edge, with the market's name, its 2025 sales and verbatim count, and
the domain with the highest complaint share (or, where no verbatims are classified yet, the
lowest study score), each row with its Lucide icon. The card is the market's button: hovering it
turns the market, the connector and the card's border blue; clicking it magnifies the market.
Every figure comes from `content/markets.json`, the backend's `GET /overview` written unchanged by
`pnpm snapshot` (since step 19, D-101; until then `scripts/build-content.py` built the same file from
the baseline reports, the sales workbook, the customer studies and the configuration); each value
carries its source there. The pattern is the annotation of visx (subject, connector, label),
written here with the tokens; see `01-research-notes.md` section 6.1 for the survey.

Hovering a market turns it blue. Clicking a market magnifies the map around it (900 ms); the
market comes to rest in the upper part of the viewport and a panel appears below it with the
market's figures and one card per vehicle sold there: the configured car's side profile from
the BMW configurator, its name and code, 2025 units, verbatims and its weakest domain. Clicking a card grows the drawing into the place it has on the vehicle screen and
navigates there (`/markets/<market>/<vehicle>`, see `05-vehicle-drawings.md`). Escape, Close or
a click on open sea returns to the resting map. Desktop is the target; nothing is tuned for
touch.

Keyboard and assistive technology get the same states through the three callout cards, which
are real buttons with `aria-pressed`: Tab reaches them in market order, focus highlights the
market, Enter selects, Escape returns, a polite live region names the state. The panel's cards
are links and its Close is a button.

## 2. Why it looks like this

The step 04 hero (dark page, globe, headline column, mono labels, chips, status strip) was the
generic "dark tech" landing and failed the forbidden list (`02-forbidden-list.md`, section 0).
The team asked for a white page, a blue accent, a flat halftone map and no text on first view
(D-039 to D-042), then in step 07 for figures on the markets, no Antarctica, a larger map, and
vehicles as drawings that grow when clicked (D-044 to D-048), and in step 08 for grey markets
that turn blue on hover and vehicles as layered sketches instead of dot clouds (D-049, D-050).

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
* Callouts are HTML cards plus one SVG layer of connectors, both positioned by the renderer
  after every settle (resize or flight end) and hidden while the map flies and while a market is
  selected. Each card is pinned by a corner to a geographic point in open water
  (`callout.card` in `regions.ts`, tested to be sea); the connector leaves the card's top edge
  24 px from the pinned corner, runs vertically to the latitude of `callout.subject`, then
  horizontally until it first meets the market (`renderer.edgeTowards`, a 2 px scan of the
  mask), where a dot marks the edge. US and CN cards sit south-west of their markets over the
  Pacific and the Indian Ocean; the EU card hangs from Iberia over the Atlantic.
* Colours from `:root` custom properties: `--map-dot #cdd1d6`; market fill `--map-fill #e9ecf0`
  (grey, lighter than the dots, darker than the page) and `--map-fill-active #cddcf5` (blue);
  market outline `--map-outline #8e98a4` and `--map-outline-active #1c69d4`, always darker than
  the fill. Vehicle tokens are in `05-vehicle-drawings.md`.
* Draw order per frame: all dots in one fill, then each market as a solid fill under a 1.6 px
  outline (plus 0.35 px per unit of magnification); hover and selection cross-fade the active fill
  and outline on top, scaled by the market's highlight value (0 to 1).
* Renders on demand; a frame loop runs only during a flight or a highlight transition.

## 5. Interaction and timing

| State | Behaviour | Timing |
|---|---|---|
| Entrance | The canvas fades in once its data is there; callouts appear with the first settle | 600 ms, once |
| Hover (market or its card) | Fill and outline cross-fade from grey to blue, the connector and the card border turn blue; the highlight value rises at 1 / 180 ms and falls at 1 / 320 ms; `pointer` cursor over a market | 180 ms in, 320 ms out |
| Click on a market or its card | Flight: the market's view centre moves to the focus anchor while k goes to the market's zoom (CN 2.6, US 2.4, EU 3.2), geometric interpolation, cubic in-out; callouts fade out at the start | 900 ms |
| Settle | The panel appears below the market (fade and 8 px rise) | 240 ms |
| Card hover | The photo lifts by 3 px | 180 ms |
| Card click | The route changes at once; a paper veil dissolves the map (220 ms) while the photo moves from the card straight to its place on the vehicle screen (720 ms) and the veil clears; on arrival the photo fades out (900 ms) and the sketch is revealed behind it (700 ms, from 420 ms into the fade). See `05-vehicle-drawings.md` 4b | about 2.2 s in all |
| Close, Escape, click on sea | Flight back to k = 1; the panel leaves at once; callouts return on settle | 900 ms |
| Resize | Refit, repaint the mask, resample the dots; a selected market stays in focus | immediate |
| Reduced motion | No fade, instant flights and highlights, no card growth (direct navigation) | |

## 6. Accessibility

* The canvas has `role="img"` and a label naming the three markets and the interactions.
* The callout cards are the market buttons (`aria-pressed`), visible at rest, at least 44 px,
  with the blue focus ring; the connector layer is `aria-hidden`.
* The panel is a `section` labelled by its heading; Close is a 44 px button; the cards are links
  with the vehicle's name and figures as their text.
* The hidden h1 keeps the document outline; the live region announces hover and selection.

## 7. Tokens

```
--color-paper #ffffff   page
--color-ink #14171c     text
--color-ink-2 #5b6470   secondary text and figures
--color-blue #1c69d4    the one accent, also the market outline and the vehicle lines
--map-dot #cdd1d6
--map-fill #e9ecf0 · --map-fill-active #cddcf5
--map-outline #8e98a4 · --map-outline-active #1c69d4
--vehicle-wash #eef1f5 · --vehicle-wash-active #dce7f8
--vehicle-line #6b7480 · --vehicle-line-active #1c69d4
--vehicle-contour #14171c · --vehicle-contour-active #0f4fae
--vehicle-heat #1c69d4
```

## 8. How to tune

* Market view centres, magnification, callout subject and card anchors: `lib/map/regions.ts`.
* Fit window and Antarctica: `FIT_WINDOW` and `landFeature` in `lib/map/data.ts`.
* Focus anchor and padding: `RendererOptions.focus` (0.5, 0.4) and `padding` (16 px).
* Dot pitch and radius: `rebuild` and `drawDots` in `lib/map/renderer.ts`. Outline weight:
  `lineWidth` in `render`. Timings: `GLOW_IN`, `GLOW_OUT`, `FLIGHT_MS`.
* Callout and panel copy: `lib/site.ts`; domain icons: `lib/content/icons.ts`. Figures:
  refresh `content/markets.json` with `pnpm snapshot` against the running backend.
* Card width (420 px, same for two or three vehicles) and the shared ground line of the photos
  (`.vehicle-card-stage`, aspect 1600 : 610): `globals.css`.

## 9. Known limits

* 1:110m geometry is coarse; at full magnification the outlines are angular. A 1:50m topology
  (756 KB) is the next step if the magnified state needs detail.
* The mask encodes at most three markets; a fourth needs a second mask.
* The fit is width-limited; the only ways to a larger map are cropping longitude (which cuts
  Alaska or Russia) or letting the map bleed past the viewport.
* The hand-over photo lives in a layer of the root layout, so it is unaffected by the route
  change; the vehicle screen reports its measured target and the layer lands the photo on it.
* Touch and narrow screens are not tuned (team decision: desktop only).
