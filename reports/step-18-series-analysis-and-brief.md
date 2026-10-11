# Step 18 – One series across its regions, and a brief instead of a print

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – series analysis of the 5 Series run live, briefs for all analyses, 90 tests passed |
| Why | The team asked for two things. The output of an analysis held too much a product manager does not need. And the analysis itself looked at one market at a time: it could not say whether a change is worth making for every market, for one region, or only with the next model, what each region expects, or where rivals stand. The agent is to work on what was collected and fetch nothing |

## 1. Delivered

Decisions D-091 to D-097.

### 1.1 The series analysis (`agent/series.py`, `tracepoint agent series --vehicle G60`)

**Regions.** One per market in which a vehicle of the series holds evidence, largest sales
first. For the 5 Series:

| Region | Vehicle | Customer text | Study | Sales 2025 |
|---|---|---|---|---|
| EU | G60 | 111 verbatims (GB 36, SE 28, DK 20, others 27) | CN_EU_2025 | 115,000 |
| US | G60 | 3,628 verbatims | US_2025 | 78,000 |
| CN | G68 | none | CN_EU_2025 | 75,000 |

The remainder market RoW is left out (D-095). Its verbatims exist (G60: South Korea 205, Japan
53, from Source A of the workbook), and the first runs showed the two countries as regions. But
there is no study, no external evidence and no sales figure per country, so nothing could be
held against those verbatims; the two regions produced "watch" lines only. They stay available
to the single-market analysis (`agent analyze --vehicle G60 --country KR`).

**The comparison pack** (`series-pack-v1`, no model). The regions side by side:

* complaint and like rows per CPM subsystem and per theme, as a rate per 100 verbatims with the
  row count beside it. Software / HMI: EU 41.4 (46 rows), US 19.9 (723);
* each theme with the finding to cite in each market;
* study scores with their rank inside the region. EU and CN share one study and one scale and
  compare by score; the US study compares by rank only. Rear roominess: EU 7.46 (rank 5 of 37),
  CN 8.71 (rank 30 of 37) – the long wheelbase shows;
* the external rows of each region: every row about the vehicle, then the confirmed rows that
  more than one institution supports;
* sales, and the requirements that exist with their stored effort profiles;
* **what sets each region apart**, computed: study attributes in the weakest third of a region
  that stand a quarter of the ranking lower than elsewhere (and those that stand as much
  higher), complaint themes raised at twice the rate of any other region, market rows that hold
  for that region alone. For China: braking is the 3rd weakest of 37 attributes against the 20th
  in the EU, front roominess the 8th against the 31st; stronger on rear roominess, luggage and
  build quality. For the EU: electric range at 13.5 complaint rows per 100 verbatims against
  1.8 in the US. A regional decision starts from a difference, and the first run without this
  section found none for China.

**The questions.** For every topic the analyst answers in one order: where do customers raise
it (rate and rows, region by region), do the study scores agree, what does the market of each
region show and does it point the same way, what does the car offer today, how large is the fix.

**The decision**, one of five per topic: change now for all markets, change now for one region,
next generation, keep, no action. Horizon and whether the vehicle changes follow from it.

**The checks**, sent back to the model once and listed in the output if they stay open:

* every topic lists every region, also where nothing shows;
* a regional decision cites evidence of each target region. References are counted per region
  by code: verbatims by country and market, findings, study scores and requirements by market,
  external rows by the regions they hold for;
* a topic that keeps or does nothing carries no change profile;
* a topic left to the next generation whose change profile comes out as an adaptation goes
  back: it can be done now, or the reason the current car cannot carry it has to be named;
* what sets a region apart has to be dealt with: the three weakest study attributes specific
  to a region and the three complaint themes raised most there are cited in a topic or in that
  region's expectations, also when the conclusion is to watch and change nothing;
* text fields hold no reference ids (the brief strips any that slip through) and no working
  notes about tools or retrieval;
