# Frontend research notes

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Scope | What the team's three other frontends and their reference collections teach, and how it applies to the Tracepoint landing page (interactive market globe) and the later PM workspace |
| Sources | `yksmentor/Mentor-Website`, `alpgi1/portfolio`, `alpgi1/regu` (documents, code, 345 reference captures, 7 reference videos); raw per-source notes in `research/` |
| Status | Done; addendum below records the team's answers of the same day |

---

## Addendum (2026-10-10, after the team review of step 04)

The team's verdict on the first hero was that it read as AI slop, and it did (the tells are listed
in `02-forbidden-list.md`, section 0). The team then decided: white page and one blue in the BMW
and Bavaria family, no dark mode; the first view is the map alone, no text, no header, no footer;
a flat halftone world map instead of a rotatable globe; desktop only from here on. Items 13 to 16
of section 7 are therefore closed, and the step 05 map (`03-landing-map.md`) replaces the globe.
The ideas in section 7 that assume copy or sections on the landing page wait for the team's
decision on what the magnified state will carry.

---

## 1. What was reviewed

| Source | Documents read | Visual material viewed |
|---|---|---|
| Mentor-Website (study app marketing site, Turkish, Next.js 16 on Cloudflare) | README, rewrite plan, reference notes, the "Fosforlu Defter" design direction with its R3/R5 implementation notes, 21st.dev candidate list, token and font pipeline code | 22 reference boards (Apple, YC startups, experimental sites, education competitors, mobile, deep dives, style cards) |
| portfolio (alpgiraycelik.me, Next.js 16, Tailwind v4, GSAP, three) | CLAUDE.md, research R1 (award sites 2025 to 2026, Lando Norris case study, 21st.dev inventory of 1,431 components), forbidden list, plan with decisions D1 to D15, step log S0 to S9, publishing notes, the hero, motion and audit code | 196 captures of 64 award-level sites (hero at 1440 px, mobile at 390 px, scroll films), 35 captures of 21st.dev categories, the Lando Norris case study, 7 videos of reference sites |
| REGU (reguai.tech, cloud-versus-local LLM cost report, pnpm workspace, Next.js 16) | CLAUDE.md, forbidden list, design system folder (token analysis, chart style, component mapping, 21st.dev reference components), R13 design references, ADRs 0001 to 0012, design upgrade plan, session hand-over, the 20 installed skills and their scope rules, the audit tools | 92 captures of 38 AI and infrastructure startup sites plus the REGU site itself |

Raw notes per source are kept in `research/` (seven files). Two of the review passes stopped
early because of a session limit: the REGU document notes cover process and references but not
their sections on tokens and skills (those were read directly from the repository instead), and
the written report on the Mentor reference boards and the 21st.dev category captures was lost
after the images had been viewed. The 21st.dev material is covered by the portfolio's own
inventory (section 6), so nothing binding is missing.

---

## 2. Process rules the three projects converged on

All three projects were built by the same hand in the same month and arrived at the same working
method. Tracepoint adopts it (plan decisions D-033 to D-038).

1. **Research before code.** Capture the references frame by frame (hero, mobile, scroll film),
   write a "take / do not take" verdict per site, then a plan with coded decisions, then code.
   Only after the plan does a line of UI get written.
2. **Decisions have codes and are never rewritten.** REGU uses K-codes and ADRs, the portfolio
   D1 to D15, Tracepoint uses `plan/decisions.md`. A superseding decision references the old one.
3. **One step, one output, one verification, one backward check, one commit.** REGU's rule is
   "do, verify, look back": a fixed checklist (typecheck, tests, lint, no hard-coded number or
   colour, forbidden-list delivery check, new assumptions coded) runs before the next step.
4. **No delivery without measurement.** Every step runs lint, typecheck, tests, a page audit in a
   real browser (one h1, heading order, landmarks, accessible names, tap targets of at least 44 px
   measured as the larger of control and label, a keyboard tour with real Tab presses and a visible
   focus ring, horizontal overflow at 375 px loaded fresh, forbidden-text scan, console errors),
   screenshots at 1440 and 390 px, and Lighthouse where it is meaningful. **Question the tool
   first:** in REGU's step 12 five of five false alarms were tool bugs; the pitfalls are written at
   the top of each tool so they are not rediscovered.
5. **The forbidden list is checked before every delivery.** Exemptions exist only in writing, in
   the list's own exemption section, and only by a user decision. An unwritten exemption is a
   violation.
6. **Tokens in one place.** Colours, type scale, spacing and easings live in one CSS file; a
   component never carries a colour. REGU goes further: the user's token file is never edited,
   additions go to a second file loaded after it.
