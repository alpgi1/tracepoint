# Landing hero: the market globe

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Status | Built and verified in step 04; copy and accent colour are drafts pending team review |
| Files | `components/ui/wireframe-dotted-globe.tsx` (React wrapper), `lib/globe/renderer.ts` (drawing and animation), `lib/globe/data.ts`, `lib/globe/raster.ts`, `lib/globe/math.ts`, `lib/globe/regions.ts`, `components/landing/market-stage.tsx`, `components/landing/hero.tsx`, `lib/site.ts` (copy), `app/globals.css` (tokens) |

## 1. What it does

A dotted wireframe globe sits beside the hero copy. It does not rotate on its own. The user can
drag it (mouse, pen, or a horizontal finger drag on touch); it coasts briefly after the drag and
stops. Three markets are selectable: China (CN), the United States (US) and the European Union
(EU, 27 member states merged into one outline). Hovering a market, on the globe or on its button,
brightens its dots, fills it softly and draws its outline. Clicking a market flies the camera to it
and scales the globe up so the market fills the frame; the readout under the globe names the
selection, a "Back to the globe" control and the Escape key return to the resting view, and
clicking another market flies there directly. Clicking open sea while zoomed returns to the globe.

## 2. What changed from the 21st.dev component

The user supplied `wireframe-dotted-globe` (d3 orthographic projection on a 2d canvas). It was
taken as the method and rewritten:

| Original | Here | Why |
|---|---|---|
| Auto-rotation timer | None; drag with coasting | The brief; the forbidden list bans loops |
| Wheel zoom with `preventDefault` | No wheel handling | The page must keep scrolling (no scroll hijacking) |
| Fetches Natural Earth land from `raw.githubusercontent.com` at runtime | `world-atlas` package copied to `public/globe/` before each build, version pinned, licence recorded | No third-party runtime dependency, reproducible |
| Land only | Land plus country geometries merged into three market outlines | The markets are the content |
| Lat/lon grid of dots (crowds the poles) | Rows of constant latitude with columns spaced by arc length, staggered by half a step | Even density everywhere, reads as a quiet grid |
| Point-in-polygon per dot in planar coordinates | Classification by a 2048 by 1024 raster mask painted once with d3 (about 0.18 degree accuracy) | Milliseconds instead of seconds, correct across the antimeridian |
| Dots projected one by one with d3 | Unit vectors rotated by a 3 by 3 matrix derived from d3's own rotation; one multiply per dot | Cheap per frame, provably identical to d3 (unit test) |
| Hard-coded `#000000` and `#ffffff` | Colours read from CSS custom properties on the canvas | Tokens in one place; the globe follows the theme |
| `console.log` statements | None | Clean console |
| Continuous `d3.timer` | Renders on demand; a frame loop runs only during drag, coast, flight and glow transitions | No idle CPU |
| "Drag to rotate · Scroll to zoom" badge | A readout line with the active market and the data attribution; the market buttons are the discoverable control | No instruction hints; keyboard and touch paths exist |
| No accessibility | `role="img"` with a label on the canvas; the three markets are real buttons with `aria-pressed`; readout is `aria-live="polite"`; Escape closes | Keyboard and screen-reader users get the same states |
| No reduced-motion handling | Entrance, coasting and flights are skipped; state changes are instant | Required by the forbidden list |

## 3. Data

* Source: Natural Earth 1:110m admin-0 boundaries (public domain) as packaged by `world-atlas`
  2.0.2 (ISC). `scripts/sync-globe-data.mjs` copies `countries-110m.json` (105 KB, about 40 KB
  gzipped) into `public/globe/` on `predev` and `prebuild`; the copy is git-ignored.
* Land is the merge of all country geometries. Each market is the merge of its member ids
  (`lib/globe/regions.ts`); for the EU the merged polygons outside longitude -32 to 45 are dropped,
  which removes French Guiana (Natural Earth files it under France). Malta is below the 1:110m
  resolution and is absent; the footer says so. Switzerland is a hole inside the EU outline and
  classifies as plain land.
* Dots: `latitudeRows(1.35)` gives about 22,600 sample points on the sphere; roughly 29 % fall
  on land and are kept as unit vectors (`Float32Array`) with a kind byte (land or market index).
* Unit tests (`lib/globe/globe.test.ts`, vitest): EU merge drops exactly one polygon; thirteen
  cities classify correctly (Berlin EU, Zurich land, Cayenne land, Beijing CN, Hainan CN, Taipei
  land, Denver, Honolulu and Anchorage US, open Atlantic sea); the rotation matrix matches d3's
  projection within 1e-6; dot rows scale with cos(latitude); the resting view keeps the EU and the
  US within 80 degrees and China beyond the horizon.

## 4. Rendering

Canvas 2d at device pixel ratio up to 2, sized by a `ResizeObserver` on a square wrapper
(`max-width: min(100%, 78vh)` on desktop). Draw order per frame:

1. Sphere: radial gradient from `--globe-sea-light` (offset to the upper left) to `--globe-sea`,
   1 px rim at `--globe-rim`.
