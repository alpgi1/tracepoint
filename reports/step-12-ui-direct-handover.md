# Step 12 (UI track) – The hand-over without a full-screen stop

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured |
| Track | Frontend, in parallel with the backend track; no backend files touched |

## 1. What the team asked for

Two changes to the step 11 hand-over: no full-screen step, the photo should go from the card
straight to its place on the sketch; and once there it should not stay, it should slowly fade
away and the sketch should appear behind it.

## 2. What was done (D-055)

* **A layer that survives the route change.** The photo now travels in `HandoffLayer`,
  mounted in the root layout. The card hands it the photo, the card's box and a computed
  fallback target, and navigates at once; the vehicle screen renders underneath, measures the
  silhouette box of its side view after layout and reports it as the target.
* **The sequence.** A paper veil dissolves the map (220 ms). The photo moves from the card
  straight to the target (720 ms, cubic in-out) while the veil clears (450 ms), so the
  screen's header and cards appear under the moving photo. On arrival the photo fades out
  (900 ms); 420 ms into the fade the sketch is revealed (700 ms) behind the clearing photo. The
  layer unmounts about 2.2 s after the click. The `sessionStorage` flag of step 11 is gone; a
  direct visit shows the sketch at once; with reduced motion the card only navigates.

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm check` (lint, typecheck, 8 tests, build) | Clean |
| `pnpm audit:pages` on `/` and the seven vehicle pages | 0 findings |
| Timeline probe at 1280, 1440 and 1920 px | Route arrives in 18 to 27 ms; the photo lands on the measured box to the pixel (1440: x 79, y 147, width 800); veil 0 to 1 to 0 by 700 ms; photo opacity 1 to 0 between about 1.0 and 1.8 s; sketch 0 to 1 between about 1.4 and 2.0 s; overlay gone at 2.2 s; no console errors |
| Screenshots (14 states refreshed) | The photo on its way at 560 ms with the vehicle screen already underneath; the photo fading at 1.45 s with the sketch coming up |
| Forbidden-list checklist | Passed; exemption E4 rewritten for the new sequence |

## 4. Open for the team

1. The timings (220, 720, 900, 700 ms) are in `handoff-layer.tsx`; say if the fade should be
   slower or the sketch should wait until the photo is fully gone.
2. The veil makes the map dissolve to white before the vehicle screen shows; without it the
   map would cut to the screen at the click. It can be removed if a cut is preferred.
