/**
 * The frontend's data feed (step 19, D-101): every file under content/ that carries evidence is the
 * backend API's own response, written here unchanged, so the screens and the API cannot drift apart.
 *
 *   content/markets.json            GET /overview: markets, vehicles sold, verbatims, weakest domain
 *                                   and study scores (the map and the vehicle header)
 *   content/cpm.json                GET /effort/model and GET /cpm/{vehicle}?market= per pair: the
 *                                   twelve subsystems with customer rows, themes and market rows
 *   content/effort.json             GET /effort/model and GET /effort/backtest (the method sheet)
 *   content/analyses/index.json     GET /analyses: the stored analyst briefs and the pairs they cover
 *   content/analyses/<key>.json     GET /analyses/{key}/brief: one brief as the product manager reads it
 *   content/workspace/<V>_<M>.json  per pair: GET /requirements, /effort/requirements, /effort/scenarios,
 *                                   the excluded candidates (scope events), the requirement events
 *                                   (GET /events?entity_prefix=REQ-<V>-<M>-), the detail of every
 *                                   requirement with the evidence its findings cite (verbatims, study
 *                                   metrics, catalogue items), the external evidence of the market
 *                                   (GET /external) and the requirement list as the D2 exporter writes
 *                                   it (GET /requirements/export, CSV and Markdown)
 *
 * Every file carries when it was taken and from which API, and the workspace files the backend's code
 * version and the effort model hash, so every figure on screen can name its source and its vintage.
 * The demo runs from these files without the database; the live mode reads the same endpoints at
 * request time. Nothing is computed here.
 *
 *   pnpm snapshot                                   # everything, API at http://127.0.0.1:8000
 *   TRACEPOINT_API_URL=http://127.0.0.1:8000 node scripts/snapshot.mjs G60 US   # one workspace file
 *
 * Start the backend first: cd backend && uv run uvicorn tracepoint.api.app:app --port 8000
 */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const API = (process.env.TRACEPOINT_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const contentDir = join(root, "content");
const EVENT_LIMIT = 5000;
const takenAt = new Date().toISOString();

async function get(path, as = "json") {
  const response = await fetch(API + path, { headers: { accept: as === "json" ? "application/json" : "text/plain" } });
  if (!response.ok) throw new Error(`${path}: HTTP ${String(response.status)}`);
  return as === "json" ? response.json() : response.text();
}

function write(relative, payload) {
  const file = join(contentDir, relative);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, JSON.stringify(payload, null, 1) + "\n");
  return file;
}

/** "vclass:G60-0876#1" -> ["vclass", "G60-0876#1"]; the rest may hold colons of its own. */
function splitRef(ref) {
  const at = ref.indexOf(":");
  return [ref.slice(0, at), ref.slice(at + 1)];
}

const [onlyVehicle, onlyMarket] = process.argv.slice(2);
const runs = await get("/runs?limit=1");
const codeVersion = runs[0]?.code_version ?? null;
const overview = await get("/overview");
const pairs = overview.markets.flatMap((m) => m.vehicles.map((v) => ({ vehicle: v.code, market: m.code })));
const selected = onlyVehicle ? pairs.filter((p) => p.vehicle === onlyVehicle.toUpperCase() && (!onlyMarket || p.market === onlyMarket.toUpperCase())) : pairs;
if (selected.length === 0) {
  console.error(`no vehicle and market pair matches ${String(onlyVehicle)} ${String(onlyMarket ?? "")}`);
  process.exit(2);
}

