# Step 01 – Challenge understanding and data inventory

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – waiting for the team's answers to the open questions (section 7) |
| Scope of this step | Read every file under `docs/`, understand the challenge, draft the rough application phases, collect open questions. No code, no detailed planning. |

---

## 1. The challenge in one paragraph

Build an AI-powered application that ingests heterogeneous inputs (BMW customer verbatims, customer
studies, sales volumes, equipment/option lists, plus structured knowledge from the web), extracts
signals (recurring complaints, unmet needs, competitor advantages, market trends) linked to their
sources, derives clear, actionable, customer-facing and realistic product requirements, prioritizes
them with an explainable logic, puts a product manager (PM) in the loop (approve / reject / edit /
challenge, with rationale and evidence), and records everything in a complete, chronological audit
trail. Demonstrate it for at least one derivative in one market, but design it to be adaptable to
other BMW vehicles and markets.

### 1.1 Scope boundaries (from the brief)

* **In scope:** customer requirements on the product – features, equipment, comfort, space,
  usability, infotainment and digital services, design and quality perception, driving experience,
  range and charging *as experienced by the customer*, variant and package offering.
* **Out of scope:** regulatory / homologation (safety, emissions, type approval), technical and
  engineering requirements (component specs, architecture, suppliers), pricing / business case /
  cost calculation. Cost or effort may be used only as a *rough prioritization factor*.

### 1.2 Expected deliverables (checklist to track until the end)

- [ ] **D1 – Concept + demonstrable prototype** of the AI-powered requirements application
      (heterogeneous inputs → requirements → prioritization → human review).
- [ ] **D2 – Structured sample list of derived requirements.** Each requirement must carry:
      unique ID · clear actionable description · linked findings and sources · priority or score ·
      applied prioritization rationale · evidence level · key future-facing assumptions and
      uncertainties · current decision status.
- [ ] **D3 – End-to-end workflow definition**: how inputs become proposed and prioritized
      requirements, which activities the AI performs autonomously, where human review is mandatory.
- [ ] **D4 – Demonstrable audit trail**: each requirement traceable from findings and sources through
      consolidation, scoring, prioritization and human decision; records changes to content, scores,
      priorities, evidence and status, with who/what initiated the change, when, and the rationale.

### 1.3 The reference process (from the "THE PROCESS" slide)

| Stage | Content | Actor (icons on the slide) |
|---|---|---|
| Situation analysis | Baseline: previous BMW model, BMW portfolio, sales volume | AI + human |
| | Competition | AI |
| | Customer / public feedback | AI |
| | Product and global trends | AI |
| Structure & context | Classify, cluster, contextualize: AI standardizes findings, identifies duplicates, groups themes, connects insights → list of *all potential requirements* with a 0/1 "implement requirement?" decision | AI |
| Requirements definition | Specification and quantification: measurable targets and acceptance criteria (e.g. "Range: 600 or 700 mi?", "Cooler for how many bottles?"), grouped by area (Exterior, Interior, Powertrain, Driver assistance, …) | AI + human |
| Prioritization | Customer view / Business view / … | AI + human |
| Documentation | Requirements tracking (continuous loop) | AI |

---

## 2. Data inventory (everything under `docs/`)

All files were opened and read. Sizes, structures and key statistics below.

### 2.1 Customer verbatims – `F70_feedback_hackathon.xlsx`, `G60_feedback_hackathon.xlsx`, `G70_feedback_hackathon.xlsx`

One sheet each (`Feedback_Explorer`), 12 columns:
`ID, Source, Brand, Sales Description, Country, Derivate (e-code), Engine Type, Feedback Type,
Customer Feedback, Vfc level2 3 Name, Vfc level2 Name, Vfc level3 Name`.

* **One row per (verbatim × classification).** A verbatim (same `ID`, same text) can appear on
  several rows when it touches several topics. Unique `ID` = unique verbatim.
* `Vfc level2 Name` = topic / component (e.g. *Drivetrain*, *Touch screen, operation*,
  *Electric Range*, *Seat massage*). `Vfc level3 Name` = nature of the statement (e.g.
  *Like: function*, *Not user-friendly*, *Malfunction*, *Customer request: function*, *Damage*,
  *Range, not OK*). `Vfc level2 3 Name` is the concatenation `level2 : level3`.
* `Feedback Type` ∈ {Likes, Difficult to Use, Defect, Wants, blank}. Blank goes together with
  `no_class_found` (Source A) or an empty class (Sources C/D).

