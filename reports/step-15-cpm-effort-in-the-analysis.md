# Step 15 – CPM effort in the situation analysis

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – three live analyses with engine-computed effort; 62 tests passed |
| Why | The effort engine of step 12 arrived on `main` after the analyst of step 14 was written. The analyst proposed horizons without any view of effort, and the engine knew only the 57 authored requirements |

## 1. Merge

`main` (PR #16, CPM effort engine) was merged into this branch. Conflicts in `api/app.py`,
`cli.py` and `plan/decisions.md`; both sides kept. Main's decisions D-062 to D-064 and its step
12 report were already published, so this branch's decisions moved to D-065 to D-070 and its
reports to step 13 (group report) and step 14 (agent loop and analyst).

## 2. Delivered

Decision D-071.

* **The model never writes an effort figure for its own proposals.** The answer schema of the
  analyst has a new field per recommendation, `effort_changes`: a change profile in the format
  of the engine (`effort.cpm.Change`: subsystem, own impact, layer, carryover, reason, catalogue
  terms). The engine computes the rest.
* **Two sources of a profile.** A recommendation that names an existing requirement takes the
  requirement's stored profile from `requirement_effort`. Any other recommendation that changes
  the vehicle uses the profile the analyst wrote, and the report says which of the two it was.
  A recommendation that changes nothing on the vehicle has none.
* **Per proposal**: effort in % of a new vehicle generation, P5–P95, class (adapt / major
  revision / new generation), share of sensitivity runs that keep the class, size, layer,
  certification add-on, the changes, the catalogue scan (rule 43) and the flags against the
  proposal's own horizon.
* **Per package**: the H1 and the H2 proposals of the analysis combined per subsystem (rule 45),
  with the sum of the single estimates beside it. A requirement proposed twice counts once.
  Package flags (class beyond the horizon, borderline class) are shown to the product manager.
* **Correction.** A profile that breaks a rule of the model (subsystem not on the vehicle, K3
  rule, K0 limit) and a single proposal whose class does not fit its horizon go into the one
  correction request of the loop, with the computed figure. What the model does not settle is
  listed in the report.
* **Prompt** `situation-analysis-v3`: what effort is (a share of a new generation, never money,
  uncalibrated), that it ranks behind customer need and decides horizon and packaging only, and
  how to write a change profile. The user message carries the effort model of the vehicle read
  from `config/effort/`: subsystems with weights, absent subsystems, layers, thresholds and the
  independent back-test anchors as reference points for the own impact.
* The analyst is told to read `get_effort` with the package variations where requirements exist.
* `effort/store.py`: `evaluate_changes` (estimate, catalogue scan, flags) and
  `engine_and_samples` are now public and used by both the estimate run and the analysis; the
  57 stored estimates are unchanged after the refactoring.
* The analysis file and the `analysis.created` audit event record the effort model hash.

## 3. Verification

Live runs with `gpt-5.4`, effort model `789fcb7624b8`; samples of the first and the third under
`reports/analysis/` were refreshed with prompt v4 after the review (section 4).

| Scope | Proposals | Profile from a requirement | Profile by the analyst | No vehicle change | H1 package | H2 package | Cost (USD) |
|---|---|---|---|---|---|---|---|
| G60, market US | 8 | 8 | 0 | 0 | 6 proposals, 13.1 % (6.8–20.0), adapt, kept in 69 % of the runs | 1 proposal, 49.0 %, new generation (K3) | 0.19 |
| G60, country KR | 5 | 0 (no requirements for RoW) | 4 | 1 | 3 proposals, 7.5 % (3.8–11.7), adapt | 1 proposal, 12.4 %, adapt, kept in 79 % | 0.14 |
| F70, country GB | 8 | 8 | 0 | 0 | 6 proposals, 10.4 % (5.8–16.1), adapt, kept in 91 % | – | 0.32 |

| Check | Result |
|---|---|
| Figures of proposals that name a requirement | equal to `reports/effort/` (G60 seats 4.58 %, range step 48.98 % K3, operating concept 3.05 %) |
| References and quotes | 59, 27 and 68 references cited, none unverified; no quote not found |
| Open effort faults after the correction request | 0 in all three runs |
| Effort correction request | not triggered in the live runs; covered by the test with the fake provider (an H1 proposal that needs a new generation, and a battery change on the F70) |
| Repeat runs | served from the cache, USD 0.00 |
| Tests / lint | 62 passed; `ruff check` and `ruff format --check` clean |

Model calls of this branch so far, development included: 35 calls, USD 2.01.

## 4. Addendum after the security review (D-072)

The requirement id, the change profile and its carryover flag are model output. Two reviews of
the pushed commit found that they were trusted too far; all of the following is now enforced in
`effort_of_proposals` and tested.

* A named requirement lends its profile only if it exists, is not withdrawn and belongs to the
  vehicle and market under analysis. Before, any id was looked up, so a proposal could borrow
  the small profile of an unrelated requirement.
* A requirement the product manager rejected at gate G2 goes back to the model; a deferred one
  and a profile written for an older requirement version are flagged.
* Every recommendation declares `changes_vehicle`. A proposal that changes the vehicle and has
  no usable profile (none given, or one that breaks the model) is a fault and is listed as not
  counted in its package. Before, it was shown as "nothing on the vehicle changes" and skipped
  the horizon check.
* When a recommendation names a requirement and adds changes of its own, both are counted.
  Before, the additions were dropped.
* Carryover in an analyst's profile is reported and not applied: the profile is computed as a
  new development, and the report shows the figure with the claim beside it.
* The size limits (eight changes per proposal, five catalogue terms per change, 20 proposals)
  are part of the answer schema (D-076): the provider enforces them and an answer beyond them
  is rejected as a whole. A first version cut a profile to its first eight changes and still
  showed the estimate; nothing is cut now. Terms under four characters or with a wildcard are
  not searched and are named in a flag.
* Every estimate is computed from the current effort model, also one from a requirement's
  profile, instead of being copied from the table.

Live runs with prompt `situation-analysis-v4` (these are the samples under `reports/analysis/`):

| Scope | Proposals | Estimated | Declared no vehicle change | Open faults | H1 package | H2 package | Cost (USD) |
|---|---|---|---|---|---|---|---|
| G60, market US | 8 | 7 (5 from a requirement's profile, 3 with the analyst's own changes) | 1 | 0 | 6 proposals, 13.7 % (7.3–20.8), adapt, kept in 62 % of the runs | 1 proposal, 49.2 %, new generation | 0.20 |
| G60, country KR | 5 | 4 (all by the analyst) | 1 | 0 | 3 proposals, 9.2 % (4.8–13.8), adapt | 1 proposal, 13.4 %, adapt, kept in 68 % | 0.13 |
| F70, country GB | 7 | 5 (all from a requirement's profile) | 2 | 0 | 5 proposals, 8.4 % (4.6–13.0), adapt | – | 0.20 |

In the Korea run the analyst claimed carryover in three proposals; without the claim they come
to 4.9, 4.2 and 2.8 % instead of 4.4, 3.4 and 2.4 %. The figures of section 3 are those of
prompt v3 and are kept as the record of that run.

63 tests passed. Model calls of this branch so far, development included: 47 calls, USD 2.66
(one more live run for Korea confirmed that the provider accepts the bounded schema).

## 5. Known limitations

* The analyst's change profiles are assumptions stacked on an uncalibrated model: subsystem,
  own impact and layer are the model's judgement. The report shows the profile and its reason so
  that it can be corrected. Whether a proposal changes the vehicle is also the model's
  declaration; it is visible in the report, not verified.
* Analyst profiles live in the analysis file only. Turning a proposal into a requirement with a
  reviewed profile is still the authored path of D-060 and D-063.
* A package beyond its horizon is flagged, not resolved: splitting it over model years is the
  product manager's decision (step 12, section 4).
* The G60 US H1 package is borderline: adapt in 69 % of the sensitivity runs, a major revision
  in the rest.
* Each analysis runs the sensitivity (2,000 runs) once per check, which adds a few seconds.

## 6. Next step

Phase 5 scoring can take the same engine output as its negative factor. For the analyst, the
next gain is a requirement agent that writes the proposals of a scope without a requirement file
(RoW, CN) as reviewable files, with their profiles.
