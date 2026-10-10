# Step 02 – Planning: team answers, master plan and Phase 1 plan

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – plans delivered for team review; Phase 1 implementation starts after review and after the inputs in the Phase 1 plan (section 13) are provided |
| Outputs | `plan/00-master-plan.md`, `plan/01-phase-1-foundation-and-internal-evidence-base.md`, `plan/decisions.md`, this report |

---

## 1. What was done

1. The 23 open questions of step 01 were answered by the team (summary in section 2).
2. The answers were turned into recorded decisions (`plan/decisions.md`, D-001 … D-018).
3. A master plan with the vision, principles, vocabulary, target architecture, evidence layers,
   sub-agent roster, end-to-end workflow with mandatory gates, prioritisation concept, eight
   phases, deliverable traceability and conventions was written.
4. A detailed Phase 1 plan was written: objective, scope, technical analysis with stack decision,
   LLM usage and cost estimate, repository layout, data model, eleven work packages with
   acceptance criteria, sequencing and parallel tracks, classification policy, testing strategy,
   definition of done, risks, reporting plan and the inputs needed from the team.
5. Current model identifiers and prices were checked against the current API reference before
   the cost estimate was written.

No code was written in this step.

## 2. Team answers (summary, translated to English)

| # | Topic | Answer |
|---|---|---|
| 1 | Time and people | Enough of both; do not keep the scope small |
| 2 | Demo derivative / market | Not important now; decided after the project is complete |
| 3 | Time horizon | Near-term and long-term must be handled separately |
| 4 | Demo format | Live demo later; focus is the project, not the demo |
| 5 | Technology and data | Choose the optimum and relatively simple integration; give the agent the data in the most useful form (vectorisation may be considered; do a technical analysis). External data: research sub-agents fetch from the internet, the fetched data is stored in the database and the pitch runs from that cache; the team will provide different statistics and sources from different countries (competitor products' statistics and customer satisfaction, but also global trends and other metrics) |
| 6 | Depth focus | Technical details later; see answer 5 |
| 7 | BMW data vs external | BMW data alone is not reliable enough; strength comes from ingesting and combining BMW data, customer data, comparable competitor products' customer data and more, to find the optimum for BMW PMs: keep the status quo, several R&D options, or even a cosmetic change such as a colour |
| 8 | Taxonomy | Use the VFC taxonomy as the canonical theme structure without changes; the LLM only fills unclassified rows: pick from the existing list first, propose a fitting theme only if nothing matches |
| 9 | Language | English |
| 10 | Users and agents | One PM. Sub-agents fetch information, connect it, compare competitors with customer feedback, decide per region, compute variations arriving via different paths, possibly rough price and engineering effort, and assess "new car with these changes vs R&D on the existing car". Cars have layers; decisions are taken layer by layer (e.g. approve the cosmetic layer now, move the engine topic to the next model) |
| 11 | Gates | The proposed gates (a–d) are accepted |
| 12 | Challenge | The proposed semantics are accepted |
| 13 | Prioritisation | Weights adjustable. The AI first weights by data, market and metrics; if undecided it tries variations (new car vs R&D on existing) with estimates and derives weights. Global trends and region-specific expectations matter a lot (e.g. Nordic markets: heating matters more than air conditioning). The PM can change the output and the weights; the stored data is re-processed with the new weights and compared with the previous report; pros, cons and suggestions are discussed |
| 14 | Sources | The team will define the sources (car magazines, trend tracking, a Chinese competitor's comparable car, …); not important now |
| 15 | Acceptance criteria | Absolutely required, and region-specific (e.g. rear-seat screens are expected in China) |
| 16 | Flow | Not a single flow but layers: user comments, metrics, region-based demands, competitors and their metrics, vehicle portfolio. A frequent wish that does not fit the portfolio tier of the series is dampened automatically, and the reason must be visible to the PM |
| 17 | Conventions | As proposed; pull requests to `main`, the team merges |
| 18 | Output formats | No preference |
| 19 | Audit depth | Event log and export are sufficient |
| 20 | Source weighting | Not important |
| 21 | Powertrain split | Decided by the assistant (feedback mix as proxy, flagged) |
| 22 | Additional data | BMW metrics are as given; external data will be added later |
| 23 | China / competitors | Later, from external sources |

Instruction for this step: create a comprehensive plan with phases; the first phase is the focus
because later phases will bring new ideas, decisions and sources; a general framework is still
needed.

## 3. Decisions taken in this step

D-001 … D-018 in `plan/decisions.md`. The most consequential: canonical VFC taxonomy (D-004),
the technical stack (D-005, pending confirmation), cached external evidence (D-007), horizons
(D-008), gates (D-009), layered evidence with visible dampening (D-011), vehicle domains (D-012).

## 4. Open items for the team

See the Phase 1 plan, section 13: API access and budget confirmation, stack confirmation,
permission to download an embedding model (or a hosted alternative), confirmation that `docs/`
stays read-only, and who joins which implementation track.

## 5. Next step

Step 03: Phase 1 work packages WP1.1–WP1.3 (repository skeleton, data model and run registry,
audit event log core), delivered as a pull request with its own report.
