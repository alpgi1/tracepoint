# Step 20: motion between the screens

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Branch | `claude/youthful-edison-379or6`, restarted from `main` at `8320f75` (pull request 32 merged) |
| Asked for | (1) After a market is selected on the map, a click on a car must lead to the vehicle screen at once and without a stop: analyse the problem first, then solve it. (2) Moving from the situation analysis to Structure & context takes half a second and the screen freezes meanwhile; replace that with a professional transition (for example the text arriving with an animation), with 21st.dev researched for the components. (3) Leaving the situation analysis for the other screens, the car should not vanish but stay small in the top right corner, with an animation |
| Decisions | D-105 (the scope layout, instant frames), D-106 (the arrival of a screen, exemption E6), D-107 (the car in the header's corner, exemption E7), D-108 (the hand-over starts with the click, exemption E4 revised) |
| Result | No click waits on the server any more. The header and the stage bar stay on screen between the stages; a stage's heading shows 60 to 180 ms after the click and its content rises into place when it is read; the car moves into the header's corner and back; the photo leaves the card with the click. Frontend 64 tests and the build pass, the page audit finds nothing on 30 pages, 54 screenshots |

---

## 1. Analysis: why the screens froze

Measured on the production build (`pnpm build && pnpm start`) in headless Chromium, with a
script that records in the page when the old screen leaves, when an empty frame shows, when the
new content lands, every animation frame and every long task (`PerformanceObserver`), at normal
speed and at a 4x CPU slowdown (a mid-range laptop).

| Navigation | What the page did (1x) | At 4x |
|---|---|---|
| Situation analysis to Structure & context | The old page stayed frozen for 100 ms, then the page went blank (header included) for 300 ms, then the whole page appeared at once | 350 ms frozen, 260 ms blank, then a 146 ms long task (183 ms without a frame) while the page rendered |
| Map to vehicle screen | The photo sat still while the veil came up and the vehicle screen was fetched: it moved at 333 ms (up to 670 ms when the screen was slow); the screen rendered under it | The screen at 536 ms, 167 ms without a frame right when the photo began to move |
| Stage 2 to stage 3, stage 3 to stage 1 | The same pattern, shorter: a blank frame, then the content | 220 and 155 ms before anything changed |

Root causes, from the code:

1. **Nothing of the next screen could be shown before the server answered.** Every page awaited
   its route parameters outside any Suspense boundary and wrapped its whole content, the header
   and the stage bar included, in one boundary whose fallback was an empty `div`. With Partial
   Prefetching a link prefetches the route's App Shell, which cannot hold URL data; here the
   shell held nothing. So the router waited on the server (the frozen old page), committed the
   empty fallback (the blank page), and React holds a revealed boundary until 300 ms after its
   fallback showed (the content at about 400 ms).
2. **The whole screen arrived in one commit.** Stage 2 is 279 KB of HTML (the brief and the
   candidate table); rendering it at once was the long task.
3. **The hand-over waited for the vehicle screen.** The photo started to move only once the
   screen had reported the target, or after a 450 ms window, so it stood still after the click
   and then moved exactly while the main thread was busy with the new screen.

## 2. What was built

### 2.1 The header stays (D-105)

`app/markets/[market]/[vehicle]/layout.tsx` is a new scope layout. It holds the header (Map chip,
vehicle, market line, the car in the corner) and the stage bar, so they stay on screen while the
product manager moves between the stages and their pages; only the screen below changes.

* The route parameters are read behind a Suspense boundary in the layout and in every page, so
  each link prefetches an instant frame. Links that need their own URL's frame prefetch it: the
  vehicle cards on the map (the whole header and the stage), the stage-1 link and the corner car
  (the stage, so the car can grow back into it), the method sheet link (static).
* The stage bar marks the current stage from the route segment on the client
  (`components/workspace/stage-item.tsx`, `stageOfSegment` in `lib/workspace/stages.ts`): it moves
  the moment the navigation commits. A stage clicked before its frame was prefetched shows its
  rule faintly until then (`useLinkStatus`).
* The stage figures show the stored workspace in the static frame and the live one once it is
  read; the layout and the page share one read per request (`readScope`, React `cache`). A gate
  G2 decision now calls `refresh()` before its redirect, so the bar counts it (checked in the
  live mode: "2 decided" became "3 decided" with the decision).
* A stage's static heading and hint are part of the frame (Structure & context, Requirements
  definition, Prioritization, Documentation); the content read at request time streams into a
  `stage-content` block under them. The method sheet no longer reads the workspace at all.
* While a screen is read, its place is empty; "Reading the workspace" shows only after 0.9 s
  (`StageWait`), so a quick read never flashes a message.

### 2.2 The arrival of a screen (D-106, exemption E6)

`components/workspace/reveal.tsx`: when a screen is reached by a click, its blocks rise into place
one after another, 10 px and a fade over 380 ms, 40 ms apart, capped at seven steps, on
`--ease-out`. Web Animations on `transform` and `opacity`, started before the first paint of the
new content, so nothing flashes. The CPM rows of the vehicle screen cascade the same way; the top
view follows the side view by 160 ms. It never plays on a direct visit (the server's HTML is
readable at once), never for a new query on the same screen (a view tab, a filter, a builder
preset, the outcome of a decision: checked, no animation call), never with reduced motion.

A view transition of the whole screen (the old content lifting out in 160 ms) was built first and
measured: the browser captured the whole page, 150 to 250 ms without a frame in the headless
renderer. It was removed; the old content now leaves at once and the new one arrives.

