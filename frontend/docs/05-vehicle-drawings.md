# Vehicle drawings and the vehicle screen

| Field | Value |
|---|---|
| Date | 2026-10-10, step 07 |
| Status | Built and verified; revised in step 08 (dot cloud to layered sketch), step 10 (crisp card lines) and step 11 (plain sketch without heat or leader lines, photos of the configured cars on the cards, photo-to-sketch hand-over), after the team's reviews |
| Files | `scripts/vehicles/build.mjs` (drawing pipeline), `scripts/vehicles/photos.mjs` (photo cut-outs), `assets/vehicles/sources/` and `assets/vehicles/photos/` (inputs and their READMEs), `public/vehicles/` (masks and cut-outs), `content/vehicles/*.json`, `lib/vehicles/` (drawings, photos, layout, hand-over, zones), `components/vehicles/vehicle-drawing.tsx`, `components/landing/vehicle-card.tsx`, `components/workspace/vehicle-workspace.tsx`, `app/markets/[market]/[vehicle]/page.tsx` |

## 1. Why drawings and not 3D

`04-vehicle-models-feasibility.md` found no accurate current-generation BMW model with a clean
licence. The team then pointed at the technical drawing page of the option-list brochures and
asked for the vehicles to grow when clicked. Step 07 filled the silhouettes with a dot grid; the
team found that the dots hid the car's structure and looked poor, and asked for a layered
sketch instead (step 08). In step 11 the team set the final form against a reference image: a
plain technical sketch with clear parts, no heavy black contour, no heat washes on the body and
no leader lines to the cards; and the cards on the map show the real configured cars from the
BMW configurator, whose photo grows to full screen and hands over to the sketch on the vehicle
screen. Line drawings of the real bodies at real proportions, from BMW's own documents, meet
that without any invented geometry.

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
   the contour mask (the silhouette's edge dilated to 2 px, feathered: an edge, not a frame);
   from the ink: the lines mask at 1600 px and a second lines mask at 520 px, kept for any
   small rendering (the cards now show photos). For the vector pages the small mask is a fresh
   render with every stroke raised to 0.8 pt and the filled shapes given a stroke; for the
   raster it is the ink dilated by one pixel before resizing. All masks are alpha-only PNGs.
5. **Outputs.** `public/vehicles/<code>-<view>-body.png`, `-lines.png`, `-lines-small.png` and
   `-contour.png` (8 to 180 KB each, twenty-four files) and `content/vehicles/<code>-<view>.json`
   with the size, the silhouette box, the millimetre scale and the source note. `--preview
   <dir>` also writes the three layers composed per view for a visual check.

## 4. Rendering (`components/vehicles/vehicle-drawing.tsx`)

* Each mask is a `span` filled with a token and clipped by the PNG through CSS `mask-image`,
  stacked in order: the body wash (`--vehicle-wash #f3f5f8`), the lines (`--vehicle-line
  #5f6873`), the contour on top (`--vehicle-contour #4f5864`, one step darker than the lines
  and 2 px at 1600 px, so the body closes without a frame). The result is a sketch in two
  greys on a near-white wash, like the team's reference: the panels, glass and wheels are the
  drawing's own lines, nothing is overlaid on the body.
* No heat and no leader lines (team decision, step 11). The domain figures live in the cards
  beside the car; the zones of step 07 to 10 are kept in `lib/vehicles/zones.ts` without a
  consumer, in case the team wants the car as a selector again.
* Unit tests check that every drawing carries its three layers, a silhouette box inside the
  raster and a consistent scale, that the zones partition without overlap, and that every
  drawing has a photo cut-out with its size and source.

## 4a. Photos of the configured cars (`scripts/vehicles/photos.mjs`)

* Sources: the SIDELEFT desktop view (2560 by 1646 px, studio background "sand") of each car
  from the configurator links the team supplied, taken from the response of the BMW image
  service the configurator itself calls; details, dates and the rights note are in
  `assets/vehicles/photos/README.md`.
* Cut-out: the studio is warm everywhere (red exceeds blue by at least 7 at a brightness of
  150 or more) and the cars' paint, glass, wheels and lights are not, so that one test
  separates them; the mask is cleaned by an opening (specks), the largest component (the car),
  hole filling (warm reflections on the paint), a closing (notches) and a one pixel feather.
  The car's shadow on the floor is dark and stays with the car, which is why the cut-outs are
  slightly taller than the body. Output: `public/vehicles/<code>-photo-side.webp` at 1600 px
  (47 to 65 KB each) and `content/vehicles/<code>-photo.json`.
* The cards on the magnified market show these photos, bottom-aligned in a row (`.vehicle-card-stage`,
  aspect 1600 : 610, so the three cars share one ground line); G68 shows the G60 photo and says
  so.

## 4b. Hand-over from the map to the vehicle screen (`vehicle-card.tsx`, `vehicle-workspace.tsx`)

1. Click on a card: a paper veil covers the page and the photo grows from the card to full
   screen (90 % of the viewport width, at most 1500 px, at most 80 % of the height), 520 ms,
   cubic in-out; it holds for 420 ms.
2. The photo moves to the place the drawing has on the vehicle screen (`photoTarget` in
   `lib/vehicles/layout.ts`: the stage column, the drawing's silhouette box, roof on roof and
   the same length), 560 ms; then the route changes with a hand-over flag in `sessionStorage`.
3. The vehicle screen reads the flag before its first paint, shows the same photo at that place
   (percentages of the drawing's box, so the pixels agree with step 2), and cross-fades over
   700 ms: the photo fades out, the sketch fades in. A direct visit shows the sketch at once.
   With reduced motion the card navigates at once and no cross-fade runs.

The probe in the step 11 report measured the move target and the landing position equal to the
pixel at 1280, 1440 and 1920 px.

## 5. The vehicle screen (`/markets/<market>/<vehicle>`)

* Static routes for the seven market and vehicle pairs (`generateStaticParams`); an unknown pair
  renders the not-found page (with status 200 under partial prerendering; see limits).
* Header: a Map chip back, the vehicle's name and code, the market, 2025 units, verbatims, and
  the drawing note for G68.
* Stage (left, at most 1040 px): the side view sketch, the top view at 62 % width below it;
  the hand-over photo sits over the side view only while arriving from the map.
* Domains (right, 400 px): a card with every domain of the vehicle's baseline report except
  `general`, sorted by complaint share, each a button with name, share, row count and a bar in
  the one blue; the selected row carries a blue outline. A second card shows the selected or
  hovered domain's top complaint themes (up to six, by complaints) with rows, defects,
  difficult to use and wants.
* Markets without classified verbatims (CN): a plain statement of that and the study's three
  lowest attribute scores with the scale and the overall mean.
* Decisions are not built.

## 6. Zones (`lib/vehicles/zones.ts`, kept without a consumer)

Rectangles in the silhouette box, x from the front (0) to the rear (1), y from the roof (0) to
the ground (1) in the side view and across the body in the top view, one domain each, tested
not to overlap. They were the heat map and the hit areas of steps 07 to 10 and stay available
if the team wants the car as a domain selector again.

## 7. Honesty notes

* Every number on the cards and the screen is a field of `content/markets.json` with a source.
  The weakest domain requires at least 50 classified rows; the EU G60 (111 verbatims) and the
  CN vehicles therefore fall back to the study score and say so.
* The G70 drawing is the pre-facelift 7 Series press sheet; it shows the seats, which the
  brochure drawings do not, and its lines are softer because the source is a raster. The
  contour layer, computed from the silhouette, is as crisp as the others.
* The photos are the team's own configurations (paint and wheels as configured), not the
  study or sales population; they identify the vehicle, nothing more.
* The G68 drawing is the G60 body; the card and the screen say so.
* The press sheet is BMW Group press material for editorial use; the rights must be cleared
  before any public release.

## 8. How to regenerate

```
pnpm content     # content/markets.json from reports/baseline, docs/*.xlsx and config/
pnpm vehicles    # public/vehicles/*-{body,lines,lines-small,contour}.png and content/vehicles/*.json from assets/vehicles/sources
pnpm photos      # public/vehicles/*-photo-side.webp and content/vehicles/*-photo.json from assets/vehicles/photos
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
* The layers are rasters at 1600 px width; the vehicle screen shows them at up to 1040 px and
  the full-screen photo at up to 1500 px, so both stay crisp on 1x screens and slightly soft on
  2x screens.
* The hand-over is two steps (the photo moves, then the route changes and the new page paints
  the same photo); a frame can be dropped at the route change on a slow machine. A shared
  element view transition would make it one step.
* In the G70 press drawing the tyres are drawn apart from the wheel arches, so the contour
  traces both and the wheels read heavier than on the two vector drawings.