* effort is computed by the CPM engine on the lead vehicle (D-071, D-072, D-082): a change that
  comes to a major revision cannot be "now"; start subsystem and size are held against the
  evidence and the reference changes; a requirement may be named from any market of the series.

**A tool fix found by the first run.** The pack speaks in subsystems, and the analyst asked
the catalogue for the "domain" `software_hmi`. The tool answered with zero rows, which the
analyst reported as "the store returned no catalogue rows". `get_equipment`, `get_findings` and
`get_requirements` now answer an unknown domain with an error and the list of domains.

**Rivals.** Named only from external rows. The competitor matrix of `plan/05` is not curated, so
where the store holds nothing the brief says "nothing stored on rivals for this topic".

### 1.2 The brief (D-092)

The Markdown file of an analysis is what a product manager reads; everything else is in the JSON
beside it.

| | Before | Now |
|---|---|---|
| First thing on the page | run line, summary, data coverage | the answer and the decision table |
| Per proposal | text, rationale, effort line, every change, size references, catalogue scan, every flag, subsystem line, all reference ids | action, why, effort, warnings only, number of references |
| Tool calls, reference ids, change profiles | printed | JSON |
| A quote not found in its verbatim | printed with a note | left out |
| Full print | the only output | `--detail` writes `<name>.detail.md` |

The three sample analyses under `reports/analysis/` are re-rendered from their JSON: 27 to 17,
22 to 15 and 23 to 13 thousand characters. Their text is that of the earlier prompt;
`situation-analysis-v8` asks for short fields.

**After three security reviews (D-094, D-096, D-097).** The reports are read rendered, and
their text comes from the model. Whatever this program did not write now goes through one
function and is shown as text: one line, no HTML or entity, no emphasis or code span, no table
cell, no heading, list or rule (also not inside a bullet or a quote), and no link in any
flavour of Markdown: square brackets become round ones and an address is broken up where it
stands. A title holding a line break and `## ` used
to make a section of its own.

### 1.3 The agent fetches nothing (D-093)

The tools read the evidence store and nothing else. A rival, a market fact or a figure that is
not stored is reported as unknown. Fetching stays `tracepoint ingest external --fetch`, run by a
person; the only request an analysis sends out is the one to the model provider.

## 2. Verification

| Check | Result |
|---|---|
| `uv run pytest -q` | 90 passed (84 before; 6 new in `tests/test_series.py`, the brief in `tests/test_agent.py`) |
| `uv run ruff check`, `ruff format --check` | clean |
| regions of a series | EU, US, CN for G60 and for G68; EU alone for the 1 Series |
| regional decision without evidence of the region | sent back and reported (tested with a fake model) |
| live run | section 3 |

## 3. The 5 Series across its regions (live run)

`tracepoint agent series --vehicle G60 --no-cache`, run
`RUN-20261011-045801-agent.series.G60-a1a6`, `gpt-5.4-2026-03-05`, prompt `series-analysis-v1`,
regions EU, US, CN. Filed as `reports/analysis/G60_regions.md` (the brief) and `.json`.

| Measure | Value |
|---|---|
| Model turns / tool calls / cost | 4 / 17 / USD 0.38 |
| Tool calls | external evidence 7, catalogue 4, findings 3, requirements 1, sales 1, documents 1; none outside the store |
| References cited | 74, none unverified |
| Open faults after the one correction | 1: two EU study weaknesses (rear roominess, luggage capacity) are passed over; printed in the brief |
| Now (H1) as one package | 7 changes, 10.69 % of a new vehicle generation, adaptation; kept in 87 % of the sensitivity runs, flagged as borderline |
| Next generation (H2) | 1 change, 48.98 % |