7. **Copy and numbers in one content file, with their source.** Mentor's `site.ts` and the
   portfolio's `project-data.ts` carry every number with a comment naming the source; a value
   that is `null` is not rendered at all ("a number is never invented").
8. **The server renders everything visible.** Entrance animations run only when JavaScript is
   present (`html.js`, set before first paint) and motion is allowed; nothing waits behind a
   preloader; with reduced motion everything is static and complete.
9. **Fonts are produced, not added.** One subset per family, self-hosted, licence text next to
   the file, display cut preloaded, body font with measured fallback metrics so the layout does not
   shift (Mentor measured the fallback with HarfBuzz after a first guess produced CLS 0.136).
10. **21st.dev gives methods, not components.** Mentor's four-item filter: any glow or gradient
    layer is deleted, one accent, motion must carry information, the markup must be
    server-renderable. The portfolio adds: render and measure first, then take the method and
    rewrite it with tokens, author and licence in the file header. Code pulls are rationed on the
    free tier (two a day), so a shortlist comes before any pull.
11. **Skills have a precedence and a scope.** User decisions, then the forbidden list, then the
    validators, then the installed skills; the taste skills apply to marketing surfaces only, never
    to report or data screens.
12. **A hand-over note is updated at every step** (where we are, pitfalls found, open items), so a
    new session starts from the document, not from a retelling.

---

## 3. What the reference sites have in common

