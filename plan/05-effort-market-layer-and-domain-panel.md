# Effort layer, market layer and the domain panel (bridge from Phase 5 to Phase 6)

| Field | Value |
|---|---|
| Version | 0.1 (2026-10-11), proposal for the team, not a decision |
| Audience | Backend (data model, engine, exports), frontend (the screen after the vehicle is chosen), presenters |
| Question answered | After market and vehicle are chosen, the PM must see three things per category: what customers like, what they dislike or miss, and how the market and the competition stand. The team wants to present this "within the CPM engine", and asked what the backend and the frontend should do next and what happens after the popup |
| Inputs | The team's `cpm_engine.py`, the effort metrics pitch, the decision rules v0.2 (rules 1 to 40), the cost rules (rules 41 to 52), `external_sources_v2.json` (54 sources) and `trend_sources.md` (76 sources). None of these files is in the repository yet; section 9 says where they go |
| Related | `plan/00-master-plan.md` § 4.2 (layers), § 6 (prioritisation), `plan/06-pm-workspace-ux-spec.md`, `plan/decisions.md` D-012, D-022, D-037, D-060, D-061 |

---

## 0. The answer in one paragraph

Keep the **nine vehicle domains** as the rows of the table on the right. They are already the unit of every
finding, every requirement and every PM decision (D-012, D-022), every level-2 theme maps to exactly one of
them, and they are the grouping BMW's own process slide uses (Exterior, Interior, Powertrain, Driver
assistance). Bring the **twelve CPM subsystems** in as the effort consequence of each candidate change:
which subsystems a change touches, what share of a new vehicle it costs, and whether that is an
adaptation, a major revision or a new generation. Customers speak in domains; effort propagates in
subsystems. Both lenses stay on screen, each where it carries information. The third item the PM needs,
market and competition, is the one layer the repository does not have yet; it is built from the two
source registries as curated, dated evidence, and it feeds the same panel.

---

## 1. Two lenses and the crosswalk between them

### 1.1 Why the nine domains stay the rows

* Every finding (211 for G60 US), every requirement (57 in three scopes) and the baseline reports carry a
  `domain_key`; the taxonomy maps its 225 canonical level-2 themes to one domain each (D-022). A twelve-row table keyed
  by engineering subsystem would need a second mapping of all themes, and the counts would be lopsided:
  customers do not write about the E/E architecture or the body structure; `infotainment_digital` alone
  holds 876 classified rows for G60 US (`reports/baseline/G60_US.json`).
* The brief puts engineering requirements out of scope. A navigation built on engineering subsystems
  signals the wrong lens to the jury; the process slide groups requirements by customer-facing area.
* A change's subsystem footprint is a **set**, computed by the engine (seat ventilation touches Seats,
  Software/HMI, E/E and Thermal), so a single "primary subsystem" row would hide what the engine is for.

### 1.2 Crosswalk (for display and for the change profiles)

| Vehicle domain | CPM subsystems that typically carry its changes |
|---|---|
| Exterior & Design | Exterior design, Paint/color; Body/structure for proportions and wheelbase |
| Interior Comfort & Materials | Seats, Interior/console, Thermal/HVAC; Software/HMI for climate operation |
| Space & Practicality | Body/structure, Interior/console |
| Infotainment & Digital Services | Software/HMI, E/E architecture |
| Driver Assistance & Parking | Software/HMI, E/E architecture (sensors); Chassis for actuators |
| Powertrain, Range & Charging | Powertrain, HV battery, Charging, Thermal/HVAC |
| Driving Experience & Dynamics | Chassis, Powertrain; Software/HMI for drive modes |
| Quality Perception & NVH | Body/structure, Interior/console, Chassis |
| Variant & Package Offering | none: packaging is a K0 configuration change; effort comes from the features it bundles |
| General | none |

Four subsystems (Body/structure, Chassis, E/E architecture, Thermal/HVAC) have no customer domain of their
own; they are reached only through propagation. That is the strongest argument against twelve rows.

### 1.3 If the team still wants twelve rows

It can be done without breaking the data: give every **feature** (section 2) a primary subsystem and
derive the row counts from features, not from themes. The cost: the long tail of themes that are not in
the feature hub disappears from the likes and dislikes, and the four subsystems above show "engineering
only, no direct customer evidence". The panel content (section 5) is the same in both layouts.

