# Vehicle drawings and the vehicle screen

| Field | Value |
|---|---|
| Date | 2026-10-10, step 07 |
| Status | Built and verified; zones are a first approximation for the team to correct |
| Files | `scripts/vehicles/build.mjs` (pipeline), `assets/vehicles/sources/` (inputs and their README), `public/vehicles/*.png` (lines), `content/vehicles/*.json` (dot runs), `lib/vehicles/` (drawings, dots, zones, layout), `components/vehicles/vehicle-drawing.tsx`, `components/workspace/vehicle-workspace.tsx`, `app/markets/[market]/[vehicle]/page.tsx` |

## 1. Why drawings and not 3D

`04-vehicle-models-feasibility.md` found no accurate current-generation BMW model with a clean
licence. The team then pointed at the technical drawing page of the option-list brochures and
asked for the vehicles as dot clouds, or dots and lines together, that grow when clicked, with
the same asset serving as the domain selector on the vehicle screen. Line drawings of the real
bodies at real proportions, from BMW's own documents, meet that without any invented geometry.

## 2. Sources (details and licence notes in `assets/vehicles/sources/README.md`)

| Vehicle | Drawing | Source | Form |
|---|---|---|---|
| F70, 1 Series | side and top | `docs/F70_OptionList.PDF` page 21 | vector (page exported with `pdftocairo -svg`) |
| G60, 5 Series Sedan | side and top | `docs/G60_OptionList.PDF` page 26 | vector |
| G70, 7 Series | side and top | BMW Group PressClub specification sheet (04/2022), page 9, fetched 2026-10-10 (team choice: the G70 brochure has photographs only) | raster, 1110 by 1452 px |
| G68, 5 Series LWB (China) | borrows G60 | no drawing in `docs/` | the UI says "Drawing shows the standard-wheelbase 5 Series body" |

## 3. Pipeline (`pnpm vehicles`)

1. **Strip the dimension annotations.** Vector pages: glyph `<use>` elements, strokes thinner
   than 0.15 pt, black fills smaller than 4 pt (arrowheads; the G60 page draws the car itself as
   large black fills, so size decides), and straight-only paths that are either a single segment
   longer than 25 pt (shafts) or entirely axis-aligned (dimension boxes, ground lines, ticks).
   Paths inside `<clipPath>` are left alone, since deleting a clip rectangle clips everything
   away. The G60 ground line shares a path with parts of the car and is erased after rasterising
   instead. Raster page: the interior arrows and their labels are erased with white rectangles,
   lines and circles at known pixel positions; ink is read as `(235 - grey) / 165`.
2. **Crop and rasterise** each view with sharp (librsvg for the vector pages) at 1600 px width;
   ink coverage per pixel is normalised so the darkest line is full ink.
3. **Silhouette.** Pixels with ink at or above 0.25, dilated by one pixel, are walls; the outside
   is flooded from the image border; everything else, lines included, is the car. The box is
   measured on the interior only. Fill ratios: F70 0.64 / 0.77, G60 0.66 / 0.78, G70 0.57 / 0.79
   (side / top); the pipeline warns below 0.45, which is what a leaking outline looks like.
4. **Dot runs** on two square grids with a constant physical pitch, 64 mm (coarse, cards) and
   32 mm (fine, the vehicle screen), derived from the silhouette width and the overall length
   (F70 4361 mm, G60 5060 mm, G70 5391 mm). Runs are stored per row as `[j, i0, n, i0, n, ...]`,
   which keeps each view's JSON under 2 KB. Dot counts: F70 1,143 / 4,547, G60 1,454 / 5,875,
   G70 1,386 / 5,552 (side, coarse / fine).
5. **Outputs.** `public/vehicles/<code>-<view>.png`, the lines as an alpha mask (90 to 180 KB
   each, six files), and `content/vehicles/<code>-<view>.json` with the grids, the box, the
   millimetre scale and the source note. `--preview <dir>` also writes a composite per view for a
   visual check.

## 4. Rendering (`components/vehicles/vehicle-drawing.tsx`)

* The dots are an SVG: one `<path>` of `M x y H x2` subpaths per run group, drawn with
  `stroke-dasharray="0 pitch"` and round caps, so each dash is a dot and the grid scales crisply
  under any transform. Dot diameter is 0.6 of the pitch, like the map's dots.
* The lines are the PNG applied as a CSS `mask-image` on a span filled with `--vehicle-line`, so
  the line colour is a token. Dots sit under the lines.
