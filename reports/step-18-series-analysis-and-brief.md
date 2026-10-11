# Step 18 – One series across its regions, and a brief instead of a print

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – series analysis of the 5 Series run live, briefs for all analyses, 90 tests passed |
| Why | The team asked for two things. The output of an analysis held too much a product manager does not need. And the analysis itself looked at one market at a time: it could not say whether a change is worth making for every market, for one region, or only with the next model, what each region expects, or where rivals stand. The agent is to work on what was collected and fetch nothing |

## 1. Delivered

Decisions D-089 to D-092.

### 1.1 The series analysis (`agent/series.py`, `tracepoint agent series --vehicle G60`)

**Regions.** One per market in which a vehicle of the series holds evidence, largest sales
first. The remainder market RoW is not a region; its countries with at least 50 verbatims are.
For the 5 Series:

| Region | Vehicle | Customer text | Study | Sales 2025 |
|---|---|---|---|---|
| EU | G60 | 111 verbatims (GB 36, SE 28, DK 20, others 27) | CN_EU_2025 | 115,000 |
| US | G60 | 3,628 verbatims | US_2025 | 78,000 |
| CN | G68 | none | CN_EU_2025 | 75,000 |
| JP | G60 | 53 verbatims | none | 28,000 for the whole remainder |
| KR | G60 | 205 verbatims | none | (same figure) |

**The comparison pack** (`series-pack-v1`, no model). The regions side by side:

* complaint and like rows per CPM subsystem and per theme, as a rate per 100 verbatims with the
  row count beside it. Software / HMI: EU 41.4 (46 rows), US 19.9 (723), KR 14.1 (29), JP 5.7 (3);
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

### 1.2 The brief (D-090)

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

**After the security review (D-092).** The reports are read rendered, and their text comes from
the model. Whatever this program did not write now goes through one escaping function: one line,
no HTML, no link or image, no table cell of its own, no clickable address. A title holding a
line break and `## ` used to make a section of its own.

### 1.3 The agent fetches nothing (D-091)

The tools read the evidence store and nothing else. A rival, a market fact or a figure that is
not stored is reported as unknown. Fetching stays `tracepoint ingest external --fetch`, run by a
person; the only request an analysis sends out is the one to the model provider.

## 2. Verification

| Check | Result |
|---|---|
| `uv run pytest -q` | 90 passed (84 before; 6 new in `tests/test_series.py`, the brief in `tests/test_agent.py`) |
| `uv run ruff check`, `ruff format --check` | clean |
| regions of a series | EU, US, CN, JP, KR for G60 and for G68; the 1 Series starts with EU |
| regional decision without evidence of the region | sent back and reported (tested with a fake model) |
| live run | section 3 |

## 3. The 5 Series across its regions (live run)

`tracepoint agent series --vehicle G60 --no-cache`, run
`RUN-20261011-044019-agent.series.G60-f66e`, `gpt-5.4-2026-03-05`, prompt `series-analysis-v1`.
Filed as `reports/analysis/G60_regions.md` (the brief, 225 lines) and `.json`.

| Measure | Value |
|---|---|
| Model turns / tool calls / cost | 4 / 17 / USD 0.40 |
| Tool calls | external evidence 6, findings 5, catalogue 4, requirements 1, effort 1; none outside the store |
| References cited | 76; 1 not verified (a finding id the model derived by pattern; named in the footer) |
| Open faults after the one correction | 0 |
| Now (H1) as one package | 6 changes, 9.28 % of a new vehicle generation, adaptation (kept in 94.5 % of the sensitivity runs) |
| Next generation (H2) | 1 change, 48.98 % |

