# Step 12 – CPM effort engine on the backend data (Phase 5 input)

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – 57 requirements estimated, back-test 8/8, 47 tests passed |
| Why | The first CPM prototype (`cost/cpm_engine.py`, effort-metrics pitch, cost rules 41–52) was a stand-alone script with hard-coded values; it had to work on our requirements, catalogues and audit trail |

## 1. Delivered

* **Engine** `backend/tracepoint/effort/cpm.py`: pure Python, no database. Formula of the
  prototype (CPM path risk, `1 − Π(1 − risk)` over paths of at most three steps, certification
  add-on, K3 rule, thresholds 15 / 50), plus rule 45 (several changes combined per subsystem,
  certification once per package), rule 51 (P5–P95 and decision stability), rule 52 (strongest
  path per affected subsystem) and T-shirt sizes for the UX spec.
* **Inputs as files** `config/effort/`: `model.yaml` (12 weights with their basis, 28 links with
  a reason each, all parameters, per-vehicle applicability), `anchors.yaml` (the 8 BMW decisions
  with sources, plus the fridge and seat-ventilation proposals), `requirements/<vehicle>_<market>.yaml`
  (a change profile for each of the 57 requirements). Every estimate stores the model hash.
* **Store** `effort/store.py`: validates the profiles against the requirements and the CPM rules,
  scans the option-list catalogues for each change (rule 43, levels 0–3 of v0.2 rule 22, with
  the spread over the vehicle's variants), checks the result against the requirement horizon,
  writes table `requirement_effort` (new table, `db init` adds it) with an audit event
  `effort.estimated` / `effort.updated`. Profiles are separate from the requirement files on
  purpose: an effort correction does not create a requirement version or void a G2 decision.
* **Variations** (master plan Phase 5): H1 package on the current model, H2 successor, and
  everything on the current model, each combined with rule 45.
* CLI `tracepoint effort backtest | estimate | report`, API `GET /effort/backtest`,
  `GET /effort/requirements`, `GET /effort/scenarios`, effort in `GET /requirements/{id}`, agent
  tool `get_effort` (ninth tool). `start.sh` / `start.ps1` run back-test, estimate and report.
* Sample reports `reports/effort/effort_{F70_EU,G60_US,G70_US}.md`.

## 2. Corrections to the prototype

1. **Propagation did not depend on the size of the change.** A 3 % start-stop calibration
   (powertrain 0.03) came out at 12.5 % of a new vehicle, more than a new PHEV drive. All anchors
   have an own impact ≥ 0.3, so the back-test could not show it. Now the first-hop likelihood is
   scaled by `own_impact / 0.3` below 0.3 (`propagation_reference_impact`); the start-stop case is
   1.9 %, and the back-test numbers are unchanged.
2. **"Every input varied ±50 %" was not true.** The prototype varied W, L and I only; the
   certification add-on, the carryover factor and the own impacts were fixed. The default scope
   `all` now varies them too; `--scope matrix` reproduces the pitch numbers exactly.
3. **K3 is an explicit, validated layer.** Replacing a platform subsystem (body, HV battery,
   powertrain, E/E architecture – E/E added from rule 42) at ≥ 80 % without carryover must be
   authored as K3, otherwise the import stops. K0 (configuration) does not propagate and is
   limited to an own impact of 0.1.
4. **Vehicles differ.** The F70 has no HV battery and no charging subsystem (ICE / MHEV only in
   the catalogue); its weights are renormalised without them, and a change that starts there is
   refused (it would be a new powertrain concept).

## 3. Back-test

| Anchor | Effort % | P5–P95 (`matrix`) | P5–P95 (`all`) | Decision | BMW |
|---|---|---|---|---|---|
| New colours / wheels (G30 LCI) | 0.8 | 0.5–1.1 | 0.4–1.3 | adapt | adapt |
| Headlights + bumper (G30 LCI) | 5.7 | 3.9–7.8 | 3.4–8.4 | adapt | adapt |
| OS 7 + OTA (G30 LCI) | 4.2 | 2.5–6.0 | 1.8–7.3 | adapt | adapt |
| PHEV 545e from module kit | 9.4 | 6.9–11.7 | 5.0–13.8 | adapt | adapt |
| G68 long wheelbase | 25.2 | 21.7–28.6 | 16.9–32.8 | major revision | major revision |
| Gen6 / 800 V battery | 49.0 | 39.7–56.3 | 36.7–56.9 | new generation (K3) | new generation |
| i4 LCI 2025 range | 11.5 | 8.6–13.8 | 5.0–16.1 | adapt | adapt |
| iX3 LWB (same inputs as G68) | 25.2 | 21.7–28.6 | 16.9–32.8 | major revision | major revision |

8/8 in both scopes (7/7 independent). Score-class stability under `all`: battery 72 %
(borderline, decided by the K3 rule), i4 91 %, 545e 98 %, G68 98 %, others 100 %.

## 4. Results on our requirements

| Scope | H1 requirements | H1 package | Sum of single | H2 package | Everything on the current model |
|---|---|---|---|---|---|
| G60 US | 17 | 18.4 % major revision (73 % stable) | 23.9 % | 49.0 % new generation (range, K3) | 60.9 % new generation |
| G70 US | 16 | 14.4 % adapt (55 % stable) | 18.1 % | 57.4 % new generation | 65.0 % new generation |
| F70 EU | 17 | 21.4 % major revision (85 % stable) | 25.8 % | – (only a preserve requirement) | 21.4 % |

* Every H1 requirement is "adapt" on its own, but the H1 packages of G60 and F70 together are
  beyond a normal LCI. This is what the change-count rule 23 and a per-requirement view cannot
  show: the PM has to split them over the LCI and model years, or accept a major revision.
* No horizon conflict: both range requirements (G60 PR-03, G70 PR-02) are K3 and sit in H2; the
  opening glass roof of the G70 (25 %, body in white, certification) is a major revision and
  sits in H2. The calmer G70 front (not recommended, H2) is 5.7 % and could go into an LCI
  (flag, rule 48).
* Largest H1 items: F70 physical climate keys and controller 4.2 %, G60 seats 4.6 %.

## 5. Inconsistencies to fix in the documents

* **Rule 42 vs the G68 anchor.** Rule 42 lists the wheelbase as K3 and rule 47 makes any K3 a
  new generation, so the G68 would be "new generation" – but BMW built it as a derivative. The
  engine treats the stretch as K2 (body redone at 40 %, platform prepared). Suggested wording:
  "K3 = a platform subsystem is replaced (≥ 80 %) without carryover".
* **The G68 "major revision" depends on the certification add-on.** Without the +12 it is 13.2 %
  (adapt). The add-on is our own assumption; the jury may ask.
* **Pitch: seat ventilation 5.4 %** is a development from scratch. The catalogue and rule table
  say the G60 and G70 offer it (Comfort / Connoisseur package), so for them it is K0 and for the
  F70 a carryover. The fridge (6.0 %) stays new for BMW.
* **Cost rules table** (fridge 5.9 %, battery 36.8 % + add-on) is older than the engine (6.0 %,
  49.0 % incl. add-on).
* **Pitch: "one matrix serves 5 and 7 Series (CLAR)"** is right, but the F70 is FAAR; its matrix
  is reused as an assumption (`model.yaml`, vehicles).
* **Pitch: 67 % stability of the battery** is the score class; the final decision is 100 %
  stable because the K3 rule decides it. With scope `all` it is 72 %.
* **Code path**: the pitch names `cost/cpm_engine.py`; the engine is now
  `backend/tracepoint/effort/cpm.py`, run with `tracepoint effort backtest`.

## 6. Known limitations and next steps

* The 57 change profiles (subsystem, own impact, layer, carryover) are the assistant's
  estimates. The fastest improvement is to let BMW mentors check the 12 weights, five or six key
  links (battery → body, battery → thermal, seats → HVAC) and the largest profiles.
* The i4 range upgrade carries over and so gets no certification add-on, although a range
  change is re-homologated; a smaller "re-homologation" add-on for carryover changes of the
  certification subsystems would be more realistic.
* Rule 48 (timing: LCI in year 3, successor within 3–5 years) is not modelled yet; it needs
  launch and LCI years per vehicle in `config/vehicles.yaml`.
* Phase 5 scoring should use `effort_pct` (or the size) as the negative factor of the score bar.