* Colours: `--vehicle-dot #c5d5ef`, `--vehicle-dot-active #9fb9e3` (card hover),
  `--vehicle-line #1c69d4`, `--vehicle-heat #1c69d4` and `--vehicle-heat-active #0f4fae`.
* With zones, the runs of each domain form their own path (`lib/vehicles/dots.ts`, a run is
  split where the zone changes), and a heat value per domain sets that path's opacity
  (0.18 + 0.82 × complaint share); the active domain is drawn in the darker blue at full opacity.
  Unit tests check that grouping loses no dot, that every dot stays inside the silhouette box and
  that the physical pitch holds across vehicles.

## 5. The vehicle screen (`/markets/<market>/<vehicle>`)

* Static routes for the seven market and vehicle pairs (`generateStaticParams`); an unknown pair
  renders the not-found page (with status 200 under partial prerendering; see limits).
* Header: a Map link back, the vehicle's name and code, the market, 2025 units, verbatims, and
  the drawing note for G68.
* Stage (left, at most 1040 px): the side view at fine density with the heat map, the top view at
  62 % width below it, and the zone note. Hovering a zone highlights its domain in the list and
  shows its themes; clicking selects it. Zone hit areas are mouse shortcuts; the list is the
  keyboard route to the same actions.
* Domains (right, 400 px): every domain of the vehicle's baseline report except `general`, sorted
  by complaint share, each a button with name, share, row count and a bar; the selected or hovered
  domain shows its top complaint themes (up to six, by complaints) with rows, defects, difficult
  to use and wants.
* Markets without classified verbatims (CN): no heat map, a plain statement of that, and the
  study's three lowest attribute scores with the scale and the overall mean.
* Decisions are not built; this screen is the domain selector the team described.

## 6. Zones (`lib/vehicles/zones.ts`)

Rectangles in the silhouette box, x from the front (0) to the rear (1), y from the roof (0) to
the ground (1) in the side view and across the body in the top view. A dot belongs to the first
zone that contains it; the silhouette clips the rectangles.

| Domain | Side view | Top view |
|---|---|---|
| Driver Assistance & Parking | front end below the lights | front end |
| Exterior & Design | front fascia above, roof strip, rear end | both flanks, rear end |
| Powertrain, Range & Charging | under the bonnet, underfloor between the wheels | bonnet |
| Driving Experience & Dynamics | both wheels and arches | none |
| Infotainment & Digital Services | dashboard, behind the windscreen | windscreen base |
| Interior Comfort & Materials | cabin | cabin |
| Space & Practicality | boot and rear seats | boot |
| Quality Perception & NVH | doors and sills, lower middle | none |
| Offering & Variants, General | no zone | no zone |

These are the team's approximation of where a customer experiences a domain, stated as such on
the screen. They are rectangles, so zone edges show as blocks; a shape that follows the body (or
a second pass with softened edges) is the next refinement if the team keeps the screen.

## 7. Honesty notes

* Every number on the cards and the screen is a field of `content/markets.json` with a source.
  The weakest domain requires at least 50 classified rows; the EU G60 (111 verbatims) and the
  CN vehicles therefore fall back to the study score and say so.
* The G70 drawing is the pre-facelift 7 Series press sheet; it shows the seats, which the
  brochure drawings do not, and its lines are softer because the source is a raster.
* The G68 drawing is the G60 body; the card and the screen say so.
* The press sheet is BMW Group press material for editorial use; the rights must be cleared
  before any public release.

## 8. How to regenerate

```
pnpm content     # content/markets.json from reports/baseline, docs/*.xlsx and config/
pnpm vehicles    # public/vehicles/*.png and content/vehicles/*.json from assets/vehicles/sources
node scripts/vehicles/build.mjs --preview /tmp/preview   # plus composites to look at
```

Both outputs are committed so the app builds without poppler or the workbooks. The pipeline needs
`sharp` (dev dependency) and Node 22.

## 9. Known limits

* Unknown market or vehicle slugs return the not-found page with HTTP 200, because the page is
  partially prerendered and the status is sent before the dynamic part runs. `dynamicParams =
  false` would give a real 404 but is incompatible with cache components in this Next.js version.
* The hover-driven theme list updates a polite live region; screen reader users who hover with a
  pointer hear every change.
* Only the side view is used on the cards; the top view appears on the vehicle screen only.