| # | Topic | Decision | For | Effort |
|---|---|---|---|---|
| 1 | Frequently used functions without menu hunting | change now | all markets | 3.05 % |
| 2 | Climate setting that is direct and remembers | change now | all markets | 2.58 % |
| 3 | More real electric range | next generation | all | 48.98 % |
| 4 | Connected services that feel reliable and local | change now | EU, CN | 0.42 % |
| 5 | China cockpit with more direct controls and a stronger assistant | change now | CN | 2.06 % |
| 6 | Luggage and rear space in the EU; braking and front roominess in China | no action, watch | – | – |
| 7 | Storage for everyday items | change now | US | 2.08 % |
| 8 | Hands-free tailgate that works first time | change now | US | 0.61 % |
| 9 | Ride, handling and drivetrain character | keep | – | – |

How the answer uses the correlations:

* **All markets, now.** Software / HMI complaints run at 41.4 per 100 verbatims in the EU and
  19.9 in the US; China has no verbatims, but its study puts connected services 2nd weakest of
  37 and its market rows point the same way (25.3 % of owners count missing buttons as a flaw, a
  rule on physical controls from 2027). Three regions, one fix, 3.05 %.
* **One region, now.** The hands-free tailgate has 44 complaint rows in the US and none
  anywhere else: a US fix, 0.61 %. China gets a cockpit package of its own because the market
  rows there are stronger than anywhere else (84 % expect a proactive assistant, 69 % call urban
  assisted driving a must-have) and the study agrees (connected services, level of equipment,
  smartphone integration in the weakest ten of 37).
* **Next generation.** Electric range is the largest complaint theme in the EU (13.5 per 100
  against 1.8 in the US). The engine puts a real range step at 48.98 % of a new generation, so
  it is a successor topic; the current car gets range prediction and guidance.
* **Watch, do not change.** In China braking is the 3rd weakest of 37 attributes against the
  20th in the EU, and front roominess the 8th against the 31st. Without verbatims nobody can
  say whether braking means pedal feel, low-speed smoothness or confidence, so the answer is to
  read the next customer text first, not to open hardware work.
* **Rivals.** The store names Volkswagen's return to physical climate buttons, BYD's 1,000 kW
  charging and the Chinese market rows. For seven of nine topics the brief says that nothing is
  stored on rivals.

Three runs were made while this step was built (USD 1.12 together), and each changed the code:
the first found no topic for China and asked the catalogue with a wrong filter (the section on
what sets a region apart and the tool fix came from it); the second read "rank 7/37 from the
bottom" as a strength (positions are now written as "7th weakest of 37"); the third is filed.
The three agree on the core: easier operation for all markets, range with the next generation,
US fixes for tailgate and storage, a China cockpit package, and the driving character kept.
They differ in which secondary topics make the list (phone integration and start-stop were US
topics in the second run and are inside the HMI topic or absent in the third).

## 4. Known limitations

* China has no verbatims: every Chinese decision rests on 37 study scores and the external rows.
  EU has 111 verbatims, Japan 53; a rate from those moves with a handful of rows.
* Rivals are present only where an external row names them. A like-for-like comparison of
  equipment with the Chinese rivals needs the competitor matrix, which is not curated.
* The catalogue is the German price list. What is standard in China, the US or Korea is not
  stored.
* The topics are the model's grouping of themes. The checks hold the regions, the evidence per
  region, what sets a region apart and the effort; they do not check that the grouping is the
  best one, and two runs do not pick the same secondary topics.
* The effort of a topic without a requirement comes from the analyst's own change profile
  (topics 4 and 5 here). It is inside the range of the reference changes, which is all the
  check proves; 2.06 % for a China cockpit package is the figure to question first.
* The filed run names the small step on range prediction inside the next-generation topic
  instead of as a topic of its own, so that step is not in the H1 package figure.
* Effort is computed on the G60 also for a change that only the G68 would get.
* A country of the remainder has no sales figure of its own.
* The series analysis is a command only; there is no API route for it yet.

## 5. Next step

* Curate the competitor matrix for the 5 Series in China (four rivals, about eighteen features)
  so that "what does the rival offer" can be answered feature by feature.
* Scoring (Phase 5): the decisions of this analysis as input, with sales weight, effort and
  the trend components stored in step 17.
* An API route and the series view in the frontend, if the team wants it there.
