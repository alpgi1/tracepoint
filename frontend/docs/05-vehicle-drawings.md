# Vehicle drawings and the vehicle screen

| Field | Value |
|---|---|
| Date | 2026-10-10, step 07 |
| Status | Built and verified; revised in step 08 from a dot cloud to a layered sketch and in step 10 with crisp card lines, radial heat, leader lines and list cards, after the team's reviews; zones are a first approximation for the team to correct |
| Files | `scripts/vehicles/build.mjs` (pipeline), `assets/vehicles/sources/` (inputs and their README), `public/vehicles/*.png` (body, lines and contour masks), `content/vehicles/*.json` (size, box, scale), `lib/vehicles/` (drawings, zones, layout), `components/vehicles/vehicle-drawing.tsx`, `components/workspace/vehicle-workspace.tsx`, `app/markets/[market]/[vehicle]/page.tsx` |

## 1. Why drawings and not 3D

`04-vehicle-models-feasibility.md` found no accurate current-generation BMW model with a clean
licence. The team then pointed at the technical drawing page of the option-list brochures and
asked for the vehicles to grow when clicked, with the same asset serving as the domain selector
on the vehicle screen. Step 07 filled the silhouettes with a dot grid; the team found that the
dots hid the car's structure and looked poor, and asked for a layered sketch instead (step 08).
Line drawings of the real bodies at real proportions, from BMW's own documents, stacked as a
body wash, the drawing's lines and a heavier outer contour, meet that without any invented
geometry.

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
4. **Layers.** From the silhouette: the body mask (the silhouette, feathered by 0.6 px) and
   the contour mask (the silhouette's edge dilated to 3 px, feathered); from the ink: the lines
   mask at 1600 px and a second lines mask at 520 px for the cards, where the car is shown at
   about a quarter of the raster width and the thin lines would otherwise break up. For the
   vector pages the small mask is a fresh render with every stroke raised to 0.8 pt and the
   filled shapes given a stroke; for the raster it is the ink dilated by one pixel before
   resizing. All masks are alpha-only PNGs.
5. **Outputs.** `public/vehicles/<code>-<view>-body.png`, `-lines.png`, `-lines-small.png` and
   `-contour.png` (8 to 180 KB each, twenty-four files) and `content/vehicles/<code>-<view>.json`
   with the size, the silhouette box, the millimetre scale and the source note. `--preview
   <dir>` also writes the three layers composed per view for a visual check.

## 4. Rendering (`components/vehicles/vehicle-drawing.tsx`)

* Each mask is a `span` filled with a token and clipped by the PNG through CSS `mask-image`,
  stacked in order: the body wash (`--vehicle-wash #eef1f5`), the heat washes where there are
  zones, the lines (`--vehicle-line #6b7480`; cards take the small mask through `size="card"`),
  the contour on top (`--vehicle-contour #14171c`). The heavier contour makes the body read at
  a glance; the lighter inner lines carry the panels, glass and wheels. The result is a sketch,
  not a photograph and not a dot cloud.
* Like the markets, a vehicle is grey at rest and turns blue when hovered: the card's hover and
  focus switch the three layers to `--vehicle-wash-active #dce7f8`, `--vehicle-line-active
  #1c69d4` and `--vehicle-contour-active #0f4fae`.
* Heat: an SVG between the wash and the lines, clipped to the body by the same body mask, draws
  one ellipse per zone rectangle filled with a radial gradient of `--vehicle-heat #1c69d4`
  (full at the centre, clear at the rim, reaching 18 % past the rectangle so neighbours
  blend), with opacity 0.07 + 0.75 × the domain's heat and 1 for the active domain. Heat is
  relative within the vehicle: the lowest complaint share maps to 0 and the highest to 1, so
  the washes show where this car's complaints concentrate rather than tinting the whole body.
  Zones never overlap (unit test), since overlapping washes would stack.
* Unit tests check that every drawing carries its three layers, a silhouette box inside the
  raster and a consistent scale, and that the zones partition without overlap.

## 5. The vehicle screen (`/markets/<market>/<vehicle>`)

* Static routes for the seven market and vehicle pairs (`generateStaticParams`); an unknown pair
  renders the not-found page (with status 200 under partial prerendering; see limits).
* Header: a Map link back, the vehicle's name and code, the market, 2025 units, verbatims, and
  the drawing note for G68.
* Stage (left, at most 1040 px): the side view with the heat washes, the top view at 62 % width
  below it, and the zone note. Hovering a zone highlights its domain in the list and
  shows its themes; clicking selects it. Zone hit areas are mouse shortcuts; the list is the
  keyboard route to the same actions.
* Leader lines: one SVG over the two columns joins each side-view zone (a dot at the centre of
  its largest rectangle) to its row in the list with a single curve, horizontal at both ends.
  Positions are measured from the DOM after layout and on resize (`ResizeObserver`); the
  hovered or selected domain's line and dot turn blue, the others stay faint. The method is
  the annotation callout of the team's reference image; the lines carry no text.
* Domains (right, 400 px): a card with every domain of the vehicle's baseline report except
  `general`, sorted by complaint share, each a button with name, share, row count and a bar in
  the one blue; the selected row carries a blue outline. A second card shows the selected or
  hovered domain's top complaint themes (up to six, by complaints) with rows, defects,
  difficult to use and wants.
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
the screen. They are rectangles softened by the blur; shapes that follow the body are the next
refinement if the team keeps the screen.

## 7. Honesty notes

* Every number on the cards and the screen is a field of `content/markets.json` with a source.
  The weakest domain requires at least 50 classified rows; the EU G60 (111 verbatims) and the
  CN vehicles therefore fall back to the study score and say so.
* The G70 drawing is the pre-facelift 7 Series press sheet; it shows the seats, which the
  brochure drawings do not, and its lines are softer because the source is a raster. The
  contour layer, computed from the silhouette, is as crisp as the others.
* The G68 drawing is the G60 body; the card and the screen say so.
* The press sheet is BMW Group press material for editorial use; the rights must be cleared
  before any public release.

## 8. How to regenerate

```
pnpm content     # content/markets.json from reports/baseline, docs/*.xlsx and config/
pnpm vehicles    # public/vehicles/*-{body,lines,contour}.png and content/vehicles/*.json from assets/vehicles/sources
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
* The layers are rasters at 1600 px width (520 px for the card lines); the vehicle screen shows
  them at up to 1040 px, so they stay crisp on 1x screens and slightly soft on 2x screens.
* In the G70 press drawing the tyres are drawn apart from the wheel arches, so the contour
  traces both and the wheels read heavier than on the two vector drawings.