---

## 2. The feature hub: one object that joins the three tabs and the engine

Today the repository has customer themes (level 2), catalogue items (equipment) and requirements, linked
by `config/findings/theme_equipment_map.yaml`. The competitor comparison, the luxury-level rules and the
effort engine all need a **feature** key. Proposal: `config/features/features.yaml`, about twenty entries
to start, each with:

```yaml
features:
  - key: seat_ventilation_front
    name: Front seat ventilation
    domain: interior_comfort
    level2_themes: ["Seating, ventilate / heat"]          # voice of customer
    equipment_terms: [Sitzbelüftung, Komfortsitze]         # BMW catalogue (reuse theme_equipment_map)
    luxury_level: L2            # rules 19 and 20: L1 basic comfort, L2, L3, new (not in any BMW series)
    series_ceiling_ok: [G60, G70]   # F70 ceiling is L1 (rule 20)
    effort:                     # the CPM change profile (section 4)
      source_subsystem: Seats
      own_impact: 0.3
      layer: K2                 # K0 configuration, K1 bolt-on, K2 module, K3 system / platform
      carryover_if: option_exists_on_variant   # rule 43: deterministic portfolio scan
    competitor_feature: seat_ventilation_front # key in the competitor matrix
    trend_topics: [T6]          # cabin comfort family in trend_sources.md
  - key: console_fridge
    name: Centre console fridge
    domain: interior_comfort
    level2_themes: ["Cooling", "Center console, front"]
    equipment_terms: []         # not in any BMW catalogue
    luxury_level: new
    effort: {source_subsystem: Interior/console, own_impact: 0.3, layer: K2, carryover_if: never}
    competitor_feature: console_fridge
    trend_topics: [T6]
    regional_rules: [R7, R8]    # China: higher priority, medium evidence, contradiction shown
  - key: battery_new_generation
    name: New cell and pack generation (real-world range)
    domain: powertrain_range_charging
    level2_themes: ["Electric Range", "High-voltage battery"]
    luxury_level: L1
    effort: {source_subsystem: HV battery, own_impact: 1.0, layer: K3, carryover_if: never}
    competitor_feature: dc_charging_speed
    trend_topics: [T5]
```

Candidates for the first twenty: seat ventilation (front, rear), seat massage, heated steering wheel,
panoramic roof, rear-seat screens, console fridge, head-up display and AR-HUD, physical climate controls,
rotary controller, CarPlay and Android Auto (and CarPlay Ultra), hands-free highway assistant, automatic
parking, NACS port and Supercharger access, DC charging speed, real-world range, zero-gravity seat, ambient
light, digital key, AI assistant, settings that persist over the air, start-stop that stays off. Every
one already appears in the findings or the requirements, so the hub adds no new claims, only joins.

---

## 3. The market and competition layer (the third tab)

### 3.1 Source registries

Convert the two uploaded files into configuration, unchanged in content:

* `config/sources/external_sources.yaml` from `external_sources_v2.json` (54 rows): region, institution,
  category, trust, scope fit, access, URL, status (keep / add / secondary / drop), intended use.
* `config/sources/trend_sources.yaml` from `trend_sources.md` (76 rows): id, family (P, T1 to T8, X),
  regions, publication date, key figure, trust 1 to 4, what it feeds (market momentum, customer pull,
  contradiction input), core or secondary, verification (yes / partly / no).

The registries list sources, not evidence. The next two files hold the evidence.

### 3.2 External evidence items (`config/external/evidence.yaml`)

One row per claim, curated by hand with the LLM's help, each with a locator. The trend file already
contains most of these rows in its "key figure" column; they only need to be split into one claim per row.

```yaml
- id: EXT-US-P06-01
  source_id: P-06                      # EIA Today in Energy, Q2 2026
  kind: market_share                   # market_share | consumer_pull | infrastructure | owner_voice | competitor_move | regulation_context
  region: US
  domains: [powertrain_range_charging]
  feature: null
  statement: BEV share of US luxury-segment sales fell to 14 % in Q2 2026 from 22 % a year earlier; HEV reached a record 16 % overall
  values: {luxury_bev_share_q2_2026: 0.14, luxury_bev_share_q2_2025: 0.22, hev_share: 0.16}
  date: 2026-07-27
  url: https://www.eia.gov/todayinenergy/detail.php?id=67885
  trust: 4
  verified: yes
  basis: evidence                      # rule 36: evidence or assumption
  contradicts: [EXT-US-T502-01]        # BCG 2030 outlook, rule 35: both sides are shown
```

