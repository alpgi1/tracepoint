import { readFileSync } from "node:fs";
import { join } from "node:path";
import { connection } from "next/server";
import { STATIC_EXPORT } from "@/lib/static";
import indexRaw from "@/content/analyses/index.json";
import type { AnalysesIndex, AnalysisSummary, Brief } from "@/lib/content/brief-types";
import { API_URL, liveEnabled } from "./workspace";

/*
 * The analyst briefs (step 19, D-100). The backend stores every analysis as
 * a file and serves it twice: GET /analyses lists them with the vehicle and
 * market pairs each speaks about, GET /analyses/{key}/brief gives one as the
 * product manager reads it. scripts/snapshot.mjs writes both under
 * content/analyses/; in the live mode a read asks the API first, so a new
 * run shows without a new snapshot, and falls back to the stored brief.
 * Server side only.
 */
const index = indexRaw as unknown as AnalysesIndex;
const TIMEOUT_MS = 4000;
const KEY = /^[A-Z]\d{2}_(?:[A-Z]{2}|RoW|regions)$/;

export function analysesIndex(): AnalysesIndex {
  return index;
}

function covers(item: AnalysisSummary, vehicle: string, market: string): boolean {
  return item.scopes.some((s) => s.vehicle === vehicle.toUpperCase() && s.market === market.toUpperCase());
}

/** The analyses that speak about a scope: its situation analysis (the market's own before a country's) and the series it belongs to. */
export function analysesFor(vehicle: string, market: string, items: AnalysisSummary[] = index.items): { situation: AnalysisSummary | null; series: AnalysisSummary | null } {
  const here = items.filter((i) => covers(i, vehicle, market));
  const situations = here.filter((i) => i.kind === "situation").sort((a, b) => Number(a.country !== null) - Number(b.country !== null));
  return { situation: situations[0] ?? null, series: here.find((i) => i.kind === "series") ?? null };
}

const stored = new Map<string, Brief>();

/** A brief as the snapshot stored it; only keys of the index are read. */
export function storedBrief(key: string): Brief | undefined {
  if (!KEY.test(key) || !index.items.some((i) => i.key === key)) return undefined;
  let brief = stored.get(key);
  if (!brief) {
    brief = JSON.parse(readFileSync(join(process.cwd(), "content", "analyses", `${key}.json`), "utf8")) as Brief;
    stored.set(key, brief);
  }
  return brief;
}

export interface BriefRead {
  brief: Brief;
  live: boolean;
  /** When the API was read, null for the stored brief. */
  readAt: string | null;
  /** Why the live read fell back to the stored brief, null otherwise. */
  reason: string | null;
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${path}: HTTP ${String(response.status)}`);
  return (await response.json()) as T;
}

/** The briefs of a scope at request time: the situation brief and the series brief, each read live in the live mode. */
export async function readBriefs(vehicle: string, market: string): Promise<{ situation: BriefRead | null; series: BriefRead | null }> {
  if (!STATIC_EXPORT) await connection();
  if (!(await liveEnabled())) {
    const found = analysesFor(vehicle, market);
    const fromStore = (item: AnalysisSummary | null): BriefRead | null => {
      const brief = item ? storedBrief(item.key) : undefined;
      return brief ? { brief, live: false, readAt: null, reason: null } : null;
    };
    return { situation: fromStore(found.situation), series: fromStore(found.series) };
  }
  try {
    const items = await get<AnalysisSummary[]>(`/analyses?vehicle=${vehicle.toUpperCase()}&market=${market.toUpperCase()}`);
    const found = analysesFor(vehicle, market, items);
    const readAt = new Date().toISOString();
    const live = async (item: AnalysisSummary | null): Promise<BriefRead | null> =>
      item && KEY.test(item.key) ? { brief: await get<Brief>(`/analyses/${item.key}/brief`), live: true, readAt, reason: null } : null;
    const [situation, series] = await Promise.all([live(found.situation), live(found.series)]);
    return { situation, series };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    const found = analysesFor(vehicle, market);
    const fromStore = (item: AnalysisSummary | null): BriefRead | null => {
      const brief = item ? storedBrief(item.key) : undefined;
      return brief ? { brief, live: false, readAt: null, reason } : null;
    };
    return { situation: fromStore(found.situation), series: fromStore(found.series) };
  }
}
