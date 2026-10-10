# Step 04 – LLM gateway, classification pipeline and first finding extraction

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – gateway and classification pipeline ready for the OpenAI API details; deterministic findings extracted for four vehicle × market scopes |
| Scope agreed with the team | Item 1 (provider-agnostic LLM gateway), item 2 (classification and segmentation prompts, schemas, blind-validation samples), item 4 (finding model and deterministic extraction) of the step 03 follow-up options |
| Not in this step | Real classification runs (need the API key and model names), embeddings and retrieval (WP1.9), external sources (Phase 2), PM workspace UI |

---

## 1. What was built

### 1.1 LLM gateway (`backend/tracepoint/llm/`)

* `gateway.py`: `LlmGateway` with one `Provider` protocol. `OpenAIProvider` uses chat completions
  with strict JSON-schema structured outputs; `FakeProvider` serves tests and dry runs.
* Response cache keyed by a hash of provider, model, prompt version, system and user text,
  schema and temperature: identical requests are served from `llm_call` without a provider call.
* One JSON repair attempt when an answer does not validate against the Pydantic schema; retries
  with exponential backoff on rate limits, timeouts and 5xx errors; truncated answers rejected.
* Every call logged in `llm_call`: purpose, provider, model, prompt version, tokens (input, cached,
  output), cost estimate from `config/llm/pricing.yaml`, request and response, status, latency,
  attempts. Cost cap per run (`TRACEPOINT_LLM_MAX_COST_USD_PER_RUN`, default 25 USD).
* `complete_many`: cache lookups and logging in the calling thread, provider calls in a thread
  pool (`TRACEPOINT_LLM_CONCURRENCY`).
* `schema.py`: Pydantic → strict JSON schema (closed objects, all properties required, nullable
  optionals). `pricing.py`: cost estimate and a rough token estimator for dry runs.
* Settings: `TRACEPOINT_OPENAI_API_KEY`, `TRACEPOINT_OPENAI_BASE_URL`, `TRACEPOINT_OPENAI_MODEL`
  (reasoning), `TRACEPOINT_OPENAI_MODEL_BULK` (bulk), concurrency, timeout, attempts, temperature.

### 1.2 Classification pipeline (`backend/tracepoint/classify/`)

* `schemas.py`: `GapClassification` (multi-label: feedback type, canonical level 2 and level 3,
  confidence, rationale, optional new-theme proposal; `is_product_feedback`), `Segmentation`.
* `prompts.py`: versioned prompts (`gap-classification-v1`, `source-b-segmentation-v1`); the gap
  prompt embeds the canonical lists (225 level-2 names with domains, 84 level-3 names with
  polarity) and the classification rules of decision D-004.
* `fewshot.py`: lexical retrieval of up to eight similar, canonically labelled verbatims of the
  same vehicle through PostgreSQL full-text search (GIN index created by `db init`), used as
  few-shot examples until embeddings exist (D-028).
* `gap.py`: target selection (verbatims with unclassified rows and no LLM labels yet), request
  building, result application (new rows with origin `llm`, duplicates skipped, unknown themes
  stored as `proposed` level-2 entries), audit events per verbatim and per run, dry-run mode
  with token estimates and a sample prompt under `data/llm/dry_run/`.
* `segment.py`: Source B notes (and texts ≥ 600 characters) split into product and process
  statements stored as `verbatim_segment` rows.
* `validation.py`: stratified blind sample (300 per vehicle, seed 42) written to
  `config/validation/blind_sample_<vehicle>.yaml`; blind re-classification with agreement
  metrics (feedback type, level 2, level 3, pair) and per-domain level-2 agreement, written to
  `reports/validation/`.
* CLI: `tracepoint classify gaps | segments | prepare-sample | validate` (all with `--dry-run`
  where applicable).

### 1.3 Finding model and deterministic extraction (`backend/tracepoint/findings/`)

* Tables `finding`, `finding_evidence`, `finding_link` (Phase 3 data model): layer, kind, domain,
  theme or attribute, title, statement, quantification JSON, severity score, evidence level,
  status, version, creating and updating run.
