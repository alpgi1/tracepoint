# Step 03 – Phase 1: foundation and internal data ingestion

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – internal ingestion complete and tested; LLM-dependent work packages deferred until the OpenAI API details arrive |
| Work packages | WP1.1, WP1.2, WP1.3, WP1.4, WP1.5, WP1.6, WP1.8 (authored config), WP1.10 (reports, API, tests, CI) |
| Deferred | WP1.7 (gap classification, Source B segmentation), WP1.9 (embeddings, retrieval, context packs), optional explorer UI, WP1.11 close-out |

---

## 1. Team decisions recorded in this step

* PostgreSQL instead of SQLite (D-019).
* OpenAI API for research agents, main agent and embeddings; keys, model and embedding names will
  be provided later; no external API call in this step (D-020, D-021).
* `docs/` stays the read-only location of the raw inputs (confirmed).
* Research needed for Phase 1 is done by the assistant (translations, attribute harmonisation,
  taxonomy domain map were authored directly as configuration files).

## 2. What was built

### 2.1 Foundation

* Python project under `backend/` (uv, ruff, pytest), Makefile targets, `.env.example`,
  `.gitignore`, GitHub Actions workflow with a PostgreSQL 16 service container.
* Settings module (`TRACEPOINT_` environment variables), identifier helpers, run registry (every
  command runs inside a run with a configuration snapshot and the git revision), append-only
  audit event log with JSON / CSV export.
* SQLAlchemy models for the Phase 1 data model (20 tables): vehicles, variants, markets,
  countries, sources, taxonomy level 2 / 3, verbatims, classifications, segments, study metrics,
  sales volumes, equipment items, availability, dependencies, technical specs, embeddings, runs,
  LLM calls, audit events. Every evidence row carries `source_id`, `locator` and `created_run_id`.

### 2.2 Ingestion

| Parser | Input | Output tables | Notes |
|---|---|---|---|
| `ingest/verbatims.py` | three feedback workbooks | `verbatim`, `verbatim_classification` | one classification row per Excel row; country → market mapping; `BEVE` → `BEV`; unclassified rows marked, never dropped |
| `ingest/studies.py` | customer studies workbook | `study_metric` | CN/EU means and US 7-step distributions (shares, derived 1–7 mean, top-2 and bottom-3 box); attribute harmonisation from `config/studies/attribute_map.yaml` |
| `ingest/sales.py` | sales workbook | `sales_volume` | 2030 flagged as forecast; `G60_G68` attached to G60 with a note (D-025) |
| `ingest/optionlists.py` | three German PDF catalogues | `vehicle_variant`, `equipment_item`, `equipment_availability`, `equipment_dependency`, `tech_spec` | position-based parsing: rotated headers → variant columns, ■ / □ / –,– → availability, SA codes, prices, dependency notes, package contents, technical data; merged cells approximated (D-024); English names from `config/equipment/translations.yaml` |
| `taxonomy/extract.py` | feedback workbooks | `config/taxonomy/vfc_level2.yaml`, `vfc_level3.yaml` | canonical, frozen lists with stable identifiers and occurrence counts; domain map and polarity applied from authored config; non-breaking spaces normalised |

### 2.3 Authored configuration (reviewable by the team)

* `config/vehicles.yaml`, `config/markets.yaml` (16 countries → 4 markets, D-023).
* `config/taxonomy/domains.yaml` (9 domains + general, D-022), `domain_map.yaml` (225 level-2
  themes → domains), `polarity_overrides.yaml`.
* `config/studies/attribute_map.yaml` (140 attribute names → 118 harmonised keys with domains;
  pricing attributes marked `scope: context_only`).
* `config/equipment/translations.yaml` (299 German item names → English), `groups.yaml`
  (catalogue groups → domains).

### 2.4 Reports, API, tests

* `reports/baseline.py`: baseline situation-analysis report per vehicle × market (coverage, theme
  landscape by domain, top complaint themes with quotes and evidence references, strengths, study
  weak / strong attributes with peer and cross-market comparison, equipment summary, sales weight,
  data-quality notes). Samples committed under `reports/baseline/` for F70 EU, G60 US, G60 EU,
  G70 US.