| # | Topic | Decision | For | Effort |
|---|---|---|---|---|
| 1 | Frequently used controls without menu hunting | change now | all markets | 3.05 % |
| 2 | Climate setting that is direct and remembers | change now | US | 2.58 % |
| 3 | Real-world electric range and efficiency | next generation | all | 48.98 % |
| 4 | Connected services that just work | change now | all markets | 0.85 % |
| 5 | Phone integration that just works | change now | US | 1.45 % |
| 6 | Auto start-stop that stays off if the driver wants | change now | US | 1.88 % |
| 7 | Hands-free tailgate that opens on the first kick | change now | US | 0.61 % |
| 8 | Practical storage for everyday items | change now | US | 2.08 % |
| 9 | EU body equipment and overall technology quality | no action, watch | – | – |
| 10 | China braking feel and confidence | no action, watch | – | – |

How the answer uses the correlations:

* **All markets, now.** Software / HMI complaints run at 41.4 per 100 verbatims in the EU and
  19.9 in the US; China has no verbatims, but its study puts connected services 2nd weakest of
  37 and its market rows point the same way (25.3 % of owners count missing buttons as a flaw, a
  rule on physical controls from 2027). Three regions, one fix, 3.05 %.
* **One region, now.** Five topics are for the US alone, each with a requirement that exists.
  The clearest: the hands-free tailgate has 44 complaint rows in the US and none anywhere else,
  auto start-stop 45.
* **Next generation.** Electric range is the largest complaint theme in the EU (13.5 per 100
  against 1.8 in the US). The engine puts a real range step at 48.98 % of a new generation, so
  it is a successor topic; the current car gets range prediction and guidance.
* **Watch, do not change.** In China braking is the 3rd weakest of 37 attributes against the
  20th in the EU. Without verbatims nobody can say whether that is pedal feel, calibration or
  expectation, so the answer is to read the next customer text first.
* **Rivals.** The store names Volkswagen's return to physical climate buttons and BYD's
  1,000 kW charging. For most topics the brief says that nothing is stored on rivals.

**The runs do not agree on China.** Four live runs were made while this step was built
(USD 1.50 together). The first three changed the code: the first found no topic for China and
asked the catalogue with a wrong filter; the second read "rank 7/37 from the bottom" as a
strength; the third, still with Japan and South Korea, proposed a China cockpit package of its
own (direct controls and a stronger assistant, 2.06 %). The fourth, filed here, puts the same
Chinese needs into the two all-market topics and gives China nothing of its own, which the brief
now says in so many words. All four agree on easier operation for all markets, range with the
next generation and the US fixes for tailgate and storage. Whether China gets a package of its
own is the decision the product manager should not read off a single run.

## 4. Known limitations

* China has no verbatims: every Chinese decision rests on 37 study scores and the external rows.
  EU has 111 verbatims; a rate from those moves with a handful of rows.
* Rivals are present only where an external row names them. A like-for-like comparison of
  equipment with the Chinese rivals needs the competitor matrix, which is not curated.
* The catalogue is the German price list. What is standard in China or the US is not
  stored.
* The topics are the model's grouping of themes. The checks hold the regions, the evidence per
  region, what sets a region apart and the effort; they do not check that the grouping is the
  best one, and two runs do not pick the same secondary topics (section 3: a China package in
  one run, none in the next). Running the analysis several times and keeping what recurs is
  not built.
* The effort of a topic without a requirement comes from the analyst's own change profile
  (topic 4 here). It is inside the range of the reference changes, which is all the check
  proves.
* The filed run names the small step on range prediction inside the next-generation topic
  instead of as a topic of its own, so that step is not in the H1 package figure, and it has
  no topic for the driving character it says to keep.
* Effort is computed on the G60 also for a change that only the G68 would get.
* The series analysis is a command only; there is no API route for it yet.

## 5. Next step

* Curate the competitor matrix for the 5 Series in China (four rivals, about eighteen features)
  so that "what does the rival offer" can be answered feature by feature.
* Scoring (Phase 5): the decisions of this analysis as input, with sales weight, effort and
  the trend components stored in step 17.
* An API route and the series view in the frontend, if the team wants it there.
