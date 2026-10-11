# Step 17 – External evidence from the team's two source lists

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – 124 sources and 143 claims in the database, 72 of 100 pages fetched, 82 tests passed, one live analysis |
| Why | The team added `docs/trend_sources.md` and `docs/external_sources_v2.json` and asked to read them, to store what is useful for the programme in the database in a usable form, to fetch the content behind the links, and to add nothing outside the scope of the vehicles and the programme. Until now the market layer was four rows in `config/cpm/market_context.yaml` |

## 1. Delivered

Decisions D-080 to D-084. This is the first part of Phase 2 of the master plan (external evidence
ingestion, D-007).

### 1.1 What the two files are

* `docs/trend_sources.md`: 76 trend sources in ten families (powertrain share, electrification,
  ownership, cockpit, in-car AI, phone integration, driver assistance, cabin comfort, materials,
  cross-cutting), each with region, date, one cell of key figures, a trust grade 1 to 4, what it
  feeds (market momentum, customer pull, contradiction input), core or secondary, and whether
  the list's author verified it. It ends with nine contradictions to keep.
* `docs/external_sources_v2.json`: 55 sources (expert tests, owner voice, quality indices,
  competitor specification, trend) with trust, scope fit, access terms, a status (keep, add,
  secondary, replace, drop) and the intended use. Most entries point to a source, a few carry a
  figure in their description.

Both are in Turkish and stay in `docs/` as written. They are parsed directly; the second list has
no ids, so an entry is `E-<position>`.

### 1.2 The scope decision (`config/external/evidence.yaml`)

Every one of the 131 entries is decided in one authored file: in scope, or excluded with the
reason. `tracepoint ingest external` refuses to run while an entry is undecided, so a row added
to a list cannot reach the database unread.

In scope (step 01, section 1.1): what customers require of the product in the markets we hold
data for, for F70, G60, G68 and G70, and the market and competition around it.

| Excluded | Reason |
|---|---|
| E-07 DEKRA, E-08 TÜV, E-23 C-IASI | dropped by the list itself: defect statistics, crash safety and repair cost |
| T8-02 Ayvens leasing attitudes | a financing channel, not a requirement on the product |
| X-04 KPMG executive survey | executives about their own plans; no customer, market or product statement |
| X-05 WIPO patent statistics | technology activity, not customer or market evidence |
| T7-06 ban on blue driver-assistance lamps in China | regulation of a lamp none of our vehicles carries |

Scope is also applied inside a source:

* the blue-lamp figure of T7-05 is left out with T7-06;
* the Driver Power survey ranks a "1 Series Mk3", the generation before the F70, so only the
  5 Series row is taken;
* page text is stored only for sources about one of our four vehicles. An industry report holds
  trucks, buses and other industries; from those only the claims are stored, each with the
  passage it stands in;
* a row about a vehicle shows only for that vehicle, and a row that bears only on the battery or
  on charging does not show for the F70, which has neither (`config/effort/model.yaml`).

### 1.3 What is stored

| Table | Rows | Content |
|---|---|---|
| `source` (kind `web_page` / `web_api`) | 124 | title, URL, layer, checksum and time of the snapshot, trust and primary / secondary, access terms |
| `external_source` | 124 | id in the list, family, institution the data comes from, regions, vehicles, trust, status, publication date, what the fetch returned, the list's own columns |
| `external_evidence` | 143 | one statement each: kind, regions, CPM subsystems, vehicles, topic, basis, evidence level, verification, the passage on the page, the contradiction it belongs to, URL and checksum |
| `document_page` | 182 | searchable text of the sources about our vehicles: 107 NHTSA complaints and 75 parts of eight pages |

Claims by kind: consumer survey 41, market share 24, official specification 23, competitor move
20, BMW's own offer 8, quality index 8, expert test 7, owner voice 5, infrastructure 3, market
context 2, regulation as context 2. By region: US 76, CN 56, EU 44, worldwide 38 (a claim can
hold for several). By subsystem: software / HMI 64, powertrain 34, interior / console 22, HV
battery 21, charging 15, seats 9, the rest below 7. 43 claims name one or more of our vehicles (G60 23,
G70 19, G68 4, F70 1); 100 describe a market.

