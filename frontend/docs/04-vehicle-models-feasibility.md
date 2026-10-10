# Vehicle models in the magnified state: feasibility analysis

| Field | Value |
|---|---|
| Date | 2026-10-10 |
| Question from the team | After a market is magnified, show the three vehicles (1 Series F70, 5 Series G60, 7 Series G70) as 3D models; clicking one enlarges it and leads to the engineering screen where decisions are made. Can this be done well? |
| Short answer | Technically yes, with a known stack and a known budget. The open risk is not code, it is the models: no accurate current-generation BMW model with a clean licence is publicly available. The recommendation below removes that dependency and keeps the door open for official models |
| Status | Analysis; no code written for it yet. The team decides on the route in section 7 |

---

## 1. What the flow would be

1. The map is magnified on a market (built).
2. Three vehicles appear over the market in a row, in the page's language: white, grey, one blue.
   A name shows only on hover (the landing page stays text-free until the user asks).
3. Clicking a vehicle moves it to the centre and enlarges it while the map recedes.
4. From the enlarged vehicle the user goes to the engineering screen of that vehicle and market
   (route change, the vehicle carried across as the shared element). That screen is Phase 6 work
   and not designed yet.

Every step is interaction-bound: nothing rotates or floats on its own (forbidden list, section
4). A slight parallax of the vehicle following the pointer is the only idle response and stops
with reduced motion.

## 2. Technology: known and proven in this team

| Piece | Choice | Evidence |
|---|---|---|
| Renderer | three.js 0.186 with React Three Fiber 9 and drei 10 | The portfolio ships a 3D hero on the same versions (procedural phone, screen textures, idle and pointer motion, gated behind WebGL2 and a fine pointer, 2D poster underneath). Pattern and code reusable |
| Model format | glTF binary (GLB), geometry compressed with meshopt (gltfpack) or Draco | Standard; loaders ship with three. Draco and meshopt are alternatives, not both |
| Loading | Dynamic import of the 3D stage on the first magnification, never on first paint; the map stays the LCP element | Same gate the portfolio uses: `load` then idle, WebGL2 present, fine pointer, width at least 1024 px, no `saveData`, motion allowed |
| Fallback | A pre-rendered PNG or WebP per vehicle and view, produced from the same models at build time | Appears when the gate fails; also the screenshot path in CI |
| Budget | three core plus fiber about 180 to 240 KB gzipped, loaded once; each vehicle at most 600 KB; 60 fps on a desktop GPU | Portfolio measured 243 KB for its 3D bundle; REGU's budget rule carries over |
| Verification | Headless Chromium here renders WebGL through SwiftShader: slow but correct, so screenshots and audits still run | Both sister projects measured 3D scenes this way; Lighthouse numbers for WebGL pages are inflated here and must be read on a real device |

Risk in the technology: low. The one caveat is that a 3D scene on a white page needs deliberate
lighting; the default three.js look (grey plastic under a point light) is a tell.

## 3. The real question: where do the models come from

| Source | What was found | Fit |
|---|---|---|
| BMW, through the hackathon | Not asked yet. BMW does not publish 3D data; its own configurator uses pre-rendered images. The press site has photos and design sketches of the G70 facelift, not models | Best quality and the only clean licence. Ask the organisers for low-polygon exteriors or, failing that, official renders. A question, not a dependency |
| Marketplaces (RenderHub, TurboSquid, CGTrader) | A G60 model exists on RenderHub under an extended licence marked "editorial use only, IP restricted"; prices are typically tens to a few hundred euros; polygon counts far above a web budget | Usable for an internal prototype shown to BMW only if the organisers accept the licence; needs decimation to about 50 to 100 thousand triangles and a new material |
| Sketchfab under Creative Commons | No current F70, G60 or G70 found. CC-BY models exist for other BMWs (M2 G87, M4 F82, M8, E39 5 Series) | Wrong generations; would misrepresent the derivatives the data is about |
| Generated models (image-to-3D services) | Possible from press photos | Quality is blobby at detail level; IP standing unclear; fails the "premium" bar |
| Stylised vehicles built in-house | Three body types (hatchback, sedan, long sedan) scaled to the real dimensions (F70 length 4,361 mm, wheelbase 2,670 mm; G60 and G70 from the catalogues) and rendered as a point cloud or line drawing, not a shaded surface | No licence or brand-fidelity problem; consistent with the dotted map; honest about being schematic. Does not show the real cars |

