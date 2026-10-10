# Forbidden list (anti-slop), Tracepoint frontend

| Field | Value |
|---|---|
| Date | 2026-10-10, revised the same day after the step 04 review |
| Source | REGU `docs/tasarim/yasakli-liste.md` (K75) and its portfolio adaptation, rewritten for an evidence product used by product managers |
| Scope | Every surface, every line of copy and every line of code under `frontend/` |
| Precedence | Team decisions in `plan/decisions.md` win over this list; this list wins over any installed skill or component library |

Why it exists: Tracepoint sells traceability. A product manager will defend a requirement with the
numbers this UI shows. One invented figure, one decorative claim, and the audit trail is worth
nothing. Everything that follows protects that.

How to use it: section 8 is checked before every delivery. If an item has to be violated, the
reason is written down and the team is asked; an exemption that is not written in section 7 does
not exist.

---

## 0. Lessons from the first delivery (step 04)

The team judged the first hero as AI slop. It was. What it did, so it is not done again:

| Tell | What the step 04 hero did | Rule it broke |
|---|---|---|
| Mono uppercase eyebrow with middle dots | "CUSTOMER REQUIREMENTS · F70 · G60 · G70" above the headline | taste skill 4.7 eyebrow restraint and 9.F (middle dot rationed) |
| Status or version label in the header | "INTERNAL PROTOTYPE · 2026" | 9.F no version or status labels |
| Decoration text strip at the hero bottom | "THREE MARKETS … NATURAL EARTH · 1:110M" readout line | 9.F decoration strips; this list, section 2 (labels that do not carry information) |
| The default split hero | Headline column left, object right, three buttons | The most common pattern in the reference count (19 of 38); taste skill 0.D anti-default |
| Dark page plus warm accent plus mono labels | Night palette, amber, Geist Mono everywhere | The "dark tech" LLM default; the sister projects' lists name it |
| The globe look of the component libraries | Graticule, rim gradient, halftone sphere | The same globe the sister projects rejected as a tell |
| Chip buttons with a coloured code prefix | "CN China" chips | Tailwind chip pattern |
| A claim sentence as a headline | "Customer requirements for three markets, traced back to their evidence." | Says nothing a reader can verify on the page |

The correction: one object, nothing else. A white page, one blue, a flat halftone map, no text on
first view. The rest of this list is unchanged; the palette rows below were updated for the light
page.

---

## 1. Honesty (highest priority)

| Forbidden | Instead |
|---|---|
| An invented number anywhere: mock screens, example reports, placeholder statistics, "1,200 signals" without a query behind it | Real values from the evidence store or the plan, or no number at all. Example data is labelled "Example" and is never round |
| Invented customers, logos, testimonials, partner strips | None until they exist |
| Round marketing figures ("10x faster", "99.9 %") | The measured value with its basis |
| A figure without a source and a date | Every number carries where it comes from and the data vintage ("as of") |
| Guarantee language ("fully compliant", "always accurate") | Verb statements of what the system does ("every requirement links to its findings") |
| Claims about BMW, its brands or its data beyond what the challenge inputs state | Only what `docs/` and the plan say; no BMW logos or brand assets |
| A chart that disagrees with its table | Chart and table render the same data object |

## 2. Text (UI language is English)

| Forbidden | Instead |
|---|---|
| Em dash and en dash in UI copy | A full stop or a comma; two sentences |
| Emoji in the UI | An icon from the one icon set, or nothing |
| AI cliché verbs: elevate, unleash, supercharge, seamless, effortless, revolutionary, game-changing, next-gen, cutting-edge, empower, transform, unlock | Say what it does |
| "Simply", "just", "easy" | Delete |
| Triple-rhythm slogans ("Fast. Secure. Private.") | One clear sentence |
| Question headings ("Why Tracepoint?") | Declarative headings |
| Exclamation marks | Full stops |
| Lorem ipsum, "coming soon", TODO on a delivered page | Real text or no section |
| Meaningless section labels ("SECTION 01", "ABOUT") | Labels that carry information ("F70 · G60 · G70", "Natural Earth · 1:110m") |
| Instruction hints as decoration ("scroll to explore", bouncing arrows) | The design makes the next thing obvious; an interactive object gets a real control (the market buttons) |

## 3. Visual and layout

| Forbidden | Why / instead |
|---|---|
| Purple-to-pink gradient hero, neon glow via coloured `box-shadow`, gradient or shimmer text | The 2023 AI-product cliché; it lowers the seriousness of an evidence tool |
| A second animated background behind the globe (particles, aurora, shader) | One object, one canvas |
| Three equal feature cards, equal bento boxes | Lists, two-column zig-zag, hairline tables |
| Card inside card inside card; glass on glass | Fewer surfaces; depth by tone and 1 px hairlines |
| Pure black text on the white page; grey text under 4.5 : 1 | The ink tokens; the white page itself is a team decision (D-039) |
| Stock photos, AI imagery, 3D robots and brains, "developer at desk" | Real screens, real data, real drawings |
| Technology logo clouds, rotating icon spheres, award badges | Text lists; a real badge only if it is earned |
| Preloaders, enter gates, sound gates, percentage counters | Content on first paint; the globe fades in when its data arrives, the copy never waits |
| `h-screen` | `min-h-[100dvh]` |
| Horizontal overflow on narrow screens | Measured at 375 px on every delivery |
| Tap targets under 44 px | Measured, not eyeballed (REGU found two 40 px targets that passed visual review) |
| Interactive elements without a `focus-visible` ring | The ring token exists for this |
| Information carried by colour alone (the selected market, a chart series, a warning) | Always a text label or an icon as well |