### 1.4 Fetching (D-081)

One client that says who it is, obeys robots.txt, waits a second between two requests to a host,
fetches a page once and never retries or works around a refusal.

| Result | Sources |
|---|---|
| fetched and read | 72 (70 pages and PDFs, 2 APIs) |
| refused with HTTP 403 | 10: Edmunds (E-09, E-13, E-38, E-46), J.D. Power APEAL and valuation (E-10, T8-01), Argonne (P-07), WardsAuto (T4-03), Tech Brew (T4-07), GM Authority (T8-05) |
| no answer within 40 s | 10: Business Wire (T8-03, T1-05, T1-06, T3-05, T6-01, T7-05), McKinsey (T2-02, T2-03, T7-02, E-34) |
| HTTP 468 | 4: Gasgoo (T5-10, T2-05, T4-05, T6-02) |
| page built by script, no text | 2: Shell (T5-05), Autohome equipment matrix (E-51) |
| HTTP 404 | 1: AutoPacific (T4-02) |
| disallowed by robots.txt | 1: EY full report (X-02) |
| not attempted, home page only | 20 |
| not attempted, paywall or collection forbidden | 4: Consumer Reports (E-15, E-39), EV Database (E-28), Bimmerpost (E-47) |

The raw pages are in `data/external/` (36 MB, not committed). `config/external/fetched.json`
(committed) holds what each URL returned and the result of every claim check, so a rebuild on
another machine gives the same sources and claims without the network.

Two public APIs are read for our vehicles only:

* **NHTSA owner complaints**: 107 complaints, 49 for the G60 (i5, 530i, 540i and the plug-in hybrid; model
  years 2024 to 2026) and 58 for the G70 (7 Series, i7; 2023 to 2026). The component named most often
  is the service brakes (25 and 31), then stability control and the electrical system. They are
  defect and safety reports, not a satisfaction measure, and are stored as such.
* **EPA range and consumption**: 98 US variants, model years 2023 to 2027, one claim per vehicle,
  model year and kind of drive. Example: the i5 eDrive40 on 19-inch wheels is rated 295 miles
  for 2024 and 2025, 310 for 2026 and 328 for 2027; on 21-inch wheels 270 to 280.

### 1.5 The check of a claim against its page (D-082)

| Result | Claims | Meaning |
|---|---|---|
| confirmed | 81 | every figure stands in one passage, or the claim is pinned with a quote from the page and every figure is there |
| computed | 25 | built from an API answer |
| not fetched | 30 | the page could not be read; the list's figure stands unverified |
| not checkable | 4 | kept apart as "by the list, not on the fetched page" |
| not found | 3 | the page does not hold the figures (E-04, T7-04, X-03) |

The first version of the check counted a figure anywhere on the page. The Deloitte study showed
why that is worthless: a PDF of percentage tables matches any two-digit number. Figures now have
to stand together, and where they stand in different paragraphs the claim is pinned by a quote
that was read on the page.

Reading the pages changed the lists in eight places:

| Entry | The list says | The page says |
|---|---|---|
| T5-04 | Europe about 15 electric cars per public charging point | EU 11; 15 is the worldwide ratio expected for 2035 |
| P-03 | China 2025: new energy share 53.9 % | only monthly shares (December 59.1 %); the 53.9 % on the page is August 2024 |
| T5-03 | first 1,000 V models on sale | not on the page |
| T5-09 | about half of China's public network is fast charging | not on the page; it counts 1.1 million new public points in 2025 against the IEA's 1.8 million |
| T3-06 | Huawei HMS for Car in more than 70 models | not on the page |
| T6-03 | zero-gravity seats and switchable glass at Auto China 2026 | not in the slides |
| E-01 | BMW 1 Series in 6th place | "1 Series Mk3", the previous generation, not the F70 |
| E-18 | 7 Series rating 4.36 | another page; this one is the 5 Series |

Four more statements are kept apart with the wording "by the list, not on the fetched page"
(Mercedes-Benz and Chinese makers returning to buttons, the compilation of AI assistants, falling
interest in BMW, Mercedes-Benz and Audi in China, 12 % failed DC charging sessions).