### 3.3 Competitor matrix (`config/external/competitors.yaml`, `config/external/competitor_features.yaml`)

* A competitor set **per region** (rule 6), chosen by the team. Working proposal for the 5 Series: EU
  Mercedes E-Class and EQE, Audi A6 and A6 e-tron, Volvo ES90, VW ID.7; US Mercedes E-Class, Genesis
  Electrified G80, Tesla Model S, Lucid Air, Audi A6; CN Mercedes E-Class L, Audi A6L, NIO ET7, Xiaomi SU7,
  Zeekr 007 (one Huawei-linked model for the comfort benchmark, X-07). The 7 Series needs its own set.
* One cell per competitor × feature × region: `availability` is `standard`, `option`, `not_available` or
  `unknown`, with a trim note, the source (OEM price list or configurator, ADAC Autokatalog, Autohome
  configuration page, Edmunds) and the date. **Unknown stays unknown**; a cell is never guessed.
* Hackathon scope: G60 in EU and US, G68 in CN, four competitors per region, about eighteen features.
  That is roughly 220 cells; two people with the price lists need an afternoon. This is the critical
  path of the whole third tab and should start first.

### 3.4 Findings derived from the layer (deterministic, no LLM)

| Kind | Rule | Evidence level |
|---|---|---|
| `competitor_advantage` | at least two competitors of the region offer the feature as standard and BMW offers it as option or not at all | by independent sources (rule 34): three or more A, two B, one C |
| `competitor_parity` | BMW and most competitors at the same availability | informational, feeds the "keep" tab when BMW is standard and competitors are not (`bmw_advantage`) |
| `trend_signal` | one or more trend rows of the domain and region; score from the trend file's own components (market momentum 35, customer pull 35, evidence quality 20, recency 10, contradiction penalty), all four shown | by trust and source count |
| `regional_expectation` | rules 7 to 10 as data, each with its source and its stated evidence level | as stated in the rule |
| `market_context` | powertrain mix of the region (P-01 to P-08), used only to rank powertrains (rules 11, 27) and never as feedback popularity (rule 13) | A |

Contradictions are stored as `contradicts` links (the link kind exists) and the panel shows both sides
(rule 35). The China fridge case is the model: competitors offer it (strong), usage is disputed (weak,
single executive quote, T6-08).

### 3.5 Competitive position per domain

For the features of a domain in the region: availability score 2 for standard, 1 for option, 0 for not
available (unknown excluded from the mean), BMW versus the mean of the competitor set. Badge `ahead` /
`par` / `behind` with the number of features behind, and the sentence that keeps it honest: "feature
availability against the regional competitor set, from price lists dated …; not market share".

---

## 4. The effort layer: the CPM engine inside the repository

### 4.1 Where it goes

* `backend/tracepoint/effort/cpm.py`: the uploaded engine, formula unchanged (CPM, Clarkson 2004).
* Inputs as configuration, every value labelled "assumption, not calibrated" (rule 50):
  `config/effort/subsystems.yaml` (weights W, sum 100, with the Thunder Said and Bosch notes),
  `config/effort/links.yaml` (likelihood L and impact I per directed pair, defined only where a physical
  interface exists), `config/effort/thresholds.yaml` (15 / 50, certification add-on 12, carry-over 0.3,
  path length 3).
* `config/effort/anchors.yaml`: the eight back-tested BMW decisions as a **test fixture**; pytest asserts
  8 of 8 and the P5 to P95 ranges of the pitch, so a later change of W, L or I that breaks the back-test
  fails CI.

### 4.2 Change profiles

Every requirement gets an `effort` block in `config/requirements/<vehicle>_<market>.yaml`
(`source_subsystem`, `own_impact`, `layer`, `carryover`), authored by the agent and reviewable like the
rest of the file (same pattern as D-060). Carry-over is decided by data where possible (rule 43): if the
related equipment exists on another variant or series in the catalogue (`EquipmentAvailability`), the
change is a transfer. Features without a requirement inherit the profile from the feature hub.

