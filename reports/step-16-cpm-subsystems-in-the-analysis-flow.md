# Step 16 – The CPM subsystem view in the backend and in the analysis flow

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – backend view equal to the frontend content, three live analyses, 72 tests passed |
| Why | Step 15 gave the analyst the effort engine. The theme to subsystem mapping and the market evidence of the frontend's step 13 (`config/cpm/`, D-073 to D-076) were read by the frontend build only. The analyst chose the subsystem of a change by judgement and had no market or competitor evidence at all |

## 1. Delivered

Decision D-081.

While this step was in work, `main` revised the frontend side (PR #20, D-076): the subsystem
list now reads the engine's model file instead of a second copy, the view carries a narration
per block, and the frontend plan names the endpoints it expects. This step follows that revision.

### 1.1 The subsystem view in the backend (`effort/subsystems.py`)

* Reads what the frontend build reads: `config/effort/model.yaml` (subsystems, weights, links,
  the subsystems a vehicle does not have), `config/cpm/theme_subsystem_map.yaml` (225 themes,
  222 mapped, 3 in no subsystem) and `config/cpm/market_context.yaml`. The mapping is validated
  on load (known subsystems, no theme twice).
* `subsystem_view(vehicle, market, country, labels, subsystem)` returns the `CpmView` of
  `frontend/lib/content/cpm-types.ts`: per subsystem present on the vehicle the weight
  (renormalised to 100), rows, likes and complaints; a liked and a criticised block, each with
  the derived narration (suggestion and summary) and up to six themes with two verbatims each;
  the market rows; and the absent subsystems with the rows that fall in them.
* The narration is the template text of `frontend/scripts/build-cpm.py`, ported sentence for
  sentence, with `basis: derived`.
* Two counting bases, named in every output: `labels=given` counts the workbook labels, as the
  committed baselines and `frontend/content/cpm.json` do; `labels=all` adds the assistant's gap
  labels (D-056), as the baseline builder and the context pack do.
* Market rows get a stable id and an evidence reference, `market:MKT-<market>-<subsystem>-<n>`.
* `subsystems_of_refs`: the subsystems a list of references sits in. Verbatims through their
  labels, findings and requirements through their themes, market rows by their own subsystem.

### 1.2 Endpoints (section 7 of `plan/07-frontend-plan.md`)

Plan v2 listed three of these as existing; `plan/08` (merged while this step was in work)
corrects that and requests them. Its other requests (`GET /analyses`, a scope filter on
`GET /events`, the export endpoint) are not part of this step.

| Endpoint | Returns |
|---|---|
| `GET /cpm/{vehicle}?market=&country=&labels=given` | `CpmView` |
| `GET /effort/model` | the catalogue part of the content (`method`, `subsystems`, `mapping`, the source notes, `domains`) plus `vehicles` (platform, absent subsystems, note) and `modelHash` |
| `POST /effort/estimate` with `{vehicle, market?, requirement_ids?, changes?}` (the shape requested in `plan/08`, section 7) | `items[]` (each requirement's stored estimate and each free change on its own: `effort_pct`, `p5`, `p95`, `decision`, `decision_stable_pct`, `layer`, `size`, `certification_add_on`, `subsystems[]`, `changes[]`), `sum_of_single_pct`, `combined` (all changes per subsystem, rule 45), `model_hash`, `basis`; 422 for a requirement outside the vehicle and market and for a change that breaks the model; nothing is stored |
| `GET /requirements/{id}/effort` | the stored estimate of one requirement |

The frontend type `CpmEffort` is to be defined from the `POST /effort/estimate` response.

### 1.3 In the analysis flow

* **Context pack** (`context-pack-v3`): a section with the subsystems of the vehicle (weight,
  complaints, likes, three most criticised themes) and those it does not have, the subsystem of every top complaint theme, and the
  market and competitor rows of the market with level, basis, source, date and contradiction.
* **Tool** `get_subsystems` (eleventh tool): the overview, or one subsystem with its liked and
  criticised themes and quotes; a subsystem the vehicle does not have is answered as such. `get_findings` and `get_verbatims_by_theme` return the subsystem
  of a finding or theme.
* **Prompt** `situation-analysis-v5`: the two views (customers speak in themes and domains,
  effort propagates in subsystems) and what the subsystem view is for; the rules for market
  evidence (rules 13 and 31 to 36 of the team's rule set): state the level, a weak row never
  carries a proposal alone, an assumption cannot raise confidence to high, both sides of a
  contradiction, a market figure is not customer feedback, no gap is filled from memory; and
  that a change starts where its evidence sits or says why not.
* **Computed, not written by the model**: the subsystems of every insight and proposal, from its
  references through the theme mapping. A change profile that starts outside the subsystems of
  its evidence gets a flag for the product manager.
* **Report**: subsystems under each insight and proposal, the subsystem footprint of the H1 and
  H2 packages, and what the catalogue terms of a profile matched (so a rule 43 flag can be
  judged).
* The loop accepts `evidenceRef` (the contract's spelling) as a citable reference.

## 2. Verification

| Check | Result |
|---|---|
| Backend view against `frontend/content/cpm.json` (`labels=given`) | G60 US (3,853 rows), G70 US (3,867), F70 EU (2,191, ten subsystems, HV battery and charging absent), G60 EU (165), G68 CN and G70 CN (no rows): equal field by field, including renormalised weights, both narration sentences of every block, themes, quotes and market rows. `GET /effort/model` equals the catalogue part |
| View build time | 5 to 65 ms per scope |
| Tests / lint | 71 passed (mapping covers the 225 canonical themes once, view and catalogue equal to the frontend content, scopes and counting bases, market rows and attribution, the tool, the four endpoints, a package of requirements and free changes); `ruff check` and `ruff format --check` clean |

Live analyses with `gpt-5.4`, prompt v5, pack v3 (samples under `reports/analysis/`, now also
G68 CN):

| Scope | Model turns | Tool calls | References (unverified) | Market rows cited | Proposals flagged "starts outside its evidence" | Cost (USD) |
|---|---|---|---|---|---|---|
| G60, market US | 4 | 14 | 56 (0) | US EV share, used as weak context only | 1 of 7 | 0.29 |
| G68, market CN | 2 | 7 | 34 (0) | NEV sales; in-car fridge with both sides of its contradiction | 1 of 5 | 0.11 |
| F70, country GB | 2 | 12 | 54 (0) | EU powertrain mix, as context | 0 of 6 | 0.17 |

What changed in the content: the G60 US analysis now states range and charging in subsystem
terms (HV battery 89 complaints, charging 123), and its H1 package shows its footprint (software /
HMI 5.5 %, E/E architecture 2.0 %, interior / console 2.0 %). The China analysis proposes the
fridge as a packaging question, citing the competitor row and its disputed usage, instead of
having no market evidence at all.

Model calls of this branch so far, development included: 64 calls, USD 3.86 (the three analyses
were run twice: once before `main` revised the contract, once on the final code).

## 3. Second part: where a change starts and how large it is (D-082)

After the first part the start subsystem of an analyst's change was an information flag and its
size (`own_impact`) the model's judgement. Both decide the estimate: a seat change comes to about
5 % of a new vehicle generation, a battery generation to about 49 %.

* **Reference changes** (`effort.store.reference_changes`): the independent back-test anchors and
  the authored change profiles of the 57 requirements, per subsystem. Software / HMI has 33
  (0.02 to 0.4, the OS 7 release), interior / console 19, exterior design 9; chassis, powertrain
  and HV battery 4 each; body, seats, thermal and charging 3 each; paint 1.
* **In the prompt** (`situation-analysis-v6`): the smallest, a middle and the largest reference of
  every subsystem. The model sets `own_impact` by comparison and names the comparison in the
  change's `why`.
* **Size check**: a value outside the range of its subsystem's references goes back to the
  model, where the subsystem has at least three references. With fewer, the report says the size
  rests on the analyst's judgement alone.
* **Start check**: a change that starts in a subsystem none of the cited findings, requirements
  or market rows sits in, and that fewer than two of the cited verbatims touch, goes back to the
  model. A finding carries one theme; a verbatim carries several labels, so one verbatim alone
  pins nothing.
* **Report**: under every analyst change the nearest reference at or below and at or above its
  size. What the correction request does not settle stays as a warning.

Live runs with prompt v6 (these are the samples under `reports/analysis/`):

| Scope | Model turns | Tool calls | References (unverified) | Analyst changes sized | Start or size sent back | Open faults | Cost (USD) |
|---|---|---|---|---|---|---|---|
| G60, market US | 3 | 15 | 51 (0) | 1 (body 0.05, "smaller than the long-wheelbase body change at 0.4") | 0 | 0 | 0.22 |
| G68, market CN | 2 | 12 | 33 (0) | 6 in 5 proposals, each naming its reference in `why` | 0 | 0 | 0.11 |
| F70, country GB | 2 | 12 | 47 (0) | 0 (every proposal uses a requirement's profile) | 0 | 0 | 0.17 |

No live run produced a size or a start that had to go back; the test with the fake provider
covers both (a change that starts outside its evidence, and sizes above every reference). In the
China run four proposals carry the flag "the cited evidence pins no subsystem": study scores
have no theme.

72 tests passed. Model calls of this branch so far, development included: 71 calls, USD 4.36.

## 4. Known limitations

* A verbatim with several labels counts for each of its subsystems, so the subsystem line of an
  insight shows the dominant subsystem and some noise. The start check therefore counts a
  subsystem only when a finding, requirement or market row sits in it or two verbatims do.
* The size check knows the range of the references, not the right value. A change understated
  inside the range passes; in the China run the analyst chose the smallest reference for three
  changes and said why. The layer (K0 to K3) is checked by the engine's rules only.
* The references are themselves assumptions: eight documented decisions and 57 profiles written
  by the assistant.
* Study metrics, catalogue items and sales rows carry no theme, so they have no subsystem. The
  China scopes, which rest on study scores, get no attribution.
* `market_context.yaml` holds four rows, all from secondary sources. The analyst treats them as
  the rules require, but the market layer is as thin as the file.
* The catalogue scan of rule 43 matches broad words (the fridge proposal matched interior trim).
  Carryover is not applied to an analyst's profile (D-072), so the effect is a misleading flag;
  the report now shows what was matched.
* The mapping, weights and links are assumptions (effort rule 50), as every screen says.
* The narration of a block is the derived template text. D-076 reserves the same two fields for
  the backend's agent (`basis: agent`); that agent is not built.
* The frontend still reads `content/cpm.json`; switching it to the endpoints is frontend work.
* `G70 EU` has 33 classified rows in the backend view; the frontend content withholds them
  until a baseline report exists for the scope.

## 5. Next step

The block narration by the agent (`basis: agent`), checked against the block's figures before
it replaces the derived text. Phase 5 scoring with effort as the negative factor. For the market
layer, more rows in `config/cpm/market_context.yaml` (the source registries of `plan/05`).