| Model | Vehicle | Rows | Unique verbatims | Sources | Countries (rows) | Engine types | Level-2 classes | Level-3 classes |
|---|---|---|---|---|---|---|---|---|
| F70 | BMW 1 Series (new generation) | 4,076 | 2,128 | A only | GB 2,790 · JP 1,026 · SE 121 · FR 75 · AU 30 · DK 13 · FI 11 · KR 5 · ZA 5 | ICE only | 120 | 58 |
| G60 | BMW 5 Series sedan | 5,005 | 4,000 | A 1,858 · B 2,627 · C 384 · D 136 | US 4,365 · KR 278 · GB 89 · JP 76 · SE 51 · DK 49 · CA 41 · NO 17 · FR 14 · FI 14 · AU 7 · LV 3 · ES 1 | ICE 2,768 · BEV 1,763 · PHEV 474 | 222 | 83 |
| G70 | BMW 7 Series | 4,690 | 4,000 | A 1,383 · B 2,855 · C 314 · D 138 | US 4,418 · KR 157 · JP 56 · GB 22 · CA 11 · ES 9 · others ≤5 | ICE 2,956 · BEV 1,347 · PHEV 387 | 212 | 78 |

Feedback-type mix (rows): F70 – Likes 1,630 / blank 1,087 / Difficult to Use 595 / Defect 491 /
Wants 273. G60 – Likes 1,951 / Difficult to Use 1,306 / blank 731 / Wants 582 / Defect 435.
G70 – Likes 1,890 / Difficult to Use 1,119 / blank 682 / Wants 518 / Defect 481.

**What the four sources look like (own interpretation from the texts – to be confirmed):**

| Source | Style | Markets | Interpretation |
|---|---|---|---|
| A | lower-case, review-like, mentions dealers, mixed praise and complaints in one text | multi-country (GB, JP, KR, SE, …, US) | public online reviews / owner reviews |
| B | "Customer stated … Writer advised …" | US only | customer-relations / call-center contact notes |
| C | "I had a (minor/serious) problem with <item> – DTU: '…'", NPS reason, "one comment for the manufacturer" | US only | structured owner survey (initial-quality style; DTU = difficult to use) |
| D | "<short text>. That is the one thing I love most / could be most improved about the <area> of my vehicle." | US only | owner survey, one-liners per vehicle area |

Data-quality observations:

* Pre-classification is a big asset but incomplete: F70 has 1,087 `no_class_found` rows; G60/G70
  each have ~440 verbatims with **no** classification at all (all of Source D, about half of Source
  C, and the Source A rows flagged `no_class_found`).
* Verbatim length: median ≈ 140 characters, max 1.5k (F70) to 4.3k (G70). Source B notes can be
  long and contain dealer/process information that is not a product requirement.
* Topic concentration: F70 is concentrated (top-10 classes = 64 % of classified rows, 28 classes
  with ≥ 20 rows); G60/G70 are broad (top-10 ≈ 36–37 %, 50+ classes with ≥ 20 rows).
* No text overlap between F70 and the G models; 13 identical texts shared between G60 and G70
  (probably survey boilerplate). A handful of duplicate texts inside G60/G70.
* F70 has no US / China feedback and only ICE – consistent with the sales file (F70 not sold in
  CN/US). G60/G70 feedback is ≈ 87–94 % US.

### 2.2 Customer studies – `F70_G60_G68_G70_customer_studies.xlsx`

Two sheets with **different layouts**:

* `CN_EU_2025` – **mean ratings** (scale presumably 1–10, not stated) for 37 attributes
  (overall satisfaction, exterior/interior styling, material quality, level of equipment, safety,
  value for money, reliability, infotainment ease of use, navigation, seating comfort, storage,
  acceleration, fuel economy, braking, sportiness, ride quality, roominess, luggage, HVAC, build
  quality, quietness, connected services, …). Columns: **China** → 5 Series G68 (long-wheelbase
  China model), 7 Series G70; **EU** → 1 Series F70, 5 Series G60, 7 Series G70. No sample sizes,
  no competitor benchmark.