### 4.3 What the engine returns per candidate

`effort_pct` (base), `range` (P5 to P95 from the seeded ±50 % jitter), `stability` (share of runs with
the same class), `class` (adapt / major revision / new generation), `k_layer`, `subsystems_touched`
(subsystem, risk, weight, contribution), `cert_addon`, `rules_applied` (rule 39), `horizon_suggestion`
(adapt → H1; major revision → H1 with a life-cycle-impulse note or H2; new generation or any K3 → H2,
rule 48) and `luxury_check` (feature level against the series ceiling, rules 14 to 20, as a visible
dampening note, never silent).

Numbers from the team's engine for candidates the repository already has (assumption values, new vehicle = 100):

| Candidate (existing requirement or feature) | Base | P5 to P95 | Class | Same class |
|---|---|---|---|---|
| Start-stop stays off per profile, REQ-G60-US-PR-01 (Software/HMI 0.1, K0) | 1.2 | 0.7 to 1.7 | adapt | 100 % |
| Range prediction and winter guidance, REQ-G60-US-PR-02 (Software/HMI 0.15, K0) | 1.7 | 1.0 to 2.4 | adapt | 100 % |
| One-touch climate and physical control layer, REQ-G60-US-ID-01 and IC-02 (Software/HMI 0.4) | 4.2 | 2.5 to 6.0 | adapt | 100 % |
| Front seat ventilation, option exists (Seats 0.3, carry-over) | 2.7 | 1.8 to 3.8 | adapt | 100 % |
| Front seat ventilation, new to the series (Seats 0.3) | 5.4 | 3.5 to 7.8 | adapt | 100 % |
| Console fridge, new to BMW (Interior/console 0.3) | 6.0 | 4.2 to 8.3 | adapt | 100 % |
| Heated steering wheel standard, option exists (Seats 0.1, carry-over) | 1.7 | 1.1 to 2.5 | adapt | 100 % |
| Rear-seat screens, carry-over from the 7 Series (Interior/console 0.4) | 4.0 | 2.7 to 5.5 | adapt | 100 % |
| Native NACS charge port (Charging 0.5) | 2.0 | 1.1 to 3.0 | adapt | 100 % |
| Same-generation battery upgrade, i4 LCI pattern (HV battery 0.3, carry-over) | 11.5 | 8.6 to 13.8 | adapt | 99 % |
| New cell and pack generation, REQ-G60-US-PR-03 (HV battery 1.0, K3) | 49.0 | 39.7 to 56.3 | new generation (K3 rule) | 67 %, flagged borderline |

The footprint the panel shows for the fridge: own work 2.1, Software/HMI 2.5, E/E architecture 0.9,
Seats 0.3, Thermal 0.3 (rule 52). The last row is the demo sentence: the same domain holds two software
fixes at about one to two percent and a battery generation at about half a vehicle; the engine puts the
first two in H1 and the third in H2, which is what the requirement file already says.

### 4.4 Combining a proposal

Changes that touch the same subsystem are not summed (rule 45). Per subsystem the propagated risks are
combined as 1 − Π(1 − risk), the subsystem's work is the larger of its own change and what propagates
into it, and the certification add-on is counted once. For the three changes start-stop, range guidance
and new front seat ventilation the plain sum is 8.3 and the combined effort is 5.8 (both adapt). The
overall class of a proposal follows the combined total and the K3 rule.

### 4.5 Honesty rules for the screen

No currency anywhere (rule 49, forbidden list § 1); a range instead of a point when the class is unstable
(stability below 90 % shows "borderline, PM decides", rule 51); the W, L, I table is one click away with
its source notes; every candidate lists the rules that fired.

### 4.6 API

`GET /effort/model` (W, L, I, thresholds with notes), `GET /requirements/{id}/effort`,
`POST /effort/estimate` with a list of changes (returns each change and the combination). Effort becomes
the negative component of the Phase 5 score; competitive pressure and trend alignment come from section
3; the weight profile stays PM-adjustable at gate G3 as planned.

---

## 5. The domain panel: content contract

