# Landing page: the dotted world map

| Field | Value |
|---|---|
| Date | 2026-10-10 (replaces the globe of step 04) |
| Status | Built and verified in step 05 |
| Files | `components/ui/dotted-world-map.tsx` (React wrapper), `lib/map/renderer.ts` (drawing and animation), `lib/map/data.ts`, `lib/map/regions.ts`, `components/landing/map-stage.tsx`, `lib/site.ts` (assistive copy), `app/globals.css` (tokens) |

## 1. What it does

The whole page is a dotted world map on white. Nothing else is on screen when the page opens:
no header, no copy, no footer. The land is a square grid of light grey dots, like a printed
halftone. Three markets are selectable: China (CN), the United States (US) and the European
Union (EU, 27 member states merged into one outline). Hovering a market turns its dots blue,
fills it with a faint blue and draws its outline. Clicking a market magnifies the map around it
(900 ms); Escape or a click on open sea returns; clicking another market flies there directly.
Desktop is the target; nothing is tuned for touch.

Keyboard and assistive technology get the same states through three real buttons, one per market,
visually hidden until focused. A focused button shows the market's name at the market's place on
the map, Enter selects, Escape returns, and a polite live region names the state.

## 2. Why the globe was replaced

The step 04 hero (dark page, dotted globe, headline column, mono labels, chip buttons, status
strip) was the generic "dark tech" landing template and failed the forbidden list on several
counts (see `02-forbidden-list.md`, section 0). The team asked for a white page, a blue accent,
a flat map like a halftone world map, and no text at all on first view.

## 3. Data

* Source: Natural Earth 1:110m admin-0 boundaries (public domain) packaged by `world-atlas` 2.0.2
  (ISC). `scripts/sync-map-data.mjs` copies `countries-110m.json` (105 KB, 39 KB gzipped) into
  `public/map/` on `predev` and `prebuild`; the copy is git-ignored.
* Land is the merge of all country geometries. Each market is the merge of its member ids
  (`lib/map/regions.ts`); for the EU, merged polygons outside longitude -32 to 45 are dropped,
  which removes French Guiana. Malta is below the resolution and absent. Switzerland is a hole in
  the EU outline and counts as plain land.
* Unit tests (`lib/map/map.test.ts`, vitest): the EU merge drops exactly one polygon; thirteen
  cities classify correctly (Berlin EU, Zurich land, Cayenne land, Beijing and Hainan CN, Taipei
  land, Denver, Honolulu and Anchorage US, open Atlantic sea); the Natural Earth fit keeps the
  whole sphere inside the padded extent and every market's view centre on the map and inside its
  own outline.

## 4. Rendering

* Projection: `geoNaturalEarth1`, fitted to the canvas with 48 px padding (`fitExtent` on the
  sphere), so the map is as wide as the window allows and vertically centred.
* Mask: the land and the three markets are painted once per resize into an offscreen canvas with
  additive compositing (land in the blue channel, markets in the red and green channels). A pixel
  belongs to a class when that channel is at least half covered, so anti-aliased edges never leak
  into a neighbouring class. The mask answers both "which dot is where" and "what is under the
  pointer" in one pixel read.
* Dots: a square screen-space grid over the land of the fitted map. Pitch is the map width
  divided by 230, clamped to 4 to 9 px (about 5.8 px at 1440, 7.9 px at 1920); radius is 0.3 of
  the pitch. About 9,000 dots at 1440 by 900, stored once as base coordinates.
* Zoom: an affine transform (scale k, translation) applied to the base coordinates, so the dot
  pattern magnifies like a print; the market outlines are drawn by a second projection carrying
  the same transform. Dot radius grows with the square root of k.
* Colours from `:root` custom properties: `--map-dot #cdd1d6`, `--map-dot-market #a9b0b8`
  (markets a touch darker at rest), `--map-accent #1c69d4`.
* Draw order per frame: dots batched by colour (one fill per group), then resting outlines of the
  markets at 18 % blue, then the active market as a 7 % blue fill, an 8 px stroke at 12 % and a
  1.5 px edge at 95 %, all scaled by the market's highlight value (0 to 1).
* Renders on demand; a frame loop runs only during a flight or a highlight transition.

## 5. Interaction and timing

| State | Behaviour | Timing |
|---|---|---|
| Entrance | The canvas fades in once its data is there | 600 ms, once |
| Hover | Highlight value rises at 1 / 180 ms and falls at 1 / 320 ms; `pointer` cursor over a market, default elsewhere | 180 ms in, 320 ms out |
| Click on a market | Flight: the base-space point of the market's view centre moves to the viewport centre while k goes from the current value to the market's zoom (CN 2.6, US 2.4, EU 3.2), geometric interpolation, cubic in-out | 900 ms |
| Click on sea while magnified, Escape | Flight back to k = 1 | 900 ms |
| Resize | Refit, repaint the mask, resample the dots; a selected market stays centred | immediate |
| Reduced motion | No fade, instant flights and highlights | |

## 6. Accessibility

* The canvas has `role="img"` and a label naming the three markets and the interactions.
* The market keys are real buttons with `aria-pressed`, positioned at the market centres; the
  focus ring is the blue token, 2 px with 3 px offset. They take no pointer events, so the canvas
  keeps the pointer; the audit skips them as tap targets for that reason.
* The hidden h1 keeps the document outline; the live region announces hover and selection.

## 7. Tokens

```
--color-paper #ffffff   page (team decision, pure white)
--color-ink #14171c     text, when text exists
--color-ink-2 #5b6470   secondary text
--color-blue #1c69d4    the one accent, also --map-accent
--map-dot #cdd1d6 · --map-dot-market #a9b0b8
```

Fonts (Archivo variable, Geist Mono) stay installed for later surfaces and are not preloaded,
since nothing on the page shows text.

## 8. How to tune

* Market view centres and magnification: `lib/map/regions.ts`.
* Dot pitch and radius: `rebuild` and `drawDots` in `lib/map/renderer.ts` (230 columns across
  the map, radius 0.3 of the pitch).
* Timings: `GLOW_IN`, `GLOW_OUT`, `FLIGHT_MS` at the top of the renderer.
* Padding around the map: `RendererOptions.padding` (48 px).
* Colours: the `--map-*` properties in `app/globals.css`.

## 9. Known limits

* 1:110m geometry is coarse; at full magnification the outlines are angular. A 1:50m topology
  (756 KB) is the next step if the magnified state needs detail.
* The mask encodes at most three markets; a fourth needs a second mask.
* Touch and narrow screens are not tuned (team decision: desktop only).
* Lighthouse in this container inflates main-thread numbers for canvas pages; measure on a real
  device before publishing performance figures.