* Extraction per vehicle × market (`findings/extract.py`), no LLM involved:
  * **Voice of customer**: per canonical level-2 theme, complaint rows (Defect, Difficult to use,
    Wants) with a weighted severity (3 / 2 / 1.5), share of all complaint rows in the market,
    source, powertrain and country breakdown, up to eight example classification rows as
    evidence; kinds `recurring_complaint`, `unmet_need` (wishes ≥ 50 % of complaints) and
    `strength` (≥ 15 likes and ≥ 70 % like share).
  * **Quantitative metrics**: per study metric, gap versus the peer mean of other BMW models in
    the same market, versus the same vehicle in other markets, bottom-3-box share (US) and rank
    among the vehicle's attributes; kinds `metric_gap` and `metric_strength`, peer metrics
    linked as comparison evidence; pricing attributes marked `context_only`.
  * **Portfolio offering**: for complaint themes mapped in `config/findings/theme_equipment_map.yaml`,
    the related catalogue items with their standard / optional / not-available status per
    variant; kind `equipment_gap` when the equipment is not standard on every variant.
  * **Cross-layer links**: voice-of-customer findings ↔ study metric findings through
    `config/findings/theme_attribute_map.yaml` (`supports` for weak metrics, `contradicts` for
    strong ones); equipment gaps `explain` their customer finding. Evidence level A requires a
    supporting metric link plus several source types and ≥ 20 rows (D-031).
  * Stable identifiers, upsert with versioning and before / after events, withdrawal of findings
    that are no longer produced (D-030).
* `findings/report.py` and CLI `tracepoint findings extract | report`; API `/findings` (filters)
  and `/findings/{id}` (evidence, links in and out, event history).
* Thresholds in `config/findings/findings.yaml`.

## 2. Verification

| Check | Result |
|---|---|
| Tests | 25 passed (gateway cache, JSON repair, batch errors, budget cap, few-shot retrieval, gap classification and proposals with the fake provider, segmentation, sample preparation, finding extraction, idempotent re-extraction, report rendering, plus the 14 ingestion and API tests) |
| Gap classification dry run (G60) | 725 target verbatims; system prompt ≈ 3.6 k tokens, user prompt ≈ 0.8 k tokens on average; ≈ 3.2 M input tokens in total before provider-side prompt caching |
| Segmentation dry run (G60) | 2,738 target verbatims; ≈ 0.6 M input tokens |
| Blind samples | F70, G60, G70: 300 verbatims each, stratified by feedback type |
| Findings G60 US | 211 (158 voice of customer, 26 metrics, 27 equipment gaps); 60 links; 4 level A, 101 B, 106 C |
| Findings G70 US | 263 (157 / 51 / 55); 124 links; 14 level A |
| Findings F70 EU | 90 (61 / 16 / 13); 29 links |
| Findings G60 EU | 31 (4 / 27 / 0); 4 links (few EU verbatims for G60) |
| Re-extraction | 0 created, 0 updated, all unchanged; versions stay at 1; no duplicate evidence |
| Withdrawal | 4 equipment-gap findings withdrawn after the term map was refined (events `finding.withdrawn`) |
| Audit | `finding.created` 599, `finding.updated` 7, `finding.withdrawn` 4, `findings.extracted` per run, dry-run events |

Examples from `reports/findings/G60_US.md`: `FND-G60-US-VOC-seats` (55 complaints, level A,
linked to the weak seat-comfort study attributes and to the comfort-seat option), `FND-G60-US-VOC-electric_range`,
`FND-G60-US-EQ-panorama_glass_roof` (21 complaints with 12 wishes; glass roof optional at 1,630 EUR
on all variants).

## 3. Known limitations

* Finding statements are template text; narrative quality and cross-layer reasoning beyond the
  authored maps come with the LLM steps (finding narration, linker) once the API is available.
* Equipment matching is term-based on the German catalogue (Germany-only offering); mappings are
  authored and should be reviewed by the team.
* Study comparisons use the available peers only (CN/EU: up to four BMW models; US: G60 vs G70);
  no competitor benchmark until Phase 2.
* Evidence levels are first-iteration rules (D-031) and will be tuned when external evidence
  arrives.

## 4. Open items for the team

1. OpenAI API key, chat model name(s) and embedding model name; prices for
   `config/llm/pricing.yaml` if cost estimates are wanted.
2. Review of `config/findings/*.yaml` (thresholds, theme → attribute and theme → equipment maps)
   and of the sample finding reports under `reports/findings/`.
3. When the key arrives: run `classify validate --vehicle G60 --limit 50` first (cost check and
   agreement), then the full validation, then `classify gaps` and `classify segments`.

## 5. Next step

Step 05 (with API details): validation and classification runs, Source B segmentation,
embeddings and hybrid retrieval (WP1.9), context packs and drill-down tools, Phase 1 close-out.
Without API details: Phase 2 source registry and research-agent design, or the read-only
evidence and findings explorer UI.