### 5.1 The table on the right (nine rows)

| Column | Source today | New |
|---|---|---|
| Domain, complaint share bar, rows | baseline `domains[]` (rows, likes, complaints, complaint_share) | |
| Keep | findings of kind `strength` and `metric_strength` in the domain; the top theme by likes | `bmw_advantage` count |
| Fix or add | `recurring_complaint`, `unmet_need`, `metric_gap`, `equipment_gap`; requirements of the domain with `recommend` | |
| Market | | position badge, number of `competitor_advantage` findings, number of trend signals |
| Effort | | smallest and largest `effort_pct` of the recommended candidates, class of the largest |
| Decided | requirement `status` | x of y decided |

Default sort stays complaint share (as built); a second sort by competitive gap.

### 5.2 The panel payload (one object per vehicle × market × domain)

Example for G60, US, Powertrain, Range & Charging, with the repository's own identifiers. Competitor
cells are `unknown` until the matrix of section 3.3 is curated.

```json
{
  "vehicle": "G60", "market": "US", "domain": "powertrain_range_charging",
  "keep": [
    {"finding": "FND-G60-US-VOC-STRENGTH-drivetrain", "theme": "Drivetrain", "rows": 325, "likes": 274,
     "complaint_share": 0.154, "quotes": ["verbatim:G60-0668"], "evidence_level": "B",
     "actions": ["protect", "carry_to:G70"]}
  ],
  "fix_or_add": [
    {"finding": "FND-G60-US-VOC-electric_range", "kind": "recurring_complaint", "complaint_rows": 67,
     "requirements": ["REQ-G60-US-PR-02", "REQ-G60-US-PR-03"]},
    {"finding": "FND-G60-US-VOC-automatic_engine_start_stop_function_msa", "kind": "recurring_complaint",
     "complaint_rows": 45, "by_powertrain": {"ICE": 45}, "requirements": ["REQ-G60-US-PR-01"]},
    {"finding": "FND-G60-US-EQ-charge_high_voltage_battery", "kind": "equipment_gap", "complaint_rows": 25,
     "wishes": 5, "requirements": []}
  ],
  "market": {
    "position": {"badge": "unknown", "features_behind": null,
                 "note": "competitor matrix not curated yet for US"},
    "competitors": [
      {"feature": "nacs_port", "cells": [{"competitor": "Tesla Model S", "availability": "unknown"}]}
    ],
    "trends": [
      {"id": "EXT-US-P06-01", "statement": "BEV share of US luxury sales 14 % in Q2 2026, from 22 %; HEV record 16 %",
       "source": "EIA Today in Energy", "date": "2026-07-27", "trust": 4, "verified": "yes"},
      {"id": "EXT-GL-T507-01", "statement": "Accepted range about 480 km; accepted charging time 30 to 60 min",
       "source": "S&P Global Mobility 2025 survey", "date": "2025-12-09", "trust": 4, "verified": "yes"},
      {"id": "EXT-US-JDP-EVC-01", "statement": "Rejection reasons: charging access 46 %, charging time 44 %",
       "source": "J.D. Power EV Consideration 2026", "date": "2026", "trust": 4, "verified": "yes"}
    ],
    "contradictions": [
      {"a": "EXT-US-P06-01", "b": "EXT-GL-T502-01",
       "text": "US BEV share is falling while BCG expects under 30 % plug-in and 28 % full hybrid by 2030"}
    ]
  },
  "candidates": [
    {"requirement": "REQ-G60-US-PR-01", "recommend": true, "horizon": "H1",
     "effort": {"pct": 1.2, "range": [0.7, 1.7], "class": "adapt", "k_layer": "K0",
                "subsystems": [{"name": "Software/HMI", "contribution": 1.0}], "rules_applied": ["R42", "R47"]}},
    {"requirement": "REQ-G60-US-PR-03", "recommend": true, "horizon": "H2",
     "effort": {"pct": 49.0, "range": [39.7, 56.3], "class": "new generation", "k_layer": "K3", "stability": 0.67,
                "borderline": true, "rules_applied": ["R42", "R47", "R48"]}}
  ]
}
```

### 5.3 Delivery path

