/**
 * Snapshot of the backend API for the PM workspace (UI step 14, plan 08 section 6).
 *
 * For every vehicle × market pair of content/markets.json the script calls the running
 * backend API once and writes its responses unchanged to content/workspace/<VEHICLE>_<MARKET>.json:
 * the requirement list (GET /requirements), the effort estimate per requirement
 * (GET /effort/requirements), the package variations (GET /effort/scenarios), the excluded
 * candidates (the scope event requirements.candidates_excluded), the requirement events
 * (GET /events, kept where the entity id belongs to the scope), and since step 15 the detail of
 * every requirement (GET /requirements/{id}: its findings with their evidence references) with
 * the evidence those references name: the verbatims (GET /verbatims/{id}), the study metrics
 * (GET /studies) and the catalogue items (GET /equipment). Since step 16 the script also
 * writes content/effort.json, one file for all scopes: the effort model as the API serves it
 * (GET /effort/model: the twelve subsystems with weights, links, parameters and per-vehicle
 * applicability) and the back-test against the documented BMW decisions (GET /effort/backtest),
 * read by the CPM method sheet. The file carries when it was
 * taken, which endpoints were called, the backend's code version of its latest run and the
 * effort model hash, so every figure on screen can name its source and its vintage.
 *
 * The demo runs from these files without the database; the live mode of the workspace reads
 * the same endpoints at request time. The content is the API's own output, not a copy of its
 * logic: nothing is computed here.
 *
 *   pnpm snapshot                                   # all pairs, API at http://127.0.0.1:8000
 *   TRACEPOINT_API_URL=http://127.0.0.1:8000 node scripts/snapshot-workspace.mjs G60 US
 *
 * Start the backend first: cd backend && uv run uvicorn tracepoint.api.app:app --port 8000
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const API = (process.env.TRACEPOINT_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const outDir = join(root, "content", "workspace");
const EVENT_LIMIT = 5000;

async function get(path) {
  const response = await fetch(API + path, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`${path}: HTTP ${String(response.status)}`);
  return response.json();
}

const markets = JSON.parse(readFileSync(join(root, "content", "markets.json"), "utf8"));
const pairs = markets.markets.flatMap((m) => m.vehicles.map((v) => ({ vehicle: v.code, market: m.code })));
const [onlyVehicle, onlyMarket] = process.argv.slice(2);
const selected = onlyVehicle ? pairs.filter((p) => p.vehicle === onlyVehicle.toUpperCase() && (!onlyMarket || p.market === onlyMarket.toUpperCase())) : pairs;
if (selected.length === 0) {
  console.error(`no vehicle and market pair matches ${String(onlyVehicle)} ${String(onlyMarket ?? "")}`);
  process.exit(2);
}

/** "vclass:G60-0876#1" -> ["vclass", "G60-0876#1"]; the rest may hold colons of its own. */
function splitRef(ref) {
  const at = ref.indexOf(":");
  return [ref.slice(0, at), ref.slice(at + 1)];
}

const runs = await get("/runs?limit=1");
// Study metrics are referenced across vehicles and markets (peers, other markets): one list.
const allMetrics = await get("/studies");
const equipmentByVehicle = new Map();
async function equipmentOf(vehicle) {
  if (!equipmentByVehicle.has(vehicle)) equipmentByVehicle.set(vehicle, await get(`/equipment?vehicle=${vehicle}`));
  return equipmentByVehicle.get(vehicle);
}
const codeVersion = runs[0]?.code_version ?? null;
// One call for every requirement event; the scope's share is picked by the entity id prefix.
const eventsPath = `/events?entity_type=requirement&limit=${String(EVENT_LIMIT)}`;
const allEvents = await get(eventsPath);
if (allEvents.total > EVENT_LIMIT) throw new Error(`more than ${String(EVENT_LIMIT)} requirement events; raise EVENT_LIMIT`);