**Evidence level** (rule 34): the number of independent institutions that state the same thing
for a shared region, counted on 32 topics. Another institution counts only if its statement was
confirmed, and two outlets reporting one study are one institution. Result: weak 87, medium 13,
strong 43. Strong topics: powertrain mix, EV outlook, physical controls, hands-free driving,
phone mirroring, AI assistant, driver assistance in China. Seven claims carry
`basis: assumption` (rule 36): the forecasts and the list's own compilation.

**Contradictions** (rule 35): the nine of the trend list, with both sides and the claims they
rest on, and one that the pages added: What Car? calls the infotainment of the 5 Series
class-leading, Autocar calls it convoluted.

### 1.6 What it says about our vehicles

Read on the pages, each a row with its passage:

* **G60, UK owners** (Driver Power 2026): 17th of 50. Second-best car in the survey for
  front-seat comfort, eighth for driving pleasure, top 10 for navigation and connectivity;
  handling 35th, running costs 49th, value 48th, reliability "poor". Front-seat comfort is the
  largest interior complaint of the US verbatims; the two markets disagree.
* **G60, testers**: Autocar finds the climate controls "almost entirely digital" and reports that
  all testers had to look away from the road; Auto Express dislikes setting the air-flow
  direction in a menu; ADAC grades the i5 eDrive40 1.6 overall and names weak points in
  operation and only average charging power. The same theme as the largest US complaint group.
* **G60 and G70, US sales of the electric variants** (Cox Automotive): i5 964 in the second
  quarter of 2026 (down 32.8 %), i7 510 (down 37.8 %). The sales workbook has no powertrain
  split; this is the first one.
* **G60 and G70, US charging**: Tesla Superchargers since 10 December 2025, about 180,000 public
  points in North America.
* **G70**: the next generation of driver assistance brings the hands-free Highway Assistant from
  one European country to more than 20, the 7 Series among the models; BMWBLOG expects the
  facelift to bring a passenger display.
* **G68, China**: Autohome owner rating 4.46 of 5, behind the Audi A6L and the Volvo S90 at 4.50;
  owners praise steering, acceleration and rear room and criticise the centre tunnel in the
  rear, low-speed smoothness and tyre noise. The first owner voice for China in the database.

### 1.7 In the analysis flow (D-083)

* Tool `get_external_evidence` (market, vehicle, subsystem, topic, kind): the rows of the market
  and the worldwide ones, rows about the vehicle first, the EPA tables last. Reachable over HTTP
  as `POST /agent/tools/get_external_evidence`.
* `search_documents` also searches the stored pages and takes a vehicle.
* Context pack `context-pack-v4`: how many rows the scope has, per subsystem and topic.
* Prompt `situation-analysis-v7`: the rules for market rows hold; a row that is not confirmed
  never carries a recommendation alone; a worldwide row describes no single market; rows about
  the vehicle are third-party statements and change no complaint count.
* References `external:EXT-<source>-<n>`; in the check of where a change starts (D-079) an
  external row counts like a verbatim.

## 2. Verification

| Check | Result |
|---|---|
| `uv run pytest -q` | 82 passed (72 before, 10 new in `tests/test_external.py`) |
| `uv run ruff check`, `ruff format --check` | clean |
| every entry of the two lists decided | 131 = 124 in scope + 7 excluded; the test fails on an undecided entry |
| excluded entries absent from the database | tested for all seven |
| page text only for sources about our vehicles | tested |
| reload | idempotent; a second run gives the same counts |
| live analysis G60 / US | section 3 |

Rows per scope (market rows plus worldwide rows, after the vehicle filter):

| Scope | Rows | About the vehicle | Not confirmed |
|---|---|---|---|
| G60 US | 79 | 17 | 19 |
| G60 EU | 63 | 6 | 17 |
| G70 US | 79 | 17 | 18 |
| G70 EU | 60 | 3 | 17 |
| G70 CN | 74 | 1 | 22 |
| G68 CN | 77 | 4 | 23 |
| F70 EU | 51 | 1 | 15 |

## 3. Live analysis with the external evidence