The frontend reads committed content today (`content/markets.json`, D-045) and the forbidden list bans
runtime fetches from third-party hosts. Keep that: a backend command `tracepoint workspace export`
writes `frontend/content/workspaces/<market>_<vehicle>.json` (table rows plus the nine panel payloads)
in the same shape the API serves at `GET /workspaces/{vehicle}/{market}`. The demo runs without the
database; the API serves the same objects when it runs. PM decisions go through
`POST /requirements/{id}/decision` (exists, logged, replayed on import, D-061) when the API is up and
are queued in the browser and replayed otherwise, so the audit log stays the single truth.

---

## 6. After the panel: the decision flow

The three tabs are the situation analysis of the process slide. What follows is its next four stages, and
the repository already has the objects for them.

| Stage on the slide | In the panel | Object |
|---|---|---|
| Structure and context: all potential requirements, implement 0/1 | the candidate list under the tabs, `recommend` true or false with the rationale | `Requirement.recommend` |
| Requirements definition: measurable targets | the criteria table of the candidate (opens inline) | `Requirement.criteria` with `basis` |
| Prioritisation: customer and business | customer impact (rows, severity, study gap), competitive pressure and trend alignment (section 3), effort as the business side (section 4), each a visible component | Phase 5 score components |
| Documentation | the decision sheet and the audit timeline | audit events, D2 export |

**Actions per candidate**: Accept (approve), Reject (reason), Defer to H2 (reason), Comment. Approve,
reject and defer map onto the existing gate G2 endpoint. **Keep** items have Protect (creates a
strength-protection requirement, three already exist) and Carry to another series (rule 17; the
luxury-level check decides whether it is allowed).