2. Graticule every 15 degrees at `--globe-graticule`.
3. Land outlines at `--globe-land-line`.
4. Resting market outlines at 30 % of `--globe-signal`, 1 px, fading as the market activates.
5. Dots, batched into one fill per colour and depth bucket (four buckets of alpha from 0.55 to 1
   with the angle to the viewer): land dots in `--globe-dot`, market dots in `--globe-dot-market`,
   active market dots in `--globe-signal`, 35 % larger. Dot radius is 1.2 px times zoom^0.35.
6. Active market: fill at 10 % of the signal colour, a 7 px stroke at 16 % and a 1.5 px edge,
   all scaled by the market's glow value (0 to 1).

Colours come from `:root` custom properties (`--globe-*` in `app/globals.css`), read once at
attach. They use comma rgba syntax because the canvas parses them directly.

## 5. Interaction and timing

| State | Behaviour | Timing |
|---|---|---|
| Entrance | Copy lifts in with 0 / 70 / 160 / 260 / 360 ms delays; the globe fades in over 0.9 s and settles from 26 degrees west and 10 degrees south of the resting view | 1.5 s, expo-out, once |
| Resting view | Centre longitude -32, latitude 42: the EU and the US in sight, China one drag away | |
| Drag | 1 px at the centre is about 1 / scale radians; latitude clamped to -55 to 72 degrees; touch drags rotate longitude only (`touch-action: pan-y` keeps page scrolling) | immediate |
| Coast | Velocity from the last 120 ms of movement, exponential decay (half-life about 110 ms), stops under 0.015 degrees per ms | about 0.5 s |
| Hover | Glow value rises at 1 / 180 ms and falls at 1 / 320 ms; cursor `pointer` over a market, `grab` elsewhere on the disc, `grabbing` while dragging | 180 ms in, 320 ms out |
| Click | A press that moved under 4 px and lasted under 500 ms; on a market selects it, on sea while zoomed deselects | |
| Fly to market | Great-circle interpolation of the centre and linear interpolation of the zoom (CN 2.2, US 2.1, EU 2.6 times the resting radius), cubic in-out | 1,100 ms |
| Back | Same flight to the resting view; Escape key, the "Back to the globe" button, or a sea click | 1,100 ms |
| Reduced motion | No entrance, no coasting, instant flights and glow | |

Pointer handling uses pointer capture, so a drag that leaves the canvas keeps rotating. Hover on
the globe and on the market buttons share one state in `market-stage.tsx`; React state changes
only on enter, leave and click, never per frame.

## 6. Accessibility

* The canvas has `role="img"` and a label that names the three markets and says the buttons select
  them. It is not focusable; the buttons are the keyboard path and carry `aria-pressed`.
* The readout under the globe is `aria-live="polite"` and names the hovered or selected market.
* Focus rings use the signal colour, 2 px, 3 px offset. All controls are at least 44 px high
  (`.tap`), measured by the audit.
* Information is never colour-only: the selected market is named in the readout and in the
  pressed button.

## 7. Tokens

```
--color-night #0e1013   page        --color-chalk #eceef1    text
--color-night-2 #14171c raised      --color-chalk-2 #b4bac3  secondary text
--color-night-3 #1b1f25 hover       --color-chalk-3 #828a95  muted labels
--color-line 12 % chalk            --color-line-strong 28 % chalk
--color-signal #f5a524  accent (draft, see research notes section 7)
--globe-sea #111419 · --globe-sea-light #1e232b · --globe-rim 18 % chalk
--globe-graticule 7 % chalk · --globe-land-line 30 % chalk
--globe-dot #5c6670 · --globe-dot-market #9aa4b0 · --globe-signal = --color-signal
```

Type: Archivo variable (display at 92 % width, weight 600, -0.025 em), Archivo display cut for the
wordmark (62 % width, 800, uppercase), Geist Mono for labels (11 px, 0.08 em, uppercase, tabular
numerals). Fonts are self-hosted subsets shared with the portfolio (OFL texts alongside), 96 KB in
total.

## 8. How to tune

* Views and zoom levels: `lib/globe/regions.ts` (`view.center`, `view.zoom`, `HOME_VIEW`).
* Dot spacing: `DOT_SPACING` in `components/ui/wireframe-dotted-globe.tsx` (degrees of arc).
* Tilt limits, globe size inside the square: `RendererOptions` (`tiltRange`, `fill`).
* Timings: constants at the top of `lib/globe/renderer.ts` (`GLOW_IN`, `GLOW_OUT`,
  `INERTIA_DECAY`, `INERTIA_STOP`) and the `flyTo` and `enter` durations.
* Colours: the `--globe-*` properties in `app/globals.css`.

## 9. Known limits

* 1:110m geometry is coarse by design; coastlines and the US outline look angular at full zoom.
  A 1:50m topology (756 KB) would be the next step if the zoomed state needs detail.
* Hover and dot classification use the raster mask, accurate to about 0.18 degrees (about 1 px at
  rest, 3 px at full zoom).
* On touch devices vertical drags scroll the page rather than tilting the globe.
* Lighthouse in this container inflates main-thread numbers for canvas pages (software
  rendering); measure on a real device before publishing performance figures.
