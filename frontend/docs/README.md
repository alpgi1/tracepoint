# Frontend documentation

The web UI of Tracepoint lives in `frontend/` (Next.js, see `frontend/README.md` for how to run
it). These documents are the memory of the frontend track; read them before touching the UI.

| File | What it is |
|---|---|
| `01-research-notes.md` | What the three sister projects (Mentor-Website, portfolio, REGU) and about 100 reference sites teach, the process rules we adopt from them, the globe and map references in detail, the 21st.dev verdicts, and a list of ideas beyond the first brief |
| `02-forbidden-list.md` | The anti-slop list adapted for Tracepoint: honesty, text, visual, motion, code and process rules, written exemptions, and the pre-delivery checklist |
| `03-landing-map.md` | Specification of the landing page as built: the dotted world map, the market readouts, data pipeline, mask, zoom and focus, the market panel with the vehicle cards, interaction states and timings, accessibility, tokens, how to tune it |
| `04-vehicle-models-feasibility.md` | Whether and how the three vehicles can appear as 3D models in the magnified state: technology, model sources and licences, rendering style, alternatives, effort. The team chose drawings instead (step 07) |
| `05-vehicle-drawings.md` | The vehicle drawings as built: sources, the annotation-stripping and silhouette pipeline, dots and lines rendering, the vehicle screen with the car as domain selector, the zones, honesty notes, how to regenerate |
| `06-cpm-subsystems.md` | The CPM subsystem list and the subsystem dialog as built (step 13): the twelve subsystems with their weights, the theme mapping, the market evidence file, the pipeline, the dialog's anatomy and states, the backend contract, verification |
| `07-workspace.md` | The scope workspace as built (steps 14 to 17 and 19): the five-stage bar, the data feed from the backend API and the live mode, stage 2 Structure & context (the analyst's brief, views, filters, the candidate table), stage 3 (the requirement page, the bridges), stage 4 (the matrix, the packages, the builder, the method sheet), gate G2 and stage 5 (the decision record, the backend's exports, the audit trail), the series across its regions, the market evidence, which stages exist per scope, the inbox rules, verification |
| `screenshots/` | Captures of the delivered states, taken by `tools/audit/screenshots.mjs` |
| `research/` | Raw working notes from the research pass, per source, kept verbatim. They are in Turkish (the language the review was run in) and are source material, not specification; the English documents above are the ones that bind |

Conventions: English for everything that binds (plan decision D-001); dates in ISO form;
decisions go to `plan/decisions.md` with a D-code; every step is reported under `reports/`.
