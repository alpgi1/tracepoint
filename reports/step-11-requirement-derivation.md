# Step 11 – Requirement derivation (Phase 4, first iteration) and gate G2

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – 57 requirements for G60 US, G70 US and F70 EU; clean rebuild verified; 40 tests passed |
| Why | Deliverable D2 needs a structured requirement list traceable to findings and sources; until now the chain stopped at the findings |

## 1. Delivered

* **Data model**: `requirement` (ID, vehicle, market, domain, title, statement, 0/1
  recommendation with rationale, horizon H1/H2 with rationale, applicable markets, acceptance
  criteria per market with metric, target, method and basis, assumptions, uncertainties,
  evidence level, priority score for Phase 5, status, version) and `requirement_finding`
  (primary / supporting / context links).
* **Requirement files** `config/requirements/{G60_US,G70_US,F70_EU}.yaml`, written offline by
  the assistant from the findings, study scores and verbatims (D-060). Each file also lists the
  findings the agent filtered out of scope, with a reason (pricing, residual value, warranty,
  off-road on a sedan, low volume).
* **Import** (`requirements/store.py`): validates IDs, domains and finding references (unknown
  or withdrawn findings stop the import), derives the evidence level from the primary and
  supporting findings, versions every change with before / after audit events, withdraws
  requirements removed from the file, logs the exclusions. Re-imports are idempotent.
* **Gate G2**: `tracepoint requirements decide <id> approve|reject|defer --note …` and
  `POST /requirements/{id}/decision`; the rationale is mandatory, the decision is an audit event
  and a line in `config/decisions/requirements.jsonl`, replayed after every import and valid
  only for the version it was made on (D-061).
* **D2 export**: `tracepoint requirements export` writes Markdown and CSV; the committed sample
  is `reports/requirements/requirements_ALL_ALL.{md,csv}`. API `GET /requirements` and
  `GET /requirements/{id}` (requirement → findings → evidence references, plus event history).
* Agent tool `get_requirements` (eighth tool). `start.sh` / `start.ps1` import after the
  finding extraction and export at the end.

## 2. The first requirement set

| Scope | Requirements | Evidence A / B / C | H1 / H2 | Not recommended | Excluded candidates |
|---|---|---|---|---|---|
| G60 US | 20 | 7 / 12 / 1 | 18 / 2 | 1 (factory CD player) | 6 |
| G70 US | 19 | 11 / 8 / 0 | 16 / 3 | 1 (calmer front design, H2) | 7 |
| F70 EU | 18 | 0 / 18 / 0 | 17 / 1 | 0 | 4 |

F70 EU has no level-A requirement because no F70 EU finding reaches level A (Source A only,
D-037). By domain: infotainment & digital 15, powertrain & charging 9, interior comfort 9,
driving dynamics 7, space 5, exterior 4, general 3, driver assistance 3, quality 2.

Examples: automatic doors that open from a knee touch while driving (G70, safety); touch-only
climate control and the missing rotary controller (F70, 7.4 % of all complaints); seats and
lumbar support (G60, level A, two study gaps); public charging and NACS access (G60 and G70);
start-stop that cannot stay off (all three); functions that expire after three months (F70).
Three requirements protect strengths for the successor generation (handling, sportiness, fuel
economy).

## 3. Known limitations

* Targets: study-score targets are anchored on the 2025 study and the peer mean; complaint
  reductions and engineering values (cool-down time, delays, noise class) are labelled
  `assumption` and need engineering validation.
* Priority score and prioritisation rationale (D2 fields) are empty until Phase 5.
* Requirements are per vehicle × market; the same need in several scopes (climate controls,
  start-stop, onboarding) is not yet consolidated across scopes.
* The catalogue is the German price list; US standard-content statements are flagged as
  uncertain where they rely on it.
* G60 EU (35 findings, few verbatims) and the CN / RoW scopes have no requirement file yet.

## 4. Next step

Phase 5: deterministic scoring with weight profiles in `config/`, stored score components and
a written rationale per requirement, re-scoring and report diff on a weight change (gate G3).
