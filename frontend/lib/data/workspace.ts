import F70_EU from "@/content/workspace/F70_EU.json";
import G60_EU from "@/content/workspace/G60_EU.json";
import G60_US from "@/content/workspace/G60_US.json";
import G68_CN from "@/content/workspace/G68_CN.json";
import G70_CN from "@/content/workspace/G70_CN.json";
import G70_EU from "@/content/workspace/G70_EU.json";
import G70_US from "@/content/workspace/G70_US.json";
import type { WorkspaceSnapshot } from "@/lib/content/workspace-types";

/*
 * Reads of the PM workspace (plan 08 section 6, D-079). The committed
 * snapshots under content/workspace/ are the backend API's own responses,
 * written by scripts/snapshot-workspace.mjs; the pages read them here,
 * server side only. The browser never receives a whole snapshot and never
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