## 4. Motion

| Forbidden | Instead |
|---|---|
| Auto-rotation, idle drift and any other infinite loop (pulse, shimmer, marquee) | Motion bound to interaction (hover, click) only, plus one fade-in when the map's data arrives |
| Count-up numbers | The figure is readable immediately, `tabular-nums` |
| Scroll hijacking, scroll snap pages, virtual scrollers | Native scrolling; the map never captures the wheel |
| Animating `top`, `left`, `width`, `height` | `transform` and `opacity`; `filter: blur()` only on entry, under 600 ms, on small elements |
| Ignoring `prefers-reduced-motion` | Required: no entrance, instant state changes, no coasting, static canvas |
| Hover-only information | Everything hover reveals is reachable by keyboard and on touch |
| Several animated grounds at once; the same hover effect on everything | One idea per element |
| Motion under 60 fps on a mid-range device | Measured; if it cannot be reached, the effect is simplified |

## 5. Code

| Forbidden | Why |
|---|---|
| Placeholder comments (`// ...`, `// TODO`, `// rest of code`) in delivered code | Half output is broken output |
| Hard-coded colours or measurements in components | Tokens in `app/globals.css` |
| Hard-coded data (counts, prices, dates) in UI code | Content file or API, with its source |
| `console.log` in delivered code | Nothing in the console in production |
| Importing a package that is not in `package.json` | No imaginary dependencies |
| Fetching reference data from third-party hosts at runtime (the original component fetched GitHub) | Served from our origin, version pinned, licence recorded |
| Storing cursor or scroll values in React state | Refs, plain classes and `requestAnimationFrame`; state changes only on enter, leave and click |
| Global `scroll` listeners | `IntersectionObserver`, scroll timelines |
| A 21st.dev component pasted as is | Render and measure first, then take the method and rewrite it with tokens; author and licence in the file header |
| Secrets, API keys, tokens in the repository | `.env` and `.env.example` |
| `any` to silence a type in data or rendering code | Typed GeoJSON and TopoJSON |

## 6. Process (for whoever works on this)

| Forbidden | Instead |
|---|---|
| Changing a team decision silently | Say the conflict, give the reason, leave the decision to the team |
| Writing "done" when something is partial | Write what was not done |
| Sounding sure when not measured | "not measured", "estimate", "not verified" |
| Applying a skill blindly | Skills are scoped; the taste skills are for marketing surfaces, not the PM workspace |
| Delivering without the measurement tools | `pnpm check`, `pnpm audit:pages`, `pnpm shots` |
| Closing a session without updating the documents | Research notes, this list, the globe spec and the step report are part of the deliverable |

## 7. Exemptions (only by team decision, only in writing)

**E1, market highlight on the map (2026-10-10, from the brief).** The brief asks for the hovered
market to "glow slightly" and get an outline. Section 3 bans neon glow by `box-shadow`. The
highlight is drawn on the canvas as a 7 % blue fill, an 8 px stroke at 12 % and a crisp 1.5 px
edge, rising over 180 ms and fading over 320 ms. It is a selection state, not decoration, and it
uses the one accent.

**E2, one fade-in (2026-10-10).** The map fades in over 600 ms when its data arrives, once, never
with reduced motion. There is no other entrance.

**E3, text on the landing page (2026-10-10, team decision D-040; revised the same day in step 07
by D-045, callout cards since step 09, D-051).** On first view the page shows the map and, per
market, one callout card of real figures from `content/markets.json` (name, 2025 units,
verbatims, weakest domain or lowest study score) joined to the market by a connector. Nothing
else: no header, no copy, no footer. The cards are the market buttons; the h1 and the status
line exist for assistive technology and are visually hidden. The magnified state adds the market
panel with the vehicle cards; it is a second state, not the first view.

**E4, the hand-over from the map to the vehicle screen (2026-10-10, step 07, revised in steps 11
and 12 by D-053 and D-055).** A clicked vehicle card hands the car's photo to a layer that
carries it across the route change: a paper veil dissolves the map (220 ms), the photo moves
straight from the card to the place the sketch has on the vehicle screen (720 ms) while the
veil clears, then the photo fades out (900 ms) and the sketch is revealed behind it (700 ms).
It is the one transition between the two screens, runs once per click, never with reduced
motion, and moves only `transform` and `opacity`. The photos are the team's configured cars
from the BMW configurator, identified as such in `assets/vehicles/photos/README.md`; they are
not stock or AI imagery.

## 8. Pre-delivery checklist

- [ ] Does every number on screen come from a real field with a source and a date? Nothing invented?
- [ ] Any em dash, emoji, exclamation mark, cliché verb, question heading, decorative label left?
- [ ] Three equal cards or an equal bento grid anywhere?
- [ ] Purple gradient, gradient text, box-shadow glow, shimmer, second animated ground?
- [ ] Any stock or AI imagery? Every picture a real screen or real data?
- [ ] Any infinite loop? If yes, is it covered by E1, E2 or E4?
- [ ] Does any content wait behind a loader? Is the page readable with JavaScript off?
- [ ] With `prefers-reduced-motion`: no entrance, instant state changes, no coasting?
- [ ] Keyboard: every control reachable, `focus-visible` ring visible, Escape closes the zoomed state?
- [ ] Every tap target at least 44 px, measured?
- [ ] Horizontal overflow at 375 px?
- [ ] Console clean? No runtime fetch from third-party hosts?
- [ ] Placeholder comments, hard-coded colours or data, unused dependencies left in the code?
- [ ] Any of the step 04 tells from section 0 back on the page (eyebrow, status label, strip, chips, dark default)?
- [ ] If a team decision was changed, was it said?