Trademark note: the shapes of the cars are BMW's design. Inside BMW's own hackathon, for BMW, this
is not a problem, but a third-party model's "editorial use" clause should be confirmed with the
organisers in writing before it ships.

## 4. Rendering style: this decides whether it looks premium or generic

Three options, in order of risk:

1. **Point-cloud vehicles ("the car in the map's dots").** Sample the surface of each model into
   60 to 120 thousand points, render them as small round sprites in the map's grey, with the
   silhouette edges in the blue. The vehicle reads as a technical drawing made of the same
   halftone as the land. Hides model imperfections, needs no textures, no environment map, no
   shadows; weight about 400 to 700 KB per car with 16-bit positions. This is the style the
   research points to (Tensordyne, Oxide, Sharplink: technical overlays, not showroom renders).
2. **Clay render.** A single matte white material, blue rim light, soft contact shadow, fixed
   camera. Clean, but any marketplace model's seams and interior holes show, and it drifts
   towards the generic 3D-product look the forbidden list warns about.
3. **Showroom render** (paint, reflections, studio HDRI). The most expensive, the most generic,
   and the furthest from the page. Not recommended.

Recommendation: option 1, with option 2 as the enlarged state if the team wants more body.

## 5. Alternatives to live 3D, for comparison

| Alternative | Pros | Cons |
|---|---|---|
| Pre-rendered turntables (36 to 72 WebP frames per car from Blender, scrubbed by the pointer) | No WebGL, no runtime budget, identical look everywhere, the Apple approach | No free camera, 1 to 2 MB per car, still needs the models |
| Static profile drawings (SVG line art, side and front views) | Lightest, cleanest with the map, easy to label | No depth; a traced drawing from a press photo is a legal grey zone |
| Official press photography | Real cars, immediately credible | Licence for editorial use only; photographs clash with the map's language; the page would become a brochure |

## 6. Effort and sequence

| Step | Content | Size |
|---|---|---|
| A | Decide the source (section 7) and ask BMW for models or renders | one message |
| B | 3D stage behind the gate: dynamic import, camera, three placeholder bodies at real dimensions, hover name, click to enlarge, Escape back, reduced-motion and fallback image; measured in the headless browser | one step, about one day |
| C | Model pipeline: GLB in, decimate, sample to points, quantise, compress (`gltf-transform`); fallback renders at build | half a day per vehicle once a model exists |
| D | Transition to the engineering screen (shared element, route change) | with Phase 6 |

Step B does not wait for the models: the placeholder bodies are replaced by a file swap.

## 7. Decision for the team

1. Ask the hackathon organisers whether BMW can provide low-polygon exteriors of F70, G60 and
   G70, or official renders. If yes, route 1 with real geometry.
2. If no, choose between a licensed marketplace model (editorial clause confirmed in writing) and
   the stylised in-house vehicles. My recommendation is the stylised point-cloud vehicles: they
   are honest, consistent with the page, carry no licence risk, and the pipeline is identical, so
   real geometry can replace them later without changing the interaction.
3. Confirm the rendering style (point cloud, clay, or both) and whether the vehicle name may
   appear on hover.

With a yes on any route, the next step is B above.

Sources checked on 2026-10-10: RenderHub listing of a BMW 5 Series G60 model (extended licence,
editorial use only); Sketchfab search results for BMW models under CC Attribution (M2 G87, M4
F82, M8 Competition, E39 5 Touring); the BMW Group press site for G70 facelift material; three.js
forum threads on Draco and meshopt compression and on large point clouds; the BMW 1 Series (F70)
dimensions on Wikipedia.
