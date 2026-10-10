# Step 06 (UI track) – Solid market layers and the vehicle-model feasibility analysis

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Author | Claude (AI assistant), on request of the team |
| Status | Done – markets reworked and measured; the 3D question is analysed and waits for the team's route decision |
| Track | Frontend, in parallel with the backend track; no backend files touched |

## 1. What was done

* **Markets as solid layers.** The three markets no longer carry dots. Each is a light blue fill
  (`#dce7f8`) under a thicker, darker blue outline (`#1c69d4`, 1.6 px, growing with
  magnification so it keeps its weight when zoomed). The fill separates from the white page and
  from the grey dotted countries; the outline is darker than the fill. Hover and selection
  cross-fade to a deeper fill (`#b9cff2`) and a darker outline (`#0f4fae`). Plain land keeps the
  dot grid. Decision D-043.
* **Vehicle models.** `frontend/docs/04-vehicle-models-feasibility.md` answers whether the
  three vehicles can appear as 3D models in the magnified state: the technology is proven in the
  team's own portfolio (three.js, React Three Fiber, gated load, 2D fallback, measured in the
  headless browser); the open risk is the models themselves, since no accurate current-generation
  BMW model with a clean licence was found publicly (a G60 exists on a marketplace under an
  editorial-use clause; Creative Commons models exist only for other BMWs). The recommended route
  is to ask BMW for geometry or renders, and in parallel build the stage with stylised
  point-cloud vehicles at real dimensions that real geometry can replace by a file swap.

## 2. What was verified

| Check | Result |
|---|---|
| `pnpm tsc --noEmit`, `pnpm lint`, `pnpm build` | Clean |
| `pnpm audit:pages` on `/` | 0 findings, 3 keyboard stops |
| Screenshots (`frontend/docs/screenshots/`) | Resting 1440 and 1920, hover EU, magnified EU, CN and US, keyboard focus on US |
| Forbidden-list checklist | Passed; still no visible text on the page |

## 3. Open for the team

1. The route for the vehicle models (feasibility document, section 7).
2. Whether the vehicle name may appear on hover in the magnified state.
3. Fill and outline tones are tokens; adjust if the blue should be lighter or darker.