* `US_2025` – **response distributions** on a 7-step verbal scale (*I Hate It, A Failure,
  Unsatisfactory, Satisfactory, Excellent, Delightful, I Love It*; "% of column, sample base") for
  ≈ 105 attributes, for **G60 and G70 only** (no F70 – not sold in the US). Attribute families:
  exterior, driving performance, interior styling/quality, seats, roominess, storage, climate,
  audio, controls/HMI, NVH, durability, safety, value, brand image, driver assistance, phone
  integration, head-up display, voice recognition, mobile app, environment, sunroof, customization.

Examples of weak spots visible in the means (EU G60): interior material quality 7.75, fuel
economy 7.45, rear roominess 7.46, loading/unloading 7.24, storage for small items 7.72. EU G70:
value for money 6.47, sportiness 6.97. EU F70: luggage capacity 7.07, HVAC 7.31, connected
services 7.36. CN G68: level of equipment 7.49, braking 7.38, connected services 7.35.

### 2.3 Sales volumes – `sales_volumes.xlsx`

Three sheets (`F70`, `G60_G68`, `G70`), columns `market, market_code, volume_2024, volume_2025,
volume_2030`, four markets (Europe, China, USA, Rest of World).

| Model | EU 2024→2030 | CN | US | RoW |
|---|---|---|---|---|
| F70 | 80,000 → 87,000 | 0 | 0 | 25,000 → 31,000 |
| G60_G68 | 110,000 → 127,000 | 68,000 → 78,000 | 75,600 → 80,000 | 25,000 → 31,000 |
| G70 | 11,000 → 17,000 | 8,000 → 12,000 | 10,000 → 14,000 | 5,000 → 9,000 |

Note: the brief says "units by powertrain and region", but the file only has **region** – there is
no powertrain split. 2030 is a forecast column.

### 2.4 Option lists – `F70_OptionList.PDF`, `G60_OptionList.PDF`, `G70_OptionList.PDF`

German-market price/equipment catalogues ("Katalog Juli 2026", bmw.de), **in German**, 23 / 28 / 27
pages, InDesign PDFs with extractable text. Structure is identical for all three:

1. Vehicle prices and models (variants, transmission, power, consumption, CO₂ class, base price).
2. Selected standard equipment per variant (matrix with ■ = standard).
3. M Sport Design / M Sportpaket / M Sportpaket Pro / top model contents.
4. Wheels and tyres, exterior colours, interior (upholstery, trims) with option codes (SA-Nr.),
   prices, availability per variant (■ standard, □ optional, –,– no-cost option) and dependency
   notes ("Nur in Verbindung mit …", "Nicht in Verbindung mit …").
5. Optional equipment by group (packages, exterior, interior, drivetrain/chassis, connectivity and
   infotainment, driver assistance and safety, comfort, climate, transport/storage, other).
6. Technical data and dimension drawings.

Variants covered: **F70** 116, 120, 123 xDrive, M135 xDrive, 118d, 120d (ICE / 48 V mild hybrid
only). **G60** i5 eDrive40, i5 xDrive40, i5 M60 xDrive (BEV); 530e, 530e xDrive, 550e xDrive
(PHEV); 520i, 520d, 520d xDrive, 540d xDrive. **G70** i7 50 xDrive, i7 60 xDrive, i7 M70 xDrive
(BEV); 750e xDrive, M760e xDrive (PHEV); 740 xDrive, 740d xDrive.

Observations: prices are present but pricing is out of scope (use only as a rough cost proxy).
The lists are Germany-only, so they do not describe US/CN equipment. Tables need careful parsing
(column headers are rotated, multi-line cells, footnotes).

### 2.5 What is *not* in the data

* No competitor data of any kind (must come from the web).
* No market-trend data (must come from the web).
* No G68 verbatims (only CN study means and the combined G60_G68 sales line).
* No sample sizes or confidence information in the studies.
* No US/CN equipment lists; no English option lists.
* No powertrain split in sales.

---

## 3. How the pieces fit together (interpretation)

* The verbatims and studies describe the **current** generation of each derivative; the task is to
  derive requirements for the **next** product decision (successor or major update – to be
  confirmed), i.e. the current model is the "previous BMW model" baseline on the process slide.
* The option lists tell us **what the car offers today** (standard vs. optional per variant), so a
  "Want" in the verbatims can be matched against them: feature missing / optional only / standard.
* The sales volumes give the **market weight** for prioritization (and the 2030 outlook).
* The studies give **quantitative confirmation** (low-rated attributes) for themes that appear in
  verbatims, and a US-only view for G60/G70.
* The web adds **competitor advantages and trends**, and context such as segment benchmarks.