mkdirSync(outDir, { recursive: true });
if (!onlyVehicle) {
  const model = await get("/effort/model");
  const backtest = await get("/effort/backtest");
  const file = join(root, "content", "effort.json");
  writeFileSync(file, JSON.stringify({ snapshot: { takenAt: new Date().toISOString(), api: API, codeVersion, endpoints: { model: "/effort/model", backtest: "/effort/backtest" } }, model, backtest }, null, 1) + "\n");
  console.log(`effort model ${String(model.modelHash)}, back-test ${String(backtest.hits)} of ${String(backtest.anchors)} -> ${file}`);
}
for (const { vehicle, market } of selected) {
  const q = `vehicle=${vehicle}&market=${market}`;
  const endpoints = {
    requirements: `/requirements?${q}`,
    efforts: `/effort/requirements?${q}`,
    scenarios: `/effort/scenarios?${q}`,
    excluded: `/events?entity_type=scope&entity_id=${vehicle}:${market}`,
    events: eventsPath,
    details: "/requirements/{id}",
    verbatims: "/verbatims/{id}",
    metrics: "/studies",
    equipment: "/equipment?vehicle={vehicle}",
  };
  const [requirements, efforts, scenarios, scopeEvents] = await Promise.all([
    get(endpoints.requirements),
    get(endpoints.efforts),
    get(endpoints.scenarios),
    get(endpoints.excluded),
  ]);
  const prefix = `REQ-${vehicle}-${market}-`;
  const events = allEvents.items.filter((e) => e.entity_id.startsWith(prefix)).sort((a, b) => a.id - b.id);
  const excluded = scopeEvents.items
    .filter((e) => e.action === "requirements.candidates_excluded")
    .flatMap((e) => e.after?.excluded ?? []);
  const modelHash = efforts.find((e) => e.model_hash)?.model_hash ?? null;
  // The detail of every requirement, and the evidence its findings reference, keyed by id.
  const details = {};
  const verbatimIds = new Set();
  const metricIds = new Set();
  const equipmentIds = new Set();
  for (const r of requirements) {
    const detail = await get(`/requirements/${r.id}`);
    details[r.id] = detail;
    for (const finding of detail.findings) {
      for (const row of finding.evidence) {
        const [kind, rest] = splitRef(row.evidence_ref);
        if (kind === "vclass" || kind === "verbatim") verbatimIds.add(rest.split("#")[0]);
        else if (kind === "metric") metricIds.add(rest);
        else if (kind === "equipment") equipmentIds.add(rest);
      }
    }
  }
  const verbatims = {};
  for (const id of [...verbatimIds].sort()) verbatims[id] = await get(`/verbatims/${id}`);
  const metrics = Object.fromEntries(allMetrics.filter((m) => metricIds.has(m.id)).map((m) => [m.id, m]));
  const missingMetrics = [...metricIds].filter((id) => !(id in metrics));
  if (missingMetrics.length > 0) throw new Error(`${vehicle} ${market}: metrics not served by GET /studies: ${missingMetrics.join(", ")}`);
  const equipment = {};
  for (const id of [...equipmentIds].sort()) {
    const item = (await equipmentOf(id.split("-")[1])).find((x) => x.id === id);
    if (!item) throw new Error(`${vehicle} ${market}: equipment ${id} not served by GET /equipment`);
    equipment[id] = item;
  }
  const payload = {
    vehicle,
    market,
    snapshot: { takenAt: new Date().toISOString(), api: API, codeVersion, modelHash, endpoints },
    requirements,
    efforts,
    scenarios,
    excluded,
    events,
    details,
    verbatims,
    metrics,
    equipment,
  };
  const file = join(outDir, `${vehicle}_${market}.json`);
  writeFileSync(file, JSON.stringify(payload, null, 1) + "\n");
  console.log(
    `${vehicle} ${market}: ${String(requirements.length)} requirements, ${String(efforts.length)} efforts, ${String(excluded.length)} excluded, ${String(events.length)} events, ${String(Object.keys(verbatims).length)} verbatims, ${String(Object.keys(metrics).length)} metrics, ${String(Object.keys(equipment).length)} equipment items -> ${file}`,
  );
}
