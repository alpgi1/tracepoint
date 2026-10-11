import { connection } from "next/server";
import { cache } from "react";
import { STATIC_EXPORT } from "@/lib/static";
import F70_EU from "@/content/workspace/F70_EU.json";
import G60_EU from "@/content/workspace/G60_EU.json";
import G60_US from "@/content/workspace/G60_US.json";
import G68_CN from "@/content/workspace/G68_CN.json";
import G70_CN from "@/content/workspace/G70_CN.json";
import G70_EU from "@/content/workspace/G70_EU.json";
import G70_US from "@/content/workspace/G70_US.json";
import type {
  AuditEvent,
  EffortScenario,
  ExcludedCandidate,
  Requirement,
  RequirementDetail,
  RequirementEffort,
  WorkspaceSnapshot,
} from "@/lib/content/workspace-types";

/*
 * Reads of the PM workspace (plan 08 section 6, D-079 and D-085). The
 * committed snapshots under content/workspace/ (the backend API's own
 * responses written by scripts/snapshot.mjs) are the base of
 * every read. In the live mode (the API answering at TRACEPOINT_API_URL,
 * unless TRACEPOINT_LIVE=0) a read replaces what changes with the API's current
 * answer: the requirement list with its gate statuses, the estimates, the
 * packages, the excluded candidates, the events, and on a requirement page
 * its detail. The evidence (verbatims, metrics, catalogue items, the
 * external statements) stays from the snapshot; it does not change between
 * decisions. The scope's events are one call since step 19 (the API's
 * entity_prefix filter). Server side only, imported by server components
 * and route handlers: the browser never receives a whole snapshot and never
 * calls the API.
 */
// The JSON's string fields are wider than the literal unions of the contract (status, horizon, basis); the test checks them.
const snapshots: Record<string, WorkspaceSnapshot> = Object.fromEntries(
  [F70_EU, G60_EU, G60_US, G68_CN, G70_CN, G70_EU, G70_US].map((raw) => {
    const snapshot = raw as unknown as WorkspaceSnapshot;
    return [`${snapshot.vehicle}_${snapshot.market}`, snapshot];
  }),
);

export function workspaceSnapshot(vehicle: string, market: string): WorkspaceSnapshot | undefined {
  return snapshots[`${vehicle.toUpperCase()}_${market.toUpperCase()}`];
}

export function workspaceScopes(): WorkspaceSnapshot[] {
  return Object.values(snapshots);
}

/** The scopes that carry a requirement set, for the empty state of the others. */
export function scopesWithRequirements(): { vehicle: string; market: string }[] {
  return workspaceScopes()
    .filter((s) => s.requirements.length > 0)
    .map((s) => ({ vehicle: s.vehicle, market: s.market }));
}

export const API_URL = (process.env.TRACEPOINT_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
const EVENT_LIMIT = 5000;
const TIMEOUT_MS = 4000;
const PROBE_TIMEOUT_MS = 1500;
const PROBE_TTL_MS = 5000;

/**
 * TRACEPOINT_LIVE (D-106): "1" always reads and writes live, "0" only shows
 * the stored data, and unset goes live whenever the API answers, so the
 * gate G2 controls work as soon as the backend runs.
 */
export type LiveSetting = "on" | "off" | "auto";

export function liveSetting(): LiveSetting {
  if (STATIC_EXPORT) return "off";
  const value = process.env.TRACEPOINT_LIVE;
  return value === "1" ? "on" : value === "0" ? "off" : "auto";
}

let probe: { at: number; up: Promise<boolean> } | null = null;

/**
 * Whether a request reads and writes live. In the automatic setting the
 * API's health check decides, asked at most once every few seconds, so a
 * backend started after the app is picked up on the next page and pages
 * without it stay as fast as the stored data. Request time only: callers
 * have awaited connection() or run in a server action.
 */
export async function liveEnabled(): Promise<boolean> {
  const setting = liveSetting();
  if (setting !== "auto") return setting === "on";
  const now = Date.now();
  if (!probe || now - probe.at > PROBE_TTL_MS) {
    const up = fetch(`${API_URL}/health`, { cache: "no-store", signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) }).then(
      (response) => response.ok,
      () => false,
    );
    probe = { at: now, up };
  }
  return probe.up;
}