Three batches were reviewed: 36 award-level portfolios and agencies (slugs a to l), 31 more
(m to z, including the Lando Norris case study and the user's old portfolio as a baseline), and 38
AI and infrastructure startup sites (R13). Counts below are from those batches.

| Pattern | Evidence | Consequence for Tracepoint |
|---|---|---|
| **One idea, one object.** Every award site can be named by one idea (helmet and contours, wireframe igloo, spec sheet, paper). In the startup batch 23 of 37 heroes show the product, real data or a 3D object; the rest open with one strong visual idea; "a hero with neither is not on the list" | a to l: 9 sites with a 3D or WebGL object in the hero; R13: 23 of 37 | The globe is the one object. No second animated background, one canvas, everything else quiet |
| **Micro-labels and status bars.** Location, local clock, coordinates, counters, "as of" dates, numbered navigation, superscript counts | 12 of 36 (a to l), 7 of 31 (m to z), most of R13 | A mono readout line under the globe, dated labels once data has dates, no decorative "SECTION 01" labels |
| **Mono uppercase label language** with brackets, figure numbers and hairlines | 11 of 36, 22 of 38 startups | Geist Mono labels at 11 px, 0.08 em, uppercase, tabular numerals |
| **Warmed near-black or off-white grounds, one accent.** Dark 12 of 36, 9 of 31, 21 of 38; pure black is rare; sites with two accents (purple plus cyan) read as "AI generic" | measured hex values in the notes | Page `#0e1013`, chalk text `#eceef1`, one signal colour |
| **Three-voice typography.** Grotesk display (startups: 52 to 104 px at weight 300 to 500, negative tracking), mono labels at 10 to 12 px, optionally one serif-italic word | R13 counts; portfolio R1: median two families, mono labels on 20 of 64 | Archivo display plus Geist Mono; no serif for now |
| **Motion tells a story.** Sticky-split narratives (12 of 38 startups), scroll-bound state changes, one-time entrances; the signals of a cheap site are preloaders, count-ups, "scroll to explore", infinite marquees and purple glow | 21 of 68 award sites are gated; 6 of 8 Site-of-the-Year winners are gated, Lando is not | No gate, no count-up, no hint arrow; one entrance, interaction-bound motion only |
| **Evidence as a spec sheet.** Mono stat strips, bordered cells, tables with mono headers and hairlines, terminal and log blocks, "FIG. n" captions, compliance rows, dated sources | Elliott Mangham, Lando's "NEXT RACE" card, Normal Computing, Oxide, REGU | The later evidence strip and layer tiles follow this, with real numbers only |
| **Premium is not heavy.** Cerebrium (Site of the Day) 132 KB, Oxide 42 KB, Elliott Mangham about 0 KB of script; Mistral 412 KB; autoplay video is the most expensive way to feel expensive | R13 weight table | Budget: application script under 150 KB gzipped, no autoplay video |
| **Big footer wordmark** | 6 of 38 startups, 6 of 31 agencies | Optional, and only when the page is long; it is becoming a tell |

The user's old portfolio was the baseline of what not to do: centred headline on a particle
background, inline blue numbers, `// about` code-comment labels, a chip card grid, "Let's build
something." and em dashes. The new portfolio and REGU replaced that with the language above.

---

## 4. Globe, map, wireframe and dot-texture references

Exact descriptions, so the globe can borrow deliberately.

| Site | What it does |
|---|---|
| Tensordyne | Black page; a dark-grey orthographic hemisphere rises from the bottom edge; two acid-yellow dots (US, Germany) with three-line mono labels. Closest published relative of our hero |
| Cerebrium | Flat light-grey world map on a white card with pink location pins and a mono region string; elsewhere a honeycomb-textured glowing globe |
| Aspen Search, Hyperbolic | Latitude and longitude wireframe globes and a hyperboloid as icons; dither dots that thicken towards the edges; registration marks in the corners |
| Spherecast | A planet limb band (white to blue) under the hero and in the footer; star dots |
| Dennis Snellenberg | A 40 px white wireframe globe icon rotating inside a dark pill that says "Located in the Netherlands" |
| Lando Norris | Off-white ground with 1 px topographic contour lines and soft grey terrain patches, morphing slowly with noise; the cursor leaves a ripple; a "NEXT RACE" micro data card |
| Lama Lama | The whole dark page carries a 4 px dot grid at about 8 % opacity; typography sits directly on it |
| Basement (mobile), Igloo | White wireframe 3D room on black with a dot-grid floor; a wireframe dome that assembles itself on a wireframe ground, with an ASCII loading bar |
| Bruno Simon | Perspective plane of glowing "x" marks that thicken with distance; one neon ring |
| Sharplink, Together, Antimetal | CAD overlay on a 3D object: thin boxes, dotted leader lines, corner brackets, mono labels; a radial dot network with a dashed guide line to a mono tooltip |
| Prime Intellect, Finseo, Oxide | Wavy dot-grid terrain in perspective; concentric halftone dome; vertical dither strip and dotted box schematics with "FIG." captions |
| Messenger, minhpham | A toon planet with the title letters standing on it (a game); a photographic night Earth as décor behind client names |
| 21st.dev globes (Magic UI 171, COBE 7686, Interactive Globe 6863, Interactive Globe Explorer 28448, cobe Globe 11611) | Rejected in REGU and in the portfolio because a single location ("based in Munich") does not justify a globe. Our globe carries three markets as content, so the objection does not apply; the rule stays: render, measure, rewrite with tokens |

What was taken for the hero: the dotted land texture and graticule (the user's chosen 21st.dev
component), the "object on a quiet ground" composition, mono readout and attribution line
(Tensordyne, Lando), a soft fill plus crisp outline for the active market instead of a box-shadow
glow, and a resting faint outline so the three markets are discoverable without a hint.

---

## 5. Motion norms measured from the reference videos

Seven screen recordings (Artiom Yakushev, bleibtgleich, Elliott Mangham, Lando Norris, Nothin',
Wodniack, and the user's old site) were sampled at 1 to 10 frames per second. Hover and cursor
behaviour were not recorded (automated captures), so those rows carry low confidence.

| Movement | Duration | Character |
|---|---|---|
| Logo blur-in | about 750 ms | ease-out, 20 px to 0 |
| Large headline settling (liquid distortion) | 1.5 to 2 s | long-tailed decay |
| Letter rise with stagger | about 1.3 s total, 100 ms per glyph | ease-out, one glyph with a small overshoot |
| Panel wipe | about 800 ms | ease-out |
| Chip width wipe | about 500 ms | ease-out |
| Row-by-row "decoder" reveal | 100 ms per row, 12 rows in about 1.1 s | linear stagger |
| Element fade-in | about 300 ms | opacity only |
| Loader to hero | 100 to 250 ms | hard cut |
| Marquee | about 27 px per second | linear, continuous |

Norms: entrances are slow and deliberate, closings are quick; no tween blocks for more than two
seconds (long waits came from loading, not design); elastic easing appears only on a single
glyph. For the globe this gives: hover in 180 to 220 ms and out in 300 to 350 ms, camera moves of
900 to 1,100 ms with an ease-in-out and no overshoot, a one-time entrance under 1.5 s, and a
reduced-motion fallback that cross-fades states in about 150 ms instead of moving the camera.

---

## 6. 21st.dev: sister-project verdicts and our shortlist

* **Portfolio inventory (R1):** 176 search queries, 3,211 hits, 1,431 unique components, 372
  previews reviewed one by one. Verdicts: take 18, candidate 75, drop 114. "Most of the library is
  SaaS landing slop: purple gradients, glow cards, bento grids, testimonials, logo clouds, 10X
  badges, count-ups." What is worth taking is the method: line masks, cursor-following previews,
  scroll-expanding media, layout transitions, a wordmark rising from behind a curtain.
* **Mentor:** four-item filter (section 2, rule 10). What entered the code, all rewritten without
  the animation library: Text Reveal (Mask) 19257 as a CSS line reveal, Stacking Cards 25275,
  the Scroll Horizontal Gallery 24623 pattern, Animate Digits 20071 (only the changing digit moves).
* **REGU:** ten registry pulls kept as references; only methods entered the site (navigation menu
  behaviour, large-name footer layout, native sticky instead of the GSAP sticky wrapper).

Shortlist for Tracepoint's later phases, method only, each to be rendered and measured first:

| Component | Use | Note |
|---|---|---|
| Text Reveal (Mask) 19257 | Headline line mask on the landing and report covers | CSS only, under 600 ms, no blur |
| Sticky Content Wrapper 26064 | "How the evidence is built" with the mini globe pinned and turning per step | Native `position: sticky`, flat flow on mobile |
| SVG follow scroll 7288 | A drawn evidence-trail line between layers | CSS scroll timeline, 0 KB |
| Feature Comparison Table 21218 | Market comparison, mono column heads, hairline rows | Numbers from the API only |
| Project Showcase 6495 | Hover preview on requirement rows | Fine pointer only, poster on touch |
| Accordion 24849 | Method and sources | Native `details` is enough |
| Large Name Footer 872, Motion Footer 7741 | Closing wordmark | Only if the page becomes long |
| Halide Topo Hero 6794 | Topographic texture behind a map section | Only if a flat map is ever wanted |

Dropped on sight for this product: aurora, beams, sparkles and paper-shader backgrounds; glow and
spotlight cards; number tickers; typewriter text; bento grids; testimonial marquees; preloaders;
docks; Spline scenes (about 1 MB runtime); theme toggles; liquid-glass buttons.

The globe component the user supplied (`wireframe-dotted-globe`) was taken as the method and
rewritten; what changed is listed in `03-landing-globe.md`.

### 6.1 Survey for the market callouts and the vehicle screen (step 09, 2026-10-10)

The team asked for 21st.dev components for the figures on the map and for the vehicle screen.
Search through the 21st.dev API (`POST /api/search`, 33 queries: world map, dotted map, map
markers, map label, annotation, callout, leader line, connector line, floating / info / stat /
metric / glass / hover / tooltip card, pin label, hotspot, image hotspots, heatmap, blueprint,
sketch, technical drawing, product annotation, spec sheet, ranking / progress / bar / data list,
leaderboard, feature list, detail panel), 343 unique components, 24 previews reviewed on contact
sheets (`tools/arastirma` method of the portfolio). No component draws annotated cards on a
dotted map, and none annotates an image with zones. What was found and what was taken:

| Component | What it is | Verdict |
|---|---|---|
| World Map 320 (Aceternity) | `dotted-map` SVG world with animated arcs, `framer-motion` | Rejected: no market layers, no zoom, arcs are the decoration the brief excluded; our canvas map already does the dotted ground |
| Map 4158 "Global Network" | Dotted world with city pills (dot plus name) | Method: the label sits in open space beside its point; our cards do the same with figures |
| COBE Globe 7686 (shuding) | WebGL globe, markers, arcs, labels by CSS anchor positioning | Rejected: globe (D-041); CSS anchor positioning is Chromium-only today |
| Annotation (airbnb-visx, callout category) | `@visx/annotation`: subject, connector, label | **Method taken**: subject dot on the market, elbow connector, label card. Not installed: five visx packages for forty lines of SVG; the connector is drawn in the stage |
| Tooltip 165 (shadcn), Hover card 143, Tooltip metrics card 4319 | Popups on hover | Rejected: the figures must be visible at rest, not on hover |
| Contact card 4090, Info cards 1440 and 3282, Stats 3947 | Card anatomies: title, icon rows, figure tiles | Method: title, then rows of icon plus value, one hairline border, no gradient, no glow |
| Location tag 6482 | Pill with a live dot and text swap | Rejected: animation for its own sake |
| visx Heatmaps 2217, Thermodynamic grid 6787 | Grid heat maps | Not applicable to a body drawing |
| Progress metric card 8617, Statistics cards | KPI tiles with charts | Candidates for the situation brief (Screen 1), not for the map |

Decision D-051: the market figures are callout cards joined to the markets by elbow connectors
(`components/landing/market-callout.tsx`, the connector in `map-stage.tsx`); the cards are the
markets' buttons. Nothing was installed from 21st.dev; every candidate was either a different
object (globe, popup, grid) or a method we wrote with the tokens, which is the rule the sister
projects set (section 2, rule 10).

### 6.2 Survey for the subsystem dialog (step 13, 2026-10-11)

The team asked for the vehicle screen's list to follow the CPM engine and for a click to open a
popup covering most of the screen with three blocks (what customers like, what they criticise,
the market and competition analysis), with 21st.dev components where they fit. Search through
the 21st.dev API (29 queries: full screen and modal dialog, sheet, drawer, overlay and detail
panel, pros and cons, comparison and feature and competitor tables, ranked, data, bar, progress
and weighted lists, review, quote and feedback lists, breakdown, stacked bar, split view, three
columns, tabs, segmented control, dependency graph, propagation, impact analysis, effort
estimate), 214 unique demos, 24 previews reviewed on two contact sheets. What was found and what
was taken:

| Component | What it is | Verdict |
|---|---|---|
| Dialog 55 (shadcn, scrollable with native scrollbar), Dialog 364 (Origin UI, scrollable with sticky header) | A dimmed backdrop, a title row that stays while the body scrolls | **Method taken**: sticky header with the title and the close control, native scrolling body. Written on the native `dialog` element with the tokens; the library dialog adds a focus trap and a portal the browser already provides |
| Dialog 376 (card details), Origin UI feedback, checkout and sign-up dialogs | Form dialogs | Not applicable |
| Drawer 4484, 11441 (coss) and shadcn Drawer | Side and bottom sheets | Rejected: the brief asks for a popup over most of the screen, not a sheet |
| Pros and Cons Block 18096 (contentbit) | Two tinted boxes, green with check marks and red with crosses | **Anatomy taken, surfaces rejected**: likes and criticisms side by side with one hairline between; the green and red fills and the per-row icons carry information by colour (forbidden list section 3) |
| Comparison Section 26826, Comparison Table 26827 (mohammadshehadeh) | Two bordered columns with a hairline and a figure strip; a matrix with a highlighted column and a mono eyebrow | Method: two columns, hairline separation. The highlighted column, the serif heading and the eyebrow were not taken |
| Table 95 (Origin UI, comparison), Table 89 (dense) | Hairline tables: features by products with check and cross cells; a dense data table | **Method taken** for the market block: hairline rows, a small muted header row, text cells (no check or cross icons, our cells are statements and sources) |
| Key Value List 25162 (corr) | A hairline definition list | **Method taken** for the facts block (weight, scope, rows, propagation) |
| Partition Bar 26545 (8starlabs) | A two-segment bar with the figures as labels | **Method taken** for the customer rows: complaints against likes as a two-segment bar next to the figures |
| Cost Meter 36488 (syeddhasnainn) | A budget readout with a segmented bar and a legend of name, figure and share | Candidate for step 15 (the effort verdict per change); not used now |
| Category List 5151, List 1400 (haydenbleasel) | Title plus description rows with hairlines; grouped lists | Method: the theme rows (name, domain, figures line) |
| Feature with advantages 1017 (tommyjepsen) | A feature grid with check icons | Rejected: the marketing feature grid |
| Compare 1080 (manuarora) | An image slider comparison | Rejected: decorative |
| Animated List 869 (Magic UI) | Notifications sliding in on a loop | Rejected: infinite loop |
| Advanced Stats 19070, Bar Chart Stacked 10118, visx Bar Stack 2341 | Dashboard tiles, stacked charts (one in purple gradients) | Rejected or not needed: no chart in the dialog, the figures are text |
| Tabs 422 (Origin UI), Floating Panel 1186 (cult-ui), Reasoning Effort 36560 | Underline tabs, a floating note, a select | Not needed: the three blocks are visible together, as the brief says |

Nothing was installed (`package.json` is unchanged); every method was written with the tokens
in `cpm-dialog.tsx` and `globals.css`. The native `dialog` element gives the top layer, Escape,
the inert page and the return of focus, which is what the library dialogs add on top of a div.
The same day the team replaced the two-column quote lists with three bands from their own sketch
(suggestion, summary, columns per theme; D-076): the sticky-header dialog and the hairline list
stayed, the comparison columns and the key-value list went, and the columns follow the chart
rules (one series, thin marks, values on the caps) rather than any registry chart.

---

### 6.3 Survey for the stage bar and stage 2 (step 14, 2026-10-11)

The step adds the five-stage bar under the workspace header and the first stage page, Structure
& context: a view switch (needs a decision, all candidates, left out), a filter row and the
candidate table grouped by domain. Search through the 21st.dev API (20 queries: horizontal
stepper and process steps, progress steps breadcrumb, tabs with count badge, segmented control,
underline tabs, data table with filters, filter bar and toolbar, grouped table rows, dense
hairline table, list with status and badge, triage inbox, review queue, empty state, key value
list, progress bar list, candidate cards, expandable table row and accordion, status table,
roadmap table), 218 unique demos, 10 contact sheets of previews reviewed, 6 demos rendered in
Chromium at full size. What was found and what was taken:

| Component | What it is | Verdict |
|---|---|---|
| Stepper "with inline titles" 771, "with inline titles and descriptions" 772 (Origin UI), Steps 6087 (anubra266), Checkout Steps Breadcrumb (Cnippet) | A horizontal row of numbered circles with a title and a line, the current step filled, completed steps with a check mark | **Method taken** for the stage bar: a number in a ring, the name, the figure beneath, hairlines between the steps. Not taken: the filled circles, the check marks (nothing is "completed" in a process the PM may enter anywhere), the green of the Cnippet original, the Prev and Next buttons |
| Progress stepper 769, 6095 | A progress bar with "Step 1 of 4" | Rejected: a bar without the names carries less |
| Tabs with count badge (coss), "With vertical trigger and badge" 430 and "With icons, scroll and badge" 426 (Origin UI), Tabs 4084 (sean0205) | Tab names with a count in an outlined badge or a filled circle | **Method taken** for the view switch: the count beside the name as text, no badge; the current view carries the one blue rule and `aria-current`, after "Tabs with line" 422. The views are links, so the page works without script |
| Segmented control 753 (Origin UI radio group), 23552 (ddoemonn), kuratlielia | Bordered segments with a sliding highlight | Rejected: a sliding fill is motion without information, and the views are navigation, not a setting |
| Data table with filters 98 and the more complex table 106 (Origin UI, TanStack), Filters 1633 (andrewlu0), Filter Toolbar (kuratlielia) | A search field, filter buttons and dropdowns, or a chip bar of active filters with an add-filter menu | **Anatomy taken, controls rewritten**: one filter row above the table with four native selects and an Apply control, a Clear link when a filter is active. No chips, no animated menu, no search field (20 rows need none) |
| Table without horizontal dividers 86, Dense table 89, Basic data table 96, Default 84 (Origin UI), Default 1418 (shadcn) | Hairline rows, a muted header row, numbers right-aligned | **Method taken** for the candidate table: hairline rows, a small muted header, numbers right-aligned with tabular figures, no row selection, no status pills, no flags, no avatars |
| Expanding sub-row 103 (Origin UI), Accordion "Table w/ chevron" 502 and "Table w/ left chevron" 504 (Origin UI), Expandable Row Table 4798 (sean0205) | A row that opens a detail row under it, a chevron that turns | **Method taken**: the title cell is a native `details` element with a chevron (Lucide) that turns when the row opens; the inbox view opens every row, since the reasons are its point |
| Access Request Inbox (uvain) | A queue grouped by what was asked, each item with a quote, the asked and granted role, Deny and Approve | **Anatomy noted** for the live mode of step 17 (grouped queue, the reason beside each item, the decision on the row). Not taken now: the stage is read-only; the avatars and the filled Approve button are not ours |
| Empty state (serafimcloud) 1435, interactive empty state 5097 (remcostoeten), empty states 19367 (olewandowski1) | An icon, a title, a sentence, an action, often in a dashed frame | **Anatomy taken, surfaces rejected**: the empty state of a scope without a requirement set is one paragraph that says which scopes have one; no icon, no dashed frame, no action button (the action is the backend's) |
| Badge 3554 to 3563 (sean0205), Status badge 521 (serafimcloud) | Coloured pills in five semantic colours | Rejected: colour-only status and a second to fifth accent (forbidden list sections 3 and 0) |
| Gantt 632 (haydenbleasel), Roadmap card 5652, Timeline 5157 and 4647 | Timelines and roadmaps | Candidates for stage 4 (the H1 and H2 packages) and stage 5 (the audit timeline); not used now |
| Pricing cards, waitlist hero, team section, info cards, action search bar | Marketing blocks | Rejected on sight |

Nothing was installed (`package.json` gained the `snapshot` script only); every method was written
with the tokens in `stage-bar.tsx`, `candidate-filters.tsx`, `candidate-table.tsx` and
`globals.css`. The components the registry serves through its install URL were read for their
anatomy, not copied: they rest on `@base-ui/react` tabs and TanStack Table, which a table of 20
rows and three links do not need.

### 6.4 Survey for the requirement page (step 15, 2026-10-11)

The step adds stage 3: the requirements index and the requirement page (facts, statement,
acceptance criteria, evidence with verbatims, assumptions, the CPM effort block with the
footprint, the gate G2 decision, the history), and the bridges on the vehicle screen. Search
through the 21st.dev API (14 queries: key-value and definition lists, specification and
acceptance-criteria tables, quote and testimonial lists, audit and activity timelines,
breadcrumbs, horizontal bar lists, detail page headers, requirement cards, disabled button
groups, propagation path chains), 138 unique demos, 13 contact sheets reviewed. What was found
and what was taken:

| Component | What it is | Verdict |
|---|---|---|
| Breadcrumb "with slash" 440, "default" 436 (Origin UI) | Links separated by a slash or a chevron, a home icon | **Method taken** for the way back to the index: two items, a slash, the current id in mono; no icon |
| Vertical table 93 (Origin UI), Key Value List 25162 (step 13) | Label column, value column, hairlines | **Method taken** for the facts list (proposal, horizon, domain, markets, evidence level, status) as a definition list |
| Table "default" 84, "without horizontal dividers" 86, "dense" 89 (Origin UI) | Hairline tables | **Method taken** for the criteria table and the index, as in step 14 |
| Quote Card 653 (danielpetho) | A quotation with the author beneath and a coloured dot | **Method taken** for the verbatims: a blockquote with a 2 px hairline, the id, source, country, powertrain, classification and workbook row beneath (exemption E5); the dot was not taken |
| Accordion "Table w/ plus-minus" 503, "left plus-minus" 505 (Origin UI) | Rows that open with a plus or a chevron | **Method taken** for the findings: native `details` with the chevron of step 14, the primary finding open |
| Timeline 857 (manuarora700), 5157 (preetsuthar17), 1074 (nyxbui), modern timeline 4647 | A vertical rail with marks, dates and cards, sometimes images | **Method taken** for the history: a hairline rail, a ring per event, the time, actor, action and rationale; no cards, no images |
| Button group 711 (shadcn), disabled button 134 (Origin UI) | A row of bordered buttons; a disabled state in grey | **Method taken** for the gate G2 controls: three bordered buttons, disabled while the page reads a snapshot, with the sentence that says why |
| Bar chart hatched and highlighted 4598 to 4600 (LegionWebDev) | Vertical bar charts | Rejected: the footprint is a list of rows, each with the subsystem's weight as the track and the propagated risk as the fill, after the CPM list |
| Gradient tracing 569, 570 (preetsuthar17) | Animated gradient along a path | Rejected: the propagation path is text ("via HV battery, E/E architecture") |
| Testimonials 2437, 1434, 6268, 9603; features 1906, 1017, 1898 to 1907; footers; bento 1197; credit-card inputs 178 to 181 | Marketing blocks and forms | Rejected on sight |

Nothing was installed; the methods were written with the tokens in `requirement-page.tsx`,
`evidence-list.tsx`, `effort-block.tsx` and `globals.css`.

### 6.5 Survey for the matrix, the packages and the method sheet (step 16, 2026-10-11)

The step adds stage 4: the effort-against-evidence matrix, the packages, the package builder,
and the CPM method sheet with the 12 by 12 link matrix and the back-test. Search through the
21st.dev API (12 queries: prioritization and value-effort matrix, quadrant chart, scatter and
bubble chart, heatmap and dependency matrix, scenario comparison cards, checkbox list with a
total, stat tile, range bar chart, comparison table, sticky summary bar), 125 unique demos, 11
contact sheets reviewed. The registry holds few charts and no scatter: what was found and taken:

| Component | What it is | Verdict |
|---|---|---|
| Table with vertical lines 88, Comparison table 95 (Origin UI) | A grid with vertical and horizontal hairlines; column heads standing upright | **Method taken** for the link matrix of the method sheet: a hairline grid, upright column heads, figures as text in every cell; the fill of a cell follows the likelihood in the one blue |
| Vertical table 93 (Origin UI) | Label and value columns | **Method taken** for the model's facts (reference, engine, hash, thresholds, add-on, this vehicle) |
| Checkbox "with a label and a description" 666 (Origin UI), coss checkbox with description 11449 | A checkbox with a title and a muted line | **Method taken** for the package builder's rows: a 44 px label row with the id, the title and the estimate beside the box; no card, no description paragraph |
| Bar charts 4597 to 4624, line chart 4632, pie and radial 4638, 4640 (LegionWebDev), donut 9377, area 4453 | Charts in dark cards with glow, hatching, duotone | Rejected: a scatter was needed, and the cards' glow and gradients are on the forbidden list. The matrix is inline SVG written to the dataviz rules (10 px marks with a 2 px paper ring, hairline axes, selective labels, a legend for the two series, a table twin) |
| Pricing tables and cards 1541, 5115, 6247, 69; cards stack 1832; compare slider 1080 | Plan comparisons and marketing blocks | Rejected for the packages: three rows of one hairline table with the subsystems beneath carry more than three cards |
| Sidebars 1075, 1627, 1603, 2170; floating header 8137 | Navigation and sticky bars | Not needed: the stage bar is the navigation |
| Infinite grid 9609, 9708; cybernetic bento 6014; moving dot card 2222 | Decorative grids and tiles | Rejected on sight |

Nothing was installed; the methods were written with the tokens in `priority-matrix.tsx`,
`package-table.tsx`, the two stage-4 pages and `globals.css`.

### 6.6 Survey for the brand mark and the CPM explainer (step 20, 2026-10-11)

The team asked for a simple popup, not covering the whole screen, that explains CPM in about
fifteen seconds with a graphic, and suggested a 21st.dev component. The registry's search API
now requires a key (`POST /api/search` answers 401), so the survey read the public listings
instead: the modal category page (131 demos with their preview bundles, ranked by views) and the
Animated Beam page; six previews were rendered in Chromium and reviewed on one contact sheet.
What was found and what was taken:

| Component | What it is | Verdict |
|---|---|---|
| The Dialog, onboarding welcome (larsen66) | A small dialog: picture on top, short title, two lines, one primary action and a skip link | **Anatomy taken**: the visual carries the message, the text is a few lines, one way out (Close). The photo and the two buttons were not taken |
| Welcome Modal (ravikatiyar162), Interactive changelog with dialog (slaviknocolaid) | Announcement dialogs with headed sections, an emoji, a large dark media block | Rejected: emoji, decorative media, marketing copy |
| Dialog app info, sticky header and footer (sshahaider) | A key-value dialog with hairline rows; a scrolling body between a fixed header and footer | Method already in use (step 13): fixed head, native scrolling body, a footer for the source line |
| Animated Beam (Magic UI, Dillion Verma, MIT) | Nodes joined by curved SVG paths along which a gradient beam runs on a loop, `motion` for the animation | **Method taken**: curved connectors between node boxes, computed from the boxes' edges. The endless gradient beam was not (an infinite loop and gradient, forbidden list sections 3 and 4); the links are drawn in once per opening with a dash offset (E7), and `motion` was not installed |

The explainer (`components/landing/cpm-intro-dialog.tsx`) is written on the native `dialog`
element with the tokens, like the subsystem dialog; `package.json` is unchanged.

## 7. Ideas beyond the brief

Proposals, not decisions. Everything marked "needs data" waits for the evidence store API.

**Cheap, consistent with the rules, could be done now**

1. Let the active market's outline draw itself on hover (dash offset animation on the canvas,
   about 400 ms) instead of fading in; several references draw their diagrams this way.
2. Corner brackets around the globe square (Sharplink, Hyperbolic registration marks) to frame
   the globe as an instrument rather than an illustration.
3. A one-time terminator sweep across the globe at load, as the entrance; no loop afterwards.
4. Corner labels at the four edges of the hero (mono): data vintage, projection, resolution,
   local time in Munich. All of them facts, none decorative.

**Next phases, need data**

5. An evidence strip under the hero: four or five hairline cells with real counts from the
   evidence store (verbatims per market, studies, sources, "data as of"), mono labels, no count-up,
   a source line beneath. Numbers come from the backend, never from the UI code.
6. The zoomed state becomes a report cover: ghosted market code, one decision sentence, a 2 by 3
   grid of layer tiles (customer voice, metrics, regional demand, competition, portfolio, trends)
   with real numbers and a source and date footnote. This is the slot the team wants for
   region-specific content (3D cars and similar) in later phases.
7. The six evidence layers as toggles on the globe: pins at verbatim cities, bars for metrics, dot
   density for demand, competitor headquarters as small squares, arcs for trends; every layer
   label carries source and date.
8. A sticky-split "How the evidence is built" section with the mini globe pinned and turning to
   each market per step (desktop only, flat list on mobile).
9. A market comparison table and a "What this does not tell you" section (REGU's honesty pattern).
10. A dated refresh log and a status dot "all sources refreshed on <date>".
11. "FIG. n" captions and 01 / 02 / 03 numbering as the document voice shared by the landing page
    and the PM workspace.
12. A closing wordmark only if the page becomes long; otherwise none.

**Need a team decision**

13. Accent colour: amber (current) for warmth against the cool dark, ice blue for kinship with
    REGU, or acid yellow as in Tensordyne. If market hues are ever needed, they go through the
    dataviz palette validator first.
14. Drag affordance: none (current: grab cursor and the market buttons) or one mono hint line.
15. Idle motion after the entrance: none (current) or a single sweep every few minutes.
16. Mobile: the canvas with horizontal drag (current) or a static pre-rendered map with buttons.
17. The hero sentence and lead; both are drafts derived from the master plan.

---

## 8. Open questions and limits

* The reference captures were taken in a headless browser with software WebGL; gated sites and
  WebGL-only heroes were seen as empty frames, and no hover or cursor behaviour was recorded.
* Lighthouse numbers for a canvas-heavy page in this container are inflated by software rendering
  (REGU documented the same); the real measure is a real device.
* The research notes in `research/` are working notes; where they contradict a document here,
  the document here wins.