Richest demo candidate from a pure data point of view: **G60 (5 Series)** – four sources, three
powertrains, US distribution study, EU/CN means, large volumes in all markets. Counter-point: its
verbatims are ≈ 87 % US, while the option list is German. **F70 (1 Series)** is the simplest,
Europe-centric case (GB-heavy Source A, EU study, German option list, ICE only).

---

## 4. Rough application phases (high level only – details after the Q&A)

| # | Phase | What happens | Mainly |
|---|---|---|---|
| 0 | Setup and conventions | Repo structure, reporting convention, tech stack, demo derivative + market, definitions (evidence levels, statuses, priority logic) | human |
| 1 | Ingestion and normalization | Parse the five Excel structures and the three PDF catalogues into one evidence store with stable source references (file / sheet or page / row or ID); normalize taxonomy, markets, powertrains; translate German equipment names | AI + human (validation) |
| 2 | Web enrichment | Collect competitor equipment, reviews, segment trends for the chosen derivative/market; store as sources with URL, date, excerpt, reliability | AI, human curation |
| 3 | Signal / finding extraction | Cluster verbatims into themes (existing VFC taxonomy as anchor, LLM fills the unclassified rows), quantify recurrence per market/powertrain/source, cross-check with study ratings, equipment gaps and web evidence; every finding links to its evidence and gets an evidence level | AI |
| 4 | Requirement derivation | Turn findings into customer-facing requirements (ID, description, acceptance criteria / metric, rationale, linked findings, assumptions and uncertainties), consolidate duplicates, filter out-of-scope items | AI, human review |
| 5 | Prioritization | Explainable score (customer impact, market weight, evidence strength, trend/competitive pressure, rough effort) with configurable weights and a written rationale per requirement | AI proposes, human decides |
| 6 | PM in the loop | Review UI: approve / reject / edit / challenge with mandatory gates; "challenge" triggers a logged re-analysis with evidence | human |
| 7 | Audit trail and traceability | Append-only event log for every ingest, extraction, score, edit and decision (actor, timestamp, rationale, before/after), traceability view requirement → findings → sources, exports | AI + system |
| 8 | Demo and deliverables | Sample requirement list (D2), workflow document (D3), audit-trail demo (D4), adaptability check on a second derivative/market, presentation | human |

---

## 5. Working conventions adopted in this step

* Every step is reported in `reports/step-NN-<topic>.md` (English) and committed with an English
  commit message.
* Raw challenge material stays untouched in `docs/`.

---

## 6. Risks and watch-outs noticed while reading

* Source B texts mix product feedback with process/dealer content – needs filtering so that only
  product requirements are derived.
* Study layouts differ per sheet (means vs. distributions) – two parsers, one common schema.
* German PDF tables – parsing effort is real; a curated structured extract may be faster than a
  fully generic parser for the hackathon.
* Scope creep into engineering/regulatory/pricing topics must be prevented by an explicit scope
  classifier and PM gate.

---

## 7. Open questions for the team

See the chat message of this step (the same questions are reproduced here in English for the
record). Answers will be filed in the next report.

1. Hackathon timeline, team size/roles, demo format (live demo vs. slides + prototype).
2. Demo derivative and market (recommendation: G60 for richness, F70 for simplicity).
3. Time horizon: successor generation vs. mid-cycle update; "today" ≈ mid-2026?
4. Tech stack, LLM provider and keys, budget; UI framework; database.
5. Web enrichment approach (live search tooling vs. curated corpus), competitor set, trend sources.
6. Depth focus: BMW-data integration vs. web research.
7. Use the given VFC taxonomy as canonical theme structure? LLM only fills gaps?
8. Language: translate German option lists into English; UI and documents in English.
9. User roles and identity for the audit trail.
10. Mandatory human gates – which ones exactly.
11. Semantics of "challenge" and whether it triggers an AI re-analysis.
12. Prioritization factors and framework; PM-configurable weights.
13. Evidence-level definition.
14. Requirement granularity, wording and measurable acceptance criteria.
15. Two-step flow (0/1 candidate decision → specification) as on the slide?
16. Reporting/branching conventions, decision log.
17. Output formats for D2 and the presentation.
18. Audit trail depth (append-only log, immutability demo?).
19. Official meaning and weighting of Sources A–D.
20. Powertrain split for sales (proxy allowed?).
21. Any additional data (sample sizes, G68 verbatims, competitor studies)?
22. Include China / G68 at all?