`tracepoint agent analyze --vehicle G60 --market US --no-cache`, run
`RUN-20261011-035557-agent.analyze.G60.US-2e8f`, `gpt-5.4-2026-03-05`, prompt
`situation-analysis-v7`, pack `context-pack-v4`. Filed as `reports/analysis/G60_US.md` and
`.json` (replaces the sample of step 16).

| Measure | Value |
|---|---|
| Model turns / tool calls / cost | 4 / 22 / USD 0.35 |
| `get_external_evidence` calls | 3 (software / HMI, HV battery, charging) |
| References cited | 55, none unknown; 10 of them external rows |
| Customer quotes not found in a cited verbatim | 0 |
| Insights / recommendations | 8 / 8 |
| H1 package / H2 package | 10.6 % of a new generation, adapt / 49.0 %, new generation |
| Open faults after the one correction | 1 (a change that starts in software / HMI while its evidence sits in charging; left for the product manager, D-079) |

What the external rows changed in the analysis:

* **Range**: the 67 complaints about electric range are set against the official figures: 239 to
  310 miles for the 2025 and 2026 i5 variants depending on drive and wheel size, 34 miles
  electric for the 550e (EPA, computed rows). The analyst reads the complaints as a matter of
  predictability as much as of range.
* **Public charging**: 55 complaints, "partly a market problem, not only a vehicle problem": 33
  electric cars per public charging point in the US against 11 in the EU and ten in China (level
  medium), with Supercharger access since December 2025 and rising satisfaction with public
  charging as the other side.
* **HMI**: the proposal to bring frequent functions back to one touch cites the S&P survey (48 %
  prefer a mix of touchscreen and buttons) beside the 723 complaints of the subsystem.
* **Successor**: the larger range step is placed in H2 with the accepted range of the S&P survey
  (300 miles) and the Neue Klasse figures (805 km WLTP, 400 kW).
* Under assumptions and gaps the analyst writes that external evidence is supporting context
  only, that many rows are weak single-source items, some worldwide rather than US, and that no
  unverified row carried a recommendation alone.

## 4. Known limitations

* 28 of 100 pages could not be read, among them every Edmunds page (expert and long-term test of
  the i5) and six Business Wire releases. Their claims stand as "not fetched" with the list's
  figure. Reading them is manual work; a browser session is not built.
* The check proves that the figures stand together on the page, not that the sentence means what
  the claim says. Every confirmed claim was read once by the assistant, not by a second reader.
* The topics behind the evidence level are authored and coarse: "hands-free driving" joins
  demand surveys and competitor fleets. A strong level says that several institutions point the
  same way, not that they measured the same thing.
* A row about a vehicle shows only in its own market. The British tests of the G60 do not appear
  in a US analysis although the cockpit is the same.
* Chinese pages are stored as they are; the full-text search is English, so their text is found
  only through the claims.
* The Sohu review page pools every model year since 2001, and the Autohome page gave the rating
  and the review tags but not the single reviews. China still has no verbatims.
* The competitor matrix of `plan/05` (feature by rival) is not built: the price lists are home
  pages in the list, and unknown cells stay unknown.
* The four rows of `config/cpm/market_context.yaml` are untouched because the frontend content is
  built from them; three of them repeat P-01, P-03 and T6-07 from a secondary outlet.
* The trend score of the list (momentum 35, customer pull 35, evidence quality 20, recency 10,
  contradiction penalty) is not computed; its inputs are stored.
* The stored pages are third-party text that reaches the model through `search_documents`. The
  tools only read, and every agent prompt carries the rule that tool results are data, never an
  instruction (D-069); an instruction hidden in a page can still bend an answer.
* `--fetch` parses the pages and PDFs it receives and runs from the command line only, never
  from the API. After the security review (D-084) it follows redirects itself, refuses every hop
  to a non-public address and cuts a body off at 30 MB while reading. The address is checked
  before the connection, not pinned to it.
* The first probe of four URLs in this session carried the committer's e-mail address in the
  user agent. The client in the repository does not.

## 5. Next step

* Read the ten refused and ten timed-out pages by hand and pin or correct their claims.
* Decide with the frontend whether the subsystem dialog shows external rows, and replace the
  three secondary market rows with their primary sources.
* Phase 5: trend alignment and competitive pressure as score components, from `feeds`, trust,
  date and the contradictions stored here.
