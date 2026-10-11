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
`reports/analysis/` (both now written with prompt v3).

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

## 4. Known limitations

* The analyst's change profiles are assumptions stacked on an uncalibrated model. For Korea it
  set carryover on two software changes; nothing checks that claim unless catalogue terms match.
  The report shows the profile and its reason so that it can be corrected.
* Analyst profiles live in the analysis file only. Turning a proposal into a requirement with a
  reviewed profile is still the authored path of D-060 and D-063.
* A package beyond its horizon is flagged, not resolved: splitting it over model years is the
  product manager's decision (step 12, section 4).
* The G60 US H1 package is borderline: adapt in 69 % of the sensitivity runs, a major revision
  in the rest.
* Each analysis runs the sensitivity (2,000 runs) once per check, which adds a few seconds.

## 5. Next step

Phase 5 scoring can take the same engine output as its negative factor. For the analyst, the
next gain is a requirement agent that writes the proposals of a scope without a requirement file
(RoW, CN) as reviewable files, with their profiles.
