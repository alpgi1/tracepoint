# Step 10 – Agent data access: context packs and drill-down tools (WP1.9 without embeddings)

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – 38 tests passed, clean rebuild with `./start.sh --reset` verified; embedding similarity deferred (D-059) |
| Why | The ingested and classified evidence has to be usable by the agents of the later phases, following the three access modes of the Phase 1 plan § 3.3 |

## 1. Delivered

`backend/tracepoint/agent/`, decision D-058.

* **Context packs** (`context_pack.py`, version `context-pack-v1`): one compact JSON + Markdown
  summary per vehicle × market with evidence: coverage, the nine domains with complaint share,
  top eight complaint themes and top five strengths with three quotes each, weakest and strongest
  study attributes, variants and equipment optional on every variant, sales by year, the fifteen
  strongest findings. Every quote, metric and item carries its evidence reference. About 18 kB
  JSON / 2,500 tokens of Markdown per pack, built in about 0.25 s, so packs are rebuilt on demand
  instead of cached. `tracepoint agent packs` writes the ten packs with evidence (F70 EU/RoW,
  G60 EU/US/RoW, G68 CN, G70 EU/US/CN/RoW) to `data/context_packs/`; `start.sh` runs it.
* **Drill-down tools** (`tools.py`): `get_context_pack`, `search_evidence`,
  `get_verbatims_by_theme`, `get_metric`, `get_equipment`, `get_sales`, `get_findings`.
  Arguments are Pydantic models (vehicle and market codes are enumerations, limits bounded), so
  model output is validated before it reaches SQL. `tool_schemas()` returns provider-neutral
  name / description / JSON schema triples for the LLM gateway. `call_tool()` is the single entry
  point and writes one audit event (`tool.called`, actor, arguments, total, up to 50 evidence
  references) per call.
* **`search_evidence`** ranks verbatims with PostgreSQL full-text search over the existing GIN
  index (any word may match, length-normalised rank) after SQL filters on vehicle, market,
  powertrain, feedback type and domain. Embedding similarity can later be added inside the same
  function without changing its arguments.
* Access paths: Python (`call_tool`), CLI (`tracepoint agent tools | call | packs`), HTTP
  (`GET /agent/tools`, `POST /agent/tools/{name}`, 404 for unknown tools, 422 for bad arguments).

## 2. Verification

| Check | Result |
|---|---|
| Ten hand-written retrieval queries (plan acceptance) | all ten return five results with at least four relevant ones in the top five (test `test_search_evidence_top5_relevant`) |
| Context packs for all vehicles | ten packs in under three seconds in total (acceptance: under a minute) |
| Tool calls in the event log | every tool logged with actor and evidence references (test `test_every_tool_runs_and_is_logged`) |
| Bad arguments | rejected by validation (unknown vehicle code → `ValidationError` / HTTP 422) |
| Tests / lint | 38 passed; `ruff check` and `ruff format --check` clean |

## 3. Known limitations

* Relevance in the retrieval test is checked by key words in the text, not by human judgement.
* Lexical search misses paraphrases ("flap" vs "charge port door" only meet through shared
  words); this is what embeddings will add.
* The tools read; agents cannot write findings or requirements yet (Phase 3 / 4).

## 4. Phase 1 status after this step

Open: blind validation of the classifications (needs an API key), Source B segmentation,
embedding similarity, close-out report WP1.11.