**Comment to constraint** (rules 26 to 30): the PM writes free text ("no hybrid", "the fridge has to be
in", "sportier"). The LLM turns it into a typed constraint, `eliminate` / `require` / `prefer` with a
target, and the PM confirms it in one click; when the text is ambiguous the panel asks one short question
(rule 29). The deterministic part then runs: an eliminated powertrain is replaced by the next one in the
region's ranking from `market_context` (rules 11, 27); a required feature enters with its effort and a
warning when it sits above the series ceiling (rules 14 to 20); a preference nudges the weight profile;
dependent requirements are recomputed (a powertrain change toggles the range and charging requirements,
rule 28); the panel shows what changed (rule 30) and every step is an audit event (rule 40). Every
constraint can be withdrawn.

**Proposal tray** (persistent, at the bottom of the workspace): accepted count, combined effort with its
class badge and range, counts per horizon, open comments, and the button to the decision sheet.

**Decision sheet** (`/markets/[market]/[vehicle]/decision`): the D2 table of the accepted and deferred
requirements with effort, class, horizon, rules applied, evidence level, assumptions; one bar per CPM
subsystem of the combined proposal (this is where the twelve subsystems become a picture); the
constraints applied; export (the Markdown and CSV exporters exist); the audit timeline. Publishing a
version is gate G4 of the UX specification.

---

## 7. Frontend guidance within the existing screen

* **Layout**: the sketch stays on the left; the right column becomes the nine-row table of section 5.1
  (extend `DomainRow`, keep the complaint bar, add the Keep, Fix, Market and Effort figures as text).
* **Opening a row**: a slide-over from the right (about 600 px) over the table, or the right column
  replaced in place with a back control. Not a centred modal: the sketch and the table stay in view,
  Escape closes, focus is trapped, targets are 44 px. Three tabs (Keep, Fix or add, Market) and the
  candidate list below them; the last tab is remembered per session.
* **Sketch**: the zones in `lib/vehicles/zones.ts` are kept without a consumer. One tinted zone for the
  active row would tie the table to the car as a selection state, like E1 on the map. Step 11 removed
  the heat washes, so this is the team's call, not a given.
* **Market tab**: the position sentence, the matrix (features × competitors; cell text `standard`,
  `option`, `none`, `unknown`, never colour alone), the trend list (statement, figure, source, date,
  "trust 4 of 4", verification) and the contradiction pairs side by side.
* **Candidates**: one card per candidate with the recommend flag and reason, the effort figure with its
  range and class, the subsystems touched as a short list, the horizon suggestion, the rules applied, and
  the four actions. Opening the card shows the criteria table and the linked findings as evidence chips.
* **Evidence chips**: open a second-level panel with the verbatim text and its locator (the universal
  drawer of the UX specification; a plain version is enough for the hackathon).
* **Forbidden list**: no currency, no invented figure, every number with its source and vintage, no
  colour-only state, English copy in `lib/site.ts`, nothing fetched from third-party hosts at runtime.
* **China**: without verbatims the Keep and Fix tabs show the CN study attributes and, once curated,
  external owner voice (Autohome, Dongchedi), and say so in one sentence, as the screen does today.

---

## 8. Order of work (estimates, parallel tracks)

| # | Work | Who | Estimate | Depends on |
|---|---|---|---|---|
| 1 | Feature hub (section 2) and the crosswalk | backend | 2 h | |
| 2 | CPM engine in the repository, configuration files, anchors as a test, change profiles for the 57 requirements, `POST /effort/estimate` | backend | 4 h | 1 |
| 3 | Competitor matrix for G60 EU and US, then G68 CN (section 3.3), from price lists and configurators, with dates | two people, not backend | one afternoon, the critical path | 1 |
| 4 | Source registries and evidence items from the two uploaded files (sections 3.1, 3.2) | one person | 3 h, mostly re-formatting | |
| 5 | Derived findings of section 3.4, position per domain, `tracepoint workspace export`, `GET /workspaces/...` | backend | 3 h | 2, 3, 4 |
| 6 | Table columns, slide-over with three tabs, candidate cards, evidence panel | frontend | 1 day | 5 (can start on the JSON example of 5.2) |
| 7 | Actions, comment to constraint, proposal tray, decision sheet, export | frontend + backend | 1 day | 6 |
| 8 | Demo script: one domain per market, one software fix against one platform change, one constraint | presenters | 2 h | 7 |

The frontend can start on step 6 against the example payload of section 5.2 while steps 3 to 5 run.

---

## 9. Where the uploaded material goes

| File | Destination |
|---|---|
| `cpm_engine.py` | `backend/tracepoint/effort/cpm.py` (code) and `config/effort/*.yaml` (values) |
| `BMW_Effort_Metrics_Pitch.md`, `BMW_Maliyet_Kurallari.md` | `docs/method/` as English method notes; the rules become `config/rules/effort.yaml` with their ids (R41 to R52) |
| `BMW_Karar_Kurallari_v0.2.md` | `config/rules/region.yaml` and `config/rules/series.yaml` (R1 to R40 with id, text, origin, evidence level), applied by the engine and shown per candidate (rule 39) |
| `external_sources_v2.json` | `config/sources/external_sources.yaml` |
| `trend_sources.md` | `config/sources/trend_sources.yaml` and the evidence rows of `config/external/evidence.yaml` |

---

## 10. Proposed decisions for the team (to be recorded in `plan/decisions.md` if accepted)

1. The rows of the vehicle screen are the nine vehicle domains; the twelve CPM subsystems appear as the
   effort footprint of candidate changes and as the subsystem bars of the decision sheet.
2. A feature hub (`config/features/features.yaml`) joins themes, catalogue items, competitor cells,
   luxury levels and CPM change profiles.
3. The CPM engine's W, L, I values live in configuration, labelled as assumptions; the eight anchors are a
   test; no currency is shown anywhere.
4. External evidence is curated as dated rows with URL, trust and verification; unknown competitor cells
   stay unknown; competitor sets are defined per region.
5. Effort is the negative component of the priority score and proposes the horizon; the PM can override
   it per candidate with a reason.
6. PM comments become typed constraints that the PM confirms before they are applied; application is
   deterministic and logged; every constraint can be withdrawn.

---

## 11. Risks and honest limits

* The competitor matrix is hand-curated and small; US and CN availability depends on trim and changes
  with model years. The screen says the date of every cell.
* W, L and I are assumptions calibrated on eight public decisions, one of which (iX3 LWB) shares its
  inputs with another; the pitch says so and the screen must too.
* The trend signal weights (35 / 35 / 20 / 10) are the team's; the components are shown, not only the score.
* China has no verbatims; the Keep and Fix tabs there rest on study means and curated external voice.
* Statements about 2028 to 2030 carry `basis: evidence` or `basis: assumption` (rule 36); an assumption
  alone never reaches evidence level A.
