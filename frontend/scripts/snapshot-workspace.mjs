/**
 * Snapshot of the backend API for the PM workspace (UI step 14, plan 08 section 6).
 *
 * For every vehicle × market pair of content/markets.json the script calls the running
 * backend API once and writes its responses unchanged to content/workspace/<VEHICLE>_<MARKET>.json:
 * the requirement list (GET /requirements), the effort estimate per requirement
 * (GET /effort/requirements), the package variations (GET /effort/scenarios), the excluded
 * candidates (the scope event requirements.candidates_excluded) and the requirement events
 * (GET /events, kept where the entity id belongs to the scope). The file carries when it was
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

const runs = await get("/runs?limit=1");
const codeVersion = runs[0]?.code_version ?? null;
// One call for every requirement event; the scope's share is picked by the entity id prefix.
const eventsPath = `/events?entity_type=requirement&limit=${String(EVENT_LIMIT)}`;
const allEvents = await get(eventsPath);
if (allEvents.total > EVENT_LIMIT) throw new Error(`more than ${String(EVENT_LIMIT)} requirement events; raise EVENT_LIMIT`);

mkdirSync(outDir, { recursive: true });
for (const { vehicle, market } of selected) {
  const q = `vehicle=${vehicle}&market=${market}`;
  const endpoints = {
    requirements: `/requirements?${q}`,
    efforts: `/effort/requirements?${q}`,
    scenarios: `/effort/scenarios?${q}`,
    excluded: `/events?entity_type=scope&entity_id=${vehicle}:${market}`,
    events: eventsPath,
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
  const payload = {
    vehicle,
    market,
    snapshot: { takenAt: new Date().toISOString(), api: API, codeVersion, modelHash, endpoints },
    requirements,
    efforts,
    scenarios,
    excluded,
    events,
  };
  const file = join(outDir, `${vehicle}_${market}.json`);
  writeFileSync(file, JSON.stringify(payload, null, 1) + "\n");
  console.log(`${vehicle} ${market}: ${String(requirements.length)} requirements, ${String(efforts.length)} efforts, ${String(excluded.length)} excluded, ${String(events.length)} events -> ${file}`);
}
