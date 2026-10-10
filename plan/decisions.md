# Decision log

Format: ID · date · decision · context / reason · consequences. Decisions are appended, never
rewritten; a superseding decision references the one it replaces.

| ID | Date | Decision | Context / reason | Consequences |
|---|---|---|---|---|
| D-001 | 2026-10-10 | English for all code, documentation, commits, UI and reports | Team rule | Chat with the team may be in Turkish; artefacts are English |
| D-002 | 2026-10-10 | Every step is filed as `reports/step-NN-<topic>.md` and delivered as a pull request to `main`; the team merges | Team rule ("strictly reported and filed", PR workflow) | Small, reviewable increments |
| D-003 | 2026-10-10 | `docs/` keeps the raw challenge inputs unchanged; derived data goes to `data/` (git-ignored) and `config/` | Keep inputs pristine and traceable | Parsers read from `docs/`, never modify it |
| D-004 | 2026-10-10 | The given VFC taxonomy (level 2 / level 3) is canonical and frozen; the LLM only fills unclassified rows, selecting from the canonical list first and proposing a new theme only if nothing fits; proposals need human approval | Team answer Q8 | Classification policy in the Phase 1 plan, section 8 |
| D-005 | 2026-10-10 | Stack: Python 3.12, FastAPI, SQLite via SQLAlchemy / SQLModel, official Anthropic Python SDK through one gateway module, local sentence-transformers embeddings with in-process cosine search, Typer CLI, React + TypeScript UI from Phase 6, pytest + ruff + GitHub Actions | Team asked for the optimum and relatively simple integration; analysis in the Phase 1 plan, section 3 | Pending team confirmation (Phase 1 plan, section 13) |
| D-006 | 2026-10-10 | Default model `claude-opus-5-5` for every LLM call, configured centrally; bulk jobs may be moved to a cheaper tier by team decision | Current default; cost estimate for Phase 1 below USD 100 | Model IDs live in settings, never in business code |
| D-007 | 2026-10-10 | External evidence is fetched by research sub-agents from team-selected sources and cached as snapshots in the database; the pitch runs from the cache; the whole internet is never crawled | Team answer Q5 | Phase 2 design; source registry with reliability and licence notes |
| D-008 | 2026-10-10 | Requirements carry a horizon: H1 near-term (within the current generation) and H2 long-term (successor generation, about 2030+) | Team answer Q3 | Horizon field, rationale and PM re-assignment per vehicle domain |
| D-009 | 2026-10-10 | Mandatory PM gates: G1 finding set, G2 each requirement before the backlog, G3 weight profile and priorities (changes re-run and compare), G4 release of the list | Team answer Q11 | Workflow in the master plan, section 5 |
| D-010 | 2026-10-10 | "Challenge" = PM disputes evidence or rationale; the AI performs a logged re-analysis or re-scoring and answers with evidence | Team answer Q12 | Challenge agent and events |
| D-011 | 2026-10-10 | Six evidence layers (Voice of Customer, Quantitative Metrics, Regional Demand & Context, Competition, Portfolio & Offering, Market Trends) each contribute visible, explained score components; portfolio-tier dampening is automatic but always visible to the PM | Team answers Q13, Q16 | Factor families in the master plan, section 6 |
| D-012 | 2026-10-10 | Eight vehicle domains as the unit of PM decision and deferral (Exterior & Design, Interior Comfort & Materials, Space & Practicality, Infotainment & Digital Services, Driver Assistance & Parking, Powertrain Range & Charging, Quality Perception & NVH, Variant & Package Offering) | Team answer Q10 (layer-by-layer decisions, e.g. colour now, engine next model) | Taxonomy level 2 → domain map; decisions per domain and horizon |
| D-013 | 2026-10-10 | Every requirement has measurable acceptance criteria, specified per region where expectations differ | Team answer Q15 | Region-specific criteria in the requirement model |
| D-014 | 2026-10-10 | One PM user; actors in the audit trail are `human:pm`, `agent:<name>`, `system`; no authentication beyond a named user in the prototype | Team answers Q10, Q19 | Audit model |
| D-015 | 2026-10-10 | Powertrain split of sales volumes is approximated by the engine-type mix of the feedback per market and flagged as an assumption until external data provides a split | Team answer Q21 ("you decide") | Assumption recorded on affected findings |
| D-016 | 2026-10-10 | China / G68 and competitor evidence are deferred to Phase 2 external sources | Team answers Q22, Q23 | No G68 verbatims in Phase 1 |
| D-017 | 2026-10-10 | Source weighting (A–D) is not applied initially; source is kept as metadata so that weighting can be introduced later | Team answer Q20 | `source_label` on verbatims |
| D-018 | 2026-10-10 | Demo derivative and market are decided after the project is complete; the pipeline is built configuration-driven for all three vehicles | Team answers Q2, Q4 | Phase 8 adaptability run |