* FastAPI read API (`/health`, `/vehicles`, `/markets`, `/taxonomy/*`, `/verbatims`,
  `/verbatims/{id}`, `/studies`, `/sales`, `/equipment`, `/specs`, `/runs`, `/events`,
  `/reports/baseline/{vehicle}`); every evidence endpoint returns locators and evidence references.
* pytest suite (14 tests) that ingests `docs/` into the test database once per session and pins
  the step 01 counts, spot-checks catalogue rows, verifies mapping coverage, audit round trip and
  API responses. Runtime about 14 seconds.

## 3. Verification (numbers)

| Check | Result |
|---|---|
| Verbatims F70 | 4,076 rows, 2,128 verbatims, 2,989 canonical rows, 1,087 unclassified, 0 unresolved |
| Verbatims G60 | 5,005 rows, 4,000 verbatims, 4,280 canonical, 725 unclassified, 0 unresolved |
| Verbatims G70 | 4,690 rows, 4,000 verbatims, 4,020 canonical, 670 unclassified, 0 unresolved |
| Market mapping | 0 verbatims without market |
| Taxonomy | 225 level-2 (all mapped to a domain), 84 level-3 (54 negative, 17 positive, 13 request) |
| Studies | 185 CN/EU means, 206 US distributions, 0 unmapped attributes, all US distributions sum to 1 ± 0.02 |
| Sales | 36 rows (3 vehicles × 4 markets × 3 years) |
| Variants | F70 6, G60 10, G70 7 with powertrain, power and base price |
| Equipment | 463 items, 2,350 availability rows, 544 dependency notes, 342 technical specs; 0 untranslated, 0 without domain; 42 rows flagged as inherited |
| Spot checks | F70 `248` steering wheel heating 250 EUR optional on all six variants; F70 `674` harman/kardon standard only on M135 xDrive; F70 `5DW` optional on 120, 123 xDrive, 120d only; G60 `5DW` 1,150 EUR; G70 `3CD` automatic doors 1,600 EUR; F70 `1H5` no-cost option, standard on M135 xDrive |
| Audit | 13 runs, 8 registered sources, 48 events (runs, source registrations, one summarising event per ingestion step with counts and data-quality notes) |
| Tests | 14 passed |

Classification rows by vehicle domain (all vehicles, canonical rows): infotainment & digital
2,377 (1,799 complaints), powertrain / range / charging 2,073 (798), driving dynamics 1,948
(401), interior comfort 1,761 (983), exterior 888 (400), driver assistance 885 (554), quality /
NVH 619 (279), space & practicality 558 (420), general 161 (152).

## 4. Known limitations and data-quality notes

* Merged catalogue cells are approximated by inheritance and flagged (42 rows); package pages
  list contents without availability marks; technical values keep the catalogue text and the
  first number as `value_num` (for ranges this is the lower bound).
* Source B call-centre notes still contain process and dealer content; product-statement
  segmentation waits for the LLM step.
* Unclassified rows (2,482 across the three vehicles) wait for the LLM gap classifier.
* The audit log records ingestion at step level; row-level provenance is in the rows themselves
  (D-026).
* Study scales are assumed (1–10 means; 7-step distributions); no sample sizes are available.

## 5. Open items for the team

1. OpenAI API key, chat model name(s) and embedding model name (`.env`), see Phase 1 plan § 13.
2. Review of the authored mappings (domain map, attribute map, translations) and of the baseline
   reports; corrections are configuration edits.
3. Decision whether to install `pgvector` for embeddings or keep in-process search.

## 6. Next step

Step 04 (when the API details arrive): LLM gateway for OpenAI, gap classification with few-shot
retrieval, Source B segmentation, blind validation, embeddings, hybrid search, context packs and
drill-down tools (WP1.7, WP1.9), then the Phase 1 close-out report (WP1.11). In parallel the
Phase 2 source registry design can start as soon as the team names the external sources.
