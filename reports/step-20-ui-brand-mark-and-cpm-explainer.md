# Step 20 (UI track) – The brand mark on the map and the CPM explainer for the demo day

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured |
| Track | Frontend only; no backend code or data touched |
| Decision | D-107 in `plan/decisions.md`; exemptions E6 and E7 in `frontend/docs/02-forbidden-list.md` |

## 1. What the team asked for

At the foot of the first map, the BMW logo with "Tracepoint" beside it in a good typeface, the
logo on the left, after the partner lockup the team supplied (logo, rule, name in grey). A click
on the mark opens a simple popup that does not cover the whole screen and explains CPM, opened
first on demo day and read in about fifteen seconds, with a graphic; a 21st.dev component where
one fits.

## 2. What was done

* **The brand mark** (`components/landing/brand-mark.tsx`, `bmw-roundel.tsx`): the BMW roundel
  in its grey web version as inline SVG (the drawing BMW publishes as
  "BMW-logo-grey-fallback-53px", taken from Wikimedia Commons, `File:BMW_logo_(gray).svg`; its
  blue `#0166b1` and grey `#6f6f6f` are exactly those of the file the team supplied), a 40 px
  hairline, and "Tracepoint" in Archivo at 30 px in the roundel's grey, centred at the foot of
  the map. One 250 by 62 px button; it hides with the callouts while the map flies and while a
  market is open, since the market panel takes the foot of the page.
* **The CPM explainer** (`components/landing/cpm-intro-dialog.tsx`): a native modal dialog,
  980 by 672 px at 1440 by 900 (68 % of the width, 75 % of the height), the same height for all
  three classes and without scrolling down to 1280 by 720.
  * Left, three numbered steps whose figures are the model's: 12 subsystems, each with its
    share of a new vehicle generation's development effort; a change spreads over the
    interfaces, at most 3 links deep, each link with a likelihood and an impact; what it reaches
    adds up, adapt below 15 %, major revision up to 50 %, a new generation beyond.
  * Right, a worked example per class, chosen with a three-part control (Adapt, Major revision,
    New generation). Each is a documented BMW decision the engine's back-test reproduces: the
    BMW decision and the engine's class; the reached subsystems as four columns by their
    distance from the start (Change starts in, 1, 2 and 3 links away) with their share of the
    effort; the engine's most likely path to each as a curved link whose strength follows the
    likelihood; the subsystems not reached; the figure with its P5 to P95 range on a 0 to 100 %
    scale over the class bands (the greys of stage 4); and the add-on or rule that moved it.
  * Footer: the back-test (8 of 8 documented BMW decisions reproduced with effort model
    `789fcb7624b8`), "every weight and link is the team's assumption, not calibrated", the
    reference (Clarkson, Simons, Eckert 2004) and the snapshot date.
  * The drawing plays once per opening and per chosen class: the start box, each further column
    220 ms later with its links drawn in, then the dot on the scale, about one second (E7).
    Reduced motion shows it complete.
* **The data** (`lib/content/cpm-intro.ts`): built on the server from `content/effort.json` and
  passed to the map as a few fields; nothing is computed for the screen. Per class, the example
  is the anchor the engine reproduced that is independent of the calibration and reaches the
  most subsystems (ties to the larger effort, then the id); its subsystems become columns by
  path length, each linked to the subsystem its path arrives from, ordered by the parent's row
  and then by effort so links cross as little as possible.
* **21st.dev survey** (`frontend/docs/01-research-notes.md` 6.6): the registry's search API now
  needs a key, so the public modal listing (131 demos) and the Animated Beam page were read and
  six previews rendered on a contact sheet. Taken as method: the onboarding dialog's anatomy
  (visual first, short title, a few lines, one way out) and Magic UI's Animated Beam (curved
  connectors between node boxes, MIT), drawn once instead of its endless gradient beam. Nothing
  installed.
* **Audit tools**: the page audit's dialog check now opens the explainer on the landing page
  (name, headings, tap targets, keyboard tour inside the dialog, Escape, focus back on the mark);
  five screenshot states (one per class, 1280 by 720, the drawing mid-way).
* **Documents**: D-107; exemptions E6 (the roundel, by team decision, against the "no BMW logos"
  row) and E7 (the drawing's motion), E3 revised; `03-landing-map.md` sections 1, 5, 6 and 7;
  `frontend/README.md`; `frontend/docs/README.md`.

## 3. What was verified

| Check | Result |
|---|---|
| `pnpm check` (lint, typecheck, 68 tests with 6 new, build) | Clean |
| `pnpm audit:pages` on 30 pages | 0 findings; the landing page has 4 keyboard stops on the page and 4 in the explainer (Close and the three classes), focus returns to the mark on Escape, no overflow at 375 px |
| Screenshots (`frontend/docs/screenshots/`) | `resting-1440` (updated, with the mark), `explainer-adapt-1440`, `explainer-major-1440`, `explainer-new-1440`, `explainer-adapt-1280x720`, `explainer-spreading-1440` |
| Size of the explainer | 980 by 672 px for each class at 1440 by 900, 1920 by 1080 and 1280 by 720; no scrolling inside it at any of the three; the drawing at scale 1.02, node names at 12.5 px |
| The examples against the data | i4 LCI 2025 range (adapt, 11.5 %, 10 subsystems), long-wheelbase G68 China (major revision, 25.2 % with the 12 % certification add-on), Gen6/800V battery for the 7 Series successor (new generation by the platform rule at 49.0 %); every link's parent is one column to the left and is the subsystem its path names (tests) |
| Console | No errors or warnings in the audit and the screenshot runs |

## 4. Forbidden-list checklist

* Every figure is the effort snapshot's: the model's count of subsystems, thresholds, path
  length and add-on, the back-test rows and summary, the model hash and the snapshot date. The
  example is selected by a rule, not by hand.
* The BMW roundel is the one exception to "no BMW logos or brand assets", written as E6 by team
  decision D-107; it is unaltered and used once.
* No em or en dash, emoji, exclamation mark, cliché, question heading or decorative label
  (measured by the audit's text scan, the dialog included).
* One accent: the start box, the links, the selected class, the dot and its range. The class
  and the figures are text; the bands and the line strength repeat what the text says.
* Motion: only on the click that opens the explainer or picks a class, once, under 1.2 s,
  `opacity`, `transform` and the links' dash offset (E7); nothing with reduced motion.
* No gradient, glow, shimmer, imagery or loader; the drawing is inline SVG.
* Keyboard: the mark and every control in the explainer reachable with the ring; tap targets
  44 px or more, measured.
* No placeholder comment, hard-coded colour in a component (the roundel's colours are tokens)
  or new dependency.
* Team decisions changed: D-040 and E3 (the map alone on first view) now allow the brand mark;
  the forbidden list's "no BMW logos" row has the exception E6. Both are written, at the team's
  request.

## 5. Not done, and open for the team

1. **The logo's licence.** The roundel is a trademark of BMW AG; it is shown because the
   challenge is BMW's and the team asked for it. Before anything leaves the hackathon, the team
   should confirm the use with the challenge owner.
2. **The examples are the back-test's**, not this scope's requirements: the explainer sits on
   the map, before any scope is chosen. A requirement's own propagation is on its page (stage 3).
3. **The new-generation example sits at 49.0 %**, under the 50 % threshold, and is a new
   generation by the platform rule; the explainer says so beneath the scale. For a pitch that
   only shows one class, Adapt opens first.
4. **Narrow screens**: the explainer works at 375 px (the steps above, the example beneath, the
   drawing scrolling sideways in its own box) but is tuned for the desktop demo.
