# Step 11 (UI track) – The configured cars on the map, the hand-over, the plain sketch

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured |
| Track | Frontend, in parallel with the backend track; no backend files touched |

## 1. What the team asked for

Three configurator links (F70, G60, G70) and the flow: map, click a market, the real configured
cars as the vehicle cards, click a car and it fills the screen as its side profile, then on the
way to the next screen it moves to the car's place there, the photo fades out and the sketch
fades in. And the sketch itself in the style of the reference image: parts clear and distinct,
no heavy black contour, no thermal areas on the car, no lines or arrows between the car and
the cards.

## 2. What was done

* **Photos of the configured cars** (D-053). The configurator pages were opened headless; the
  response of the BMW image service they call lists named views of the configured car, and the
  SIDELEFT desktop view (2560 by 1646 px, studio "sand") was downloaded for each car. The
  signed image URLs work without the configurator's key; the list endpoint does not, which is
  why the capture goes through the page. A pipeline (`scripts/vehicles/photos.mjs`) lifts each
  car off the studio by one colour test (the studio is warm, the car is not), cleans the mask
  (opening, largest component, hole filling, closing, feather) and writes a tight transparent
  cut-out at 1600 px (47 to 65 KB each). Sources, dates and the rights note are in
  `assets/vehicles/photos/README.md`. G68 shows the G60 photo and says so.
* **Cards.** The magnified market's cards show the photos, bottom-aligned on one ground line;
  hover lifts the photo by 3 px.
* **Hand-over** (E4 revised). Click: a paper veil covers the page, the photo grows to full
  screen (520 ms) and holds (420 ms), then moves to the place the sketch has on the vehicle
  screen (560 ms) and the route changes with a flag in `sessionStorage`. The vehicle screen
  reads the flag before its first paint, shows the same photo at that place (percentages of the
  drawing's silhouette box, roof on roof, the same length) and cross-fades to the sketch
  (700 ms). A direct visit shows the sketch at once; reduced motion navigates at once.
* **The sketch** (D-054). Two greys on a near-white wash: lines `#5f6873`, a 2 px contour
  `#4f5864` (an edge, not a frame), wash `#f3f5f8`. The heat washes, the zone hit areas and the
  leader lines of steps 07 to 10 are removed; the domain figures stay in the two cards beside
  the car. The zones file stays without a consumer.

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm lint`, `pnpm typecheck`, `pnpm test` (8 tests, photos included), `pnpm build` | Clean |
| `pnpm audit:pages` on `/` and the seven vehicle pages | 0 findings |
| Hand-over probe at 1280, 1440 and 1920 px | The moved photo box and the vehicle screen's photo land on the same pixel (1440: x 79, y 147, width 800); the photo's opacity goes 1 to 0 and the sketch's 0 to 1 over the fade; no console errors |
| Cards | The three photos share one bottom line (806 px at 1440 by 900) |
| Cut-outs | Checked by eye for the three cars: clean edges, wheels and glass intact, the floor shadow kept with the car |
| Screenshots (`frontend/docs/screenshots/`, 14 states) | Panel with photos, card hover, the photo at full screen, the hand-over on the vehicle screen, the sketch pages, callouts, keyboard focus, 1920 px, reduced motion |
| Forbidden-list checklist | Passed: the photos are the team's configured cars, identified as such, not stock or AI imagery; one accent; no gradient, glow or glass |

## 4. Open for the team

1. The configurator renders are BMW AG material; the prototype is internal, and the rights must
   be cleared before any public release.
2. The photos carry the car's floor shadow, so on the vehicle screen the photo's wheels sit a
   little below the drawn ground during the cross-fade; aligning on the wheels instead of the
   roof is a one-line change if preferred.
3. The sketch is the drawing's own lines in two greys. The reference image also shades the glass
   and the tyres; that needs the drawing's parts segmented, which the brochure pages do not
   provide.
4. The route change in the middle of the hand-over can drop a frame on a slow machine; a
   shared-element view transition would make it one step.