/** What a read of the workspace returns: the data, and whether the API or the snapshot answered. */
export interface WorkspaceRead {
  snapshot: WorkspaceSnapshot;
  live: boolean;
  api: string;
  /** When the API was read, null for a snapshot read. */
  readAt: string | null;
  /** Why the live read fell back to the snapshot, null otherwise. */
  reason: string | null;
}

export interface LiveParts {
  requirements: Requirement[];
  efforts: RequirementEffort[];
  scenarios: EffortScenario[];
  scopeEvents: AuditEvent[];
  requirementEvents: AuditEvent[];
  detail?: RequirementDetail;
}

/** The snapshot with the API's current answers in place of what changes; pure, for the test. */
export function mergeLive(base: WorkspaceSnapshot, live: LiveParts): WorkspaceSnapshot {
  const prefix = `REQ-${base.vehicle}-${base.market}-`;
  const excluded: ExcludedCandidate[] = live.scopeEvents
    .filter((e) => e.action === "requirements.candidates_excluded")
    .flatMap((e) => (Array.isArray(e.after?.excluded) ? (e.after.excluded as ExcludedCandidate[]) : []));
  const events = live.requirementEvents.filter((e) => e.entity_id.startsWith(prefix)).sort((a, b) => a.id - b.id);
  const details = live.detail ? { ...base.details, [live.detail.id]: live.detail } : base.details;
  return { ...base, requirements: live.requirements, efforts: live.efforts, scenarios: live.scenarios, excluded, events, details };
}

async function get<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { accept: "application/json" }, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!response.ok) throw new Error(`${path}: HTTP ${String(response.status)}`);
  return (await response.json()) as T;
}

/**
 * The workspace of a scope: the snapshot, or in the live mode the snapshot
 * with the API's current answers. Always request-time (connection), so a
 * decision shows on the next request; undefined where no snapshot exists.
 */
export async function readWorkspace(vehicle: string, market: string, options: { detailOf?: string } = {}): Promise<WorkspaceRead | undefined> {
  if (!STATIC_EXPORT) await connection();
  const base = workspaceSnapshot(vehicle, market);
  if (!base) return undefined;
  if (!(await liveEnabled())) return { snapshot: base, live: false, api: API_URL, readAt: null, reason: null };
  const q = `vehicle=${base.vehicle}&market=${base.market}`;
  try {
    const [requirements, efforts, scenarios, scope, events] = await Promise.all([
      get<Requirement[]>(`/requirements?${q}`),
      get<RequirementEffort[]>(`/effort/requirements?${q}`),
      get<EffortScenario[]>(`/effort/scenarios?${q}`),
      get<{ items: AuditEvent[] }>(`/events?entity_type=scope&entity_id=${base.vehicle}:${base.market}`),
      get<{ items: AuditEvent[] }>(`/events?entity_type=requirement&entity_prefix=REQ-${base.vehicle}-${base.market}-&limit=${String(EVENT_LIMIT)}`),
    ]);
    const wanted = options.detailOf ? requirements.find((r) => r.id.toLowerCase() === options.detailOf?.toLowerCase()) : undefined;
    const detail = wanted ? await get<RequirementDetail>(`/requirements/${wanted.id}`) : undefined;
    return {
      snapshot: mergeLive(base, { requirements, efforts, scenarios, scopeEvents: scope.items, requirementEvents: events.items, detail }),
      live: true,
      api: API_URL,
      readAt: new Date().toISOString(),
      reason: null,
    };
  } catch (error) {
    return { snapshot: base, live: false, api: API_URL, readAt: null, reason: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * The workspace of a scope, read once per request (step 20): the scope
 * layout's stage figures and the page below it share the read when they
 * render together, on a direct visit or a refresh.
 */
export const readScope = cache((vehicle: string, market: string) => readWorkspace(vehicle, market));