if (!onlyVehicle) {
  console.log(`overview: ${String(pairs.length)} vehicle and market pairs -> ${write("markets.json", overview)}`);

  const model = await get("/effort/model");
  const views = {};
  for (const { vehicle, market } of pairs) views[`${vehicle}_${market}`] = await get(`/cpm/${vehicle}?market=${market}`);
  console.log(`cpm: model ${String(model.modelHash)}, ${String(Object.keys(views).length)} views -> ${write("cpm.json", { ...model, views })}`);

  const backtest = await get("/effort/backtest");
  const effortFile = write("effort.json", { snapshot: { takenAt, api: API, codeVersion, endpoints: { model: "/effort/model", backtest: "/effort/backtest" } }, model, backtest });
  console.log(`effort: back-test ${String(backtest.hits)} of ${String(backtest.anchors)} -> ${effortFile}`);

  const analyses = await get("/analyses");
  const analysesDir = join(contentDir, "analyses");
  rmSync(analysesDir, { recursive: true, force: true });
  for (const item of analyses) {
    const brief = await get(`/analyses/${item.key}/brief`);
    console.log(`analysis ${item.key} (${item.kind}, ${item.origin}) -> ${write(`analyses/${item.key}.json`, brief)}`);
  }
  write("analyses/index.json", { snapshot: { takenAt, api: API, codeVersion, endpoints: { index: "/analyses", brief: "/analyses/{key}/brief" } }, items: analyses });
  if (readdirSync(analysesDir).length !== analyses.length + 1) throw new Error("analyses: files and index differ");
}

// Study metrics are cited across vehicles and markets (peers, other markets): one list.
const allMetrics = await get("/studies");
const equipmentByVehicle = new Map();
async function equipmentOf(vehicle) {
  if (!equipmentByVehicle.has(vehicle)) equipmentByVehicle.set(vehicle, await get(`/equipment?vehicle=${vehicle}`));
  return equipmentByVehicle.get(vehicle);
}

for (const { vehicle, market } of selected) {
  const q = `vehicle=${vehicle}&market=${market}`;
  const prefix = `REQ-${vehicle}-${market}-`;
  const endpoints = {
    requirements: `/requirements?${q}`,
    efforts: `/effort/requirements?${q}`,
    scenarios: `/effort/scenarios?${q}`,
    excluded: `/events?entity_type=scope&entity_id=${vehicle}:${market}`,
    events: `/events?entity_type=requirement&entity_prefix=${prefix}&limit=${String(EVENT_LIMIT)}`,
    details: "/requirements/{id}",
    verbatims: "/verbatims/{id}",
    metrics: "/studies",
    equipment: "/equipment?vehicle={vehicle}",
    external: `/external?market=${market}&vehicle=${vehicle}`,
    exportCsv: `/requirements/export?${q}&format=csv`,
    exportMd: `/requirements/export?${q}&format=md`,
  };
  const [requirements, efforts, scenarios, scopeEvents, requirementEvents, external] = await Promise.all([
    get(endpoints.requirements),
    get(endpoints.efforts),
    get(endpoints.scenarios),
    get(endpoints.excluded),
    get(endpoints.events),
    get(endpoints.external),
  ]);
  if (requirementEvents.total > EVENT_LIMIT) throw new Error(`${vehicle} ${market}: more than ${String(EVENT_LIMIT)} requirement events; raise EVENT_LIMIT`);
  const events = [...requirementEvents.items].sort((a, b) => a.id - b.id);
  const excluded = scopeEvents.items.filter((e) => e.action === "requirements.candidates_excluded").flatMap((e) => e.after?.excluded ?? []);
  const modelHash = efforts.find((e) => e.model_hash)?.model_hash ?? null;
  const exports = requirements.length > 0 ? { csv: await get(endpoints.exportCsv, "text"), md: await get(endpoints.exportMd, "text") } : null;
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
    snapshot: { takenAt, api: API, codeVersion, modelHash, endpoints },
    requirements,
    efforts,
    scenarios,
    excluded,
    events,
    details,
    verbatims,
    metrics,
    equipment,
    external,
    exports,
  };
  const file = write(`workspace/${vehicle}_${market}.json`, payload);
  console.log(
    `${vehicle} ${market}: ${String(requirements.length)} requirements, ${String(efforts.length)} efforts, ${String(excluded.length)} excluded, ${String(events.length)} events, ${String(Object.keys(verbatims).length)} verbatims, ${String(Object.keys(metrics).length)} metrics, ${String(Object.keys(equipment).length)} equipment items, ${String(external.total)} external statements -> ${file}`,
  );
}