### 2.3 The car in the header's corner (D-107, exemption E7)

`components/workspace/vehicle-dock.tsx`: on every screen of the scope but the vehicle screen, the
side view sits small (176 px) at the right of the header row, a link back to the vehicle screen
(hover and focus turn its lines blue). The stage's side view and the corner car carry one view
transition name (`lib/vehicles/dock.ts`); React pairs them, and the browser moves and scales the
car between the two places over 450 ms (`--ease-emphasized`, under way at once). The document
root is left out of view transitions, so only the car is captured and the rest of the page
changes live. Back on the vehicle screen, the car grows out of the corner into the stage. Hidden
below 600 px; no animation with reduced motion; React skips the move when the car was scrolled
out of view.

### 2.4 The hand-over starts with the click (D-108, exemption E4 revised)

`components/vehicles/handoff-layer.tsx`: the photo leaves the card with the click and flies to the
target the layout computes (720 ms, `--ease-emphasized`), while the veil dissolves the map. The
layer navigates once the veil is in (220 ms), so the map is never seen to change; the vehicle
screen, prefetched by the card's link, is there about 40 ms later and the veil clears over it.
Where the screen reports a box other than the computed one (a classic scrollbar), a correction
composed after the flight (composite add; `landingCorrection` in `lib/vehicles/layout.ts`, three
unit tests) lands the photo on the pixel without a second movement. Then the photo fades and the
sketch is revealed, as before.

## 3. 21st.dev

Searched through the 21st.dev API (46 queries, 587 demos of 486 components; 19 previews and 12
videos reviewed as frame strips), recorded in `frontend/docs/01-research-notes.md` 6.6. Taken as
methods, rewritten with the tokens: the staggered group (Motion Primitives "Animated Group") and
the short delayed rise (Magic UI "Blur Fade") for the arrival; the shared element of the morphing
dialog and layout grid (`layoutId`) for the car, in the platform's own form (React's
`ViewTransition`); the corner mini player for the idea of the car living on small. Rejected: the
blur presets (the forbidden list allows blur only on small elements), word-by-word and letter
reveals (they delay reading figures), skeletons and loaders (loops and preloaders), the motion
libraries. Nothing was installed.

## 4. Verification

| Check | Result |
|---|---|
| `pnpm check` | eslint clean, types clean, 64 tests (3 new for the landing correction, 1 for the segment of each stage), build passes |
| `pnpm audit:pages` | 30 pages, 0 findings (forbidden text, 44 px targets, 375 px overflow, contrast, keyboard) |
| `pnpm shots` | 54 states, no console error; 5 new: the car on its way into the corner and back, a stage's content arriving, the corner car with keyboard focus, the header on a phone; the two hand-over states retimed; two states taken in the live mode |
| Timelines after (1x) | Map to vehicle: the photo moves at 9 ms, the screen is there at 278 ms, no frame dropped, no long task. Stage 1 to 2: the heading at 174 ms, the car in the corner by 646 ms, the content at 651 ms. Stage 2 to 3: the heading at 61 ms, the content at 369 ms, no frame dropped. Stage 2 to 1: the car leaves the corner at 133 ms and is in the stage by 645 ms |
| Timelines after (4x) | Stage 2 to 3: the heading at 216 ms, the content at 299 ms. Map to vehicle: the photo moves at 41 ms; the screen at 550 ms under the veil. Stage 1 to 2: the view transition starts at 288 to 470 ms (React rendering the navigation, slowed 4x) |
| Frame strips | The screencast of each transition (25 frames a second) shows no blank frame and no stop: the car shrinks over the stage bar into the corner and grows back; the heading rises; the content follows |
| Landing | The photo lands within 0.2 px of the reported box at 1280, 1440 and 1920 px wide without a correction; with the stage moved by 8 px the correction ran and it landed within 0.1 px |
| Other paths | Browser back and forward restore the screen at once (the browser's own history is not a transition, so the car does not move); the corner car link moves the car back; a third hand-over in one session; reduced motion (no reveal, no move, the view transitions finish at once); the regions page of a scope with stage 1 only |
| Live mode | A decision on `REQ-G60-US-ID-02` with the backend on `tracepoint_int`: the notice, the stage bar's count and the log agree at once |

## 5. Open points

* **The capture of the car's view transition** costs one frame on a machine with a GPU; in the
  headless software renderer used here it took 60 to 100 ms (the frame strips show the car
  standing for that long before it moves). Not measured on hardware.
* **React finishes a view transition before it commits the next update**, so when the car moves,
  the screen's content follows it (about 0.65 s after the click instead of 0.37 s). A shorter move
  or a hand-made move of the car (a clone animated with Web Animations) would let both run
  together; the view transition was kept because it handles every way of leaving the screen.
* **React holds a revealed Suspense boundary 300 ms after its fallback showed**, so a stage's
  content arrives at about 0.3 s even when the server answers in 50 ms.
* **The map keeps its last state** when the product manager comes back to it (Next.js keeps the
  left route alive): the market that was open is open again. This predates the step.
* **Test decisions in the local databases**: `tracepoint_int` now also holds `REQ-G60-US-ID-01`
  and `REQ-G60-US-ID-02` approved and one more defer on `REQ-G60-US-PR-03` from this step's live
  checks (the decision log they wrote was deleted, nothing reached the repository). Rebuild that
  database before `pnpm snapshot`.
