# Step 08 (UI track) – Grey markets that turn blue, vehicles as layered sketches

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured |
| Track | Frontend, in parallel with the backend track; no backend files touched |

## 1. What the team asked for

After step 07: the map is fine, but the market countries should rest in grey tones and may turn
blue on hover; and the dotted vehicles hide the car's structure and look poor, a layered,
sketch-like drawing would be better.

## 2. What was done

* **Markets grey at rest, blue when hovered or selected** (D-049). Fill `#e9ecf0` under outline
  `#8e98a4` at rest, cross-fading to `#cddcf5` under `#1c69d4` on hover and selection, with the
  same timing as before (180 ms in, 320 ms out). The layer construction of step 06 is unchanged;
  only the four `--map-*` tokens moved.
* **Vehicles as layered sketches** (D-050). The dot grid is gone. The pipeline now writes three
  alpha masks per view: the silhouette as a flat body wash, every line of the drawing, and the
  outer contour computed from the silhouette's edge (4 px at 1600 px width). The component tints
  them with tokens and stacks them: wash `#eef1f5`, lines `#6b7480`, contour `#14171c`. The
  heavier contour makes the body read at a glance; the lighter inner lines carry the panels,
  glass and wheels. Like the markets, a card's vehicle turns blue on hover (wash `#dce7f8`,
  lines `#1c69d4`, contour `#0f4fae`).
* **Heat map as soft washes.** On the vehicle screen the domain zones are now blue washes
  between the body wash and the lines, blurred (1.2 % of the width) and clipped to the body by
  the same silhouette mask, opacity 0.12 + 0.58 × complaint share, the active domain at 1. The
  zones were made a clean partition (unit test: no overlap in either view), since overlapping
  washes would stack.
* **Pipeline fixes found on the way.** Erased line pixels now leave the silhouette, so the
  G60's erased ground line no longer leaves an edge in the contour; the G70 raster strokes get a
  gamma of 1.6 so their weight approaches the vector drawings.

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm lint`, `pnpm typecheck`, `pnpm test` (7 tests), `pnpm build` | Clean |
| `pnpm audit:pages` on `/` and the seven vehicle pages | 0 findings |
| Screenshots (`frontend/docs/screenshots/`, 13 states, refreshed) | Resting map with grey markets and readouts, EU hover in blue, the three panels with sketch cards, card hover in blue, card growing, vehicle screens EU F70 and US G70 (hovered domain) with heat washes, CN G68 without heat, keyboard focus, 1920 px, reduced motion |
| Pipeline previews | Every view checked by eye: no ground-line remains, silhouettes closed (fill ratios 0.60 to 0.79) |
| Forbidden-list checklist (section 8) | Passed; no new exemption needed, E4 (card growth) unchanged |
| Asset sizes | 18 masks under `public/vehicles/`, 8 to 180 KB each (lines of the raster G70 are the largest) |

## 4. Decisions

D-049 and D-050 in `plan/decisions.md`; `frontend/docs/03-landing-map.md` and
`05-vehicle-drawings.md` updated.

## 5. Open for the team

1. In the G70 drawing the tyres are drawn apart from the wheel arches, so the contour traces
   both and the wheels look heavier than on F70 and G60; a vector drawing from BMW would fix it.
2. The zones are still rectangles (softened by the blur); shapes that follow the body are the
   next refinement.
3. The heat washes tint most of the body blue on the vehicle screen because every zone has a
   share; if a quieter screen is wanted, raise the floor share below which a zone stays grey.
4. `plan/06-pm-workspace-ux-spec.md` (merged from the backend track while this step was in
   progress) assumes a dark theme "consistent with the map screen" and a 3D car with mesh groups
   on its Screen 2. Both differ from the team's decisions on the UI track: the light palette
   (D-039) and the layered sketch drawings (D-050). The spec's Screen 2 car-as-filter is what the
   vehicle screen already does with the sketch; the two documents should be reconciled before
   Screen 1 is built.

