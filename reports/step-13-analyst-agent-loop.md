# Step 13 – Agent loop and the situation analyst

| Field | Value |
|---|---|
| Date | 2026-10-11 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – four live analyses (market, two countries, a study-only scope) with every reference verified; 49 tests passed |
| Why | The evidence store, the tools and the LLM gateway existed, but nothing connected them: no model had read a row of the data (`llm_call` was empty). The team wants to name a vehicle and a country and get an analysis from the stored evidence, without the UI |

## 1. Delivered

Decisions D-063, D-064 and D-065.

* **Tool calls in the LLM gateway** (`llm/gateway.py`). A request can carry the turns so far
  (`history`) and the tool definitions (`tools`) in a provider-neutral form; the answer is
  either tool calls or the final answer in the requested schema. `OpenAIProvider` translates to
  chat completions. Caching, call logging, the cost cap and the JSON repair work as before; the
  history and the tools are part of the cache key, and plain requests keep their hashes.
* **Agent loop** (`agent/loop.py`, `run_agent`). The model calls tools until it answers. Every
  call goes through `call_tool` (validated arguments, one audit event). An unknown tool or
  invalid arguments return to the model as an error. After `max_steps` turns (default 12) the
  tools are switched off and the model has to answer. Tool results above 20,000 characters are
  cut with a note.
* **Citation rule in the loop.** The loop collects every evidence reference and entity id of the
  context pack and of each tool result the model could read. References in the answer that are
  not in that set go back to the model once; what survives is reported, not removed.
* **Situation analyst** (`agent/analysis.py`, actor `agent:analyst`, prompt
  `situation-analysis-v1`, reasoning model). Input: vehicle plus market or country. Output:
  headline, summary, data coverage, insights (kind, domain, statement with numbers, quote,
  references, confidence), recommendations (horizon, existing requirement where one covers it)
  and assumptions. The prompt carries the scope boundaries of the brief and the data caveats of
  the decision log. Customer quotes are compared word for word with the verbatims the insight
  cites and go into the same correction request.
* **Read-only.** The analyst creates no finding and no requirement; its recommendations are
  proposals, so gates G1 and G2 are untouched.
* **Country scope** (D-065). `--country GB` narrows the customer verbatims; the context pack
  (`context-pack-v2`) and three tools take a country code. Study metrics, sales and findings
  stay per market, and the agent is told to say so.
* **Findings for all ten scopes.** `start.sh` / `start.ps1` now extract F70 RoW, G60 RoW, G70 RoW,
  G70 EU, G68 CN and G70 CN as well (110 findings, 763 in total).
* **Access.** `tracepoint agent analyze --vehicle G60 --market US` (or `--country KR`), options
  `--max-steps`, `--no-cache`, `--out-dir`; `POST /agent/analyze` with a JSON body. Output:
  Markdown and JSON in `data/analyses/`, an `analysis.created` audit event with the cited
  references, and the run with its model turns in `llm_call` and its tool calls in the event log.
* Smaller: `get_findings` returns `total`; the output limit of an agent turn is 8,000 tokens
  (the gateway default of 1,024 would cut an analysis).

## 2. Verification

Live runs with `gpt-5.4` (dated snapshot `gpt-5.4-2026-03-05`), samples of the first two under
`reports/analysis/`:

| Scope | Model turns | Tool calls | References cited | Not verified | Quotes not found | Insights / proposals | Cost (USD) |
|---|---|---|---|---|---|---|---|
| G60, market US | 2 | 15 | 45 | 0 | 0 | 8 / 6 (4 name an existing requirement) | 0.12 |
| F70, country GB | 3 | 24 | 69 | 0 | 0 | 9 / 6 (6) | 0.18 |
| G60, country KR | 3 | 22 | 31 | 0 | 0 | 7 / 6 (no requirements exist for RoW) | 0.11 |
| G68, market CN (study scores only) | 2 | 6 | 41 | 0 | 0 | 7 / 6 | 0.09 |

| Check | Result |
|---|---|
| Figures of the G60 US analysis against SQL | Drivetrain 349 likes and 64 complaints, operating concept 53 complaints (39 difficult to use), seats 62 complaints (33 difficult to use, 13 defects), electric range 67 (50), sales 75,600 / 78,000, study scores 4.879 and 4.804: all match |
| Correction turn | In an earlier run two quotes were real but came from verbatims the insight did not cite; after the correction request both runs returned 0 unverified quotes |
| Repeat run on unchanged data | 4 of 4 turns from the cache, USD 0.00 |
| API | `POST /agent/analyze` for G60 / KR: 200, served from the cache; a market that does not fit the country: 422 before any model call |
| Scope without evidence (F70 in the US) | refused before any model call |
| All model calls of this step, development included | 23 calls, 414 k input tokens (159 k of them cached by the provider), 40 k output tokens, USD 1.27 |
| Tests / lint | 49 passed (gateway tool calls and their cache, loop with bad calls and an invented reference, step limit, analysis for a country with an invented requirement id and an invented quote, API scope check); `ruff check` and `ruff format --check` clean |

## 3. Known limitations

* References and quotes are checked; the numbers inside a statement are not. The spot check above
  found no wrong figure, but nothing enforces it.
* A reference is accepted when the agent was given it, not when it supports the sentence it
  stands next to. That judgement stays with the product manager.
* The model's tool choices differ between runs on different inputs (2 to 4 turns, 6 to 24 calls).
  An identical request is repeatable through the cache only.
* Analyses are written in English (D-001).
* Country analyses rest on market-level findings, studies and sales. Only US, GB, JP and KR have
  more than a hundred verbatims for a vehicle; Germany has none.
* Requirements exist for G60 US, G70 US and F70 EU only, so proposals for other scopes cannot
  point to one.
* The `POST /agent/analyze` request stays open for the whole run (one to two minutes) and spends
  tokens without authentication, like every endpoint of the prototype (D-014).
* Passages of the BMW Group Report reach the provider through `search_documents` (see step 12:
  the PDF metadata carries a "CONFIDENTIAL" template marking; the team should confirm).

## 4. Addendum after the security review (D-066)

* The quote check passed any quote without ASCII letters or digits (punctuation only, or another
  script). It now compares letters of any script and counts an empty comparison as not found.
* Verbatims and report pages are third-party text. The loop now tells every agent that tool
  results are data and never instructions (prompt `situation-analysis-v2`; the samples under
  `reports/analysis/` were written with v1). This is a mitigation, not a guarantee; the tools
  only read, so a followed injection can change the text of an analysis and nothing else.
* `TRACEPOINT_LLM_MAX_COST_USD_PER_DAY` (default 50) caps all runs of the last 24 hours. The
  endpoint itself is still unauthenticated and has to stay on localhost.
* Second review (D-067): a model without a price is refused while a cost cap is set; billed
  answers the gateway rejects are logged with their cost; the endpoint runs one analysis at a
  time (HTTP 429 for a second request), since a run commits its costs only when it ends.
* 54 tests passed. One live analysis with v2 through the endpoint (G60, country KR): 2 model
  turns, 11 tool calls, 31 references, none unverified, USD 0.09. The other three scopes were not
  repeated with v2.

## 5. Next step

The same loop with other prompts and schemas: the challenge agent (D-010), and a requirement
agent for the scopes without a requirement file. Phase 5 (scoring and weights) is independent of
both.
