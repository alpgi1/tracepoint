# Step 09 (UI track) – Market callouts on the map, after a 21st.dev survey

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done and measured |
| Track | Frontend, in parallel with the backend track; no backend files touched |

## 1. What the team asked for

The plain text readouts of step 07 were judged unusable. The team supplied a reference image
(cards with icon rows joined to the markets by connectors, on a soft gradient map) as an idea,
not as a design to copy, and asked for a 21st.dev survey: find a component that fits our map
and use it where one exists.

## 2. The survey (`frontend/docs/01-research-notes.md`, section 6.1)

33 queries through the 21st.dev search API, 343 unique components, 24 previews reviewed on
contact sheets. No component annotates a dotted map with cards. The visx Annotation (subject,
connector, label) is the right pattern and was taken as the method; installing it would pull
five visx packages for forty lines of SVG, so the connector is drawn in the stage. Card
anatomies (contact card 4090, info cards 1440 and 3282, stats 3947) gave the row structure:
title, then icon plus value rows, one hairline border. Globes, popups on hover, arcs and pulsing
pills were rejected for the reasons in the table. Nothing was installed; the reasons are
written per candidate.

## 3. What was built (D-051)

* **Callout cards** (`components/landing/market-callout.tsx`): a paper card with a hairline
  border and a soft lift, pinned by a corner to a geographic point in open water (US over the
  Pacific, EU hanging from Iberia over the Atlantic, CN over the Indian Ocean; the anchors are
  tested to be sea). Rows: the market's name; 2025 units and verbatims (car icon); "Highest
  complaint share" (warning icon) and the domain with its own icon (`lib/content/icons.ts`, one
  Lucide icon per domain); for China, "Lowest study score" (clipboard icon) and the attribute
  with its score (gauge icon). All figures from `content/markets.json`.
* **Connectors** (`map-stage.tsx`): one SVG layer; from each card's top edge, 24 px from the
  pinned corner, a line runs vertically to the latitude of the market's subject point, then
  horizontally until it first meets the market (`renderer.edgeTowards`, a 2 px scan of the
  mask), where a dot marks the edge.
* **The cards are the market buttons.** Hover or focus turns the market, the connector and the
  card border blue; click magnifies; `aria-pressed` carries the state. The visually hidden
  market keys of step 05 are removed. Cards and connectors hide while the map flies and while a
  market is open.

## 4. What was verified

| Check | Result |
|---|---|
| `pnpm lint`, `pnpm typecheck`, `pnpm test` (7 tests, the callout anchors included), `pnpm build` | Clean |
| `pnpm audit:pages` on `/`, `/markets/eu/f70`, `/markets/cn/g68` | 0 findings; 3 keyboard stops on the map, the three cards |
| Screenshots at 1440 and 1920 | Cards in open water, connectors ending on the markets' edges; hover and focus states in blue |
| Forbidden-list checklist | Passed: one accent, hairline border, no gradient or glass, icons from the one set, every figure sourced |

## 5. Open for the team

1. The China connector crosses Central Asia's dots on its way down to the Indian Ocean; moving
   the card north-east would put it over Japan at 1440 px. Say if a shorter route is wanted.
2. The reference image's icon tiles, glass surfaces and per-market colours were not taken
   (forbidden list sections 3 and 7); the cards use the one blue on hover only.
