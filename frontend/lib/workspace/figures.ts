import { cpmView } from "@/lib/content/cpm";
import { allVehicleParams } from "@/lib/content/markets";
import type { VehicleContent } from "@/lib/content/types";
import type { WorkspaceSnapshot } from "@/lib/content/workspace-types";
import { analysesFor } from "@/lib/data/analyses";
import { workspaceSnapshot } from "@/lib/data/workspace";
import { candidatesOf, stageCounts } from "./candidates";
import { type ScopeContent, type StageFigures, type StageKey, stageAvailable } from "./stages";

/** What the backend holds for a scope: the requirement set of the snapshot and the stored analyses that speak about it. */
export function scopeContent(vehicle: string, market: string, snapshot: WorkspaceSnapshot | undefined): ScopeContent {
  const { situation, series } = analysesFor(vehicle, market);
  return {
    requirements: snapshot !== undefined && snapshot.requirements.length > 0,
    brief: situation ? { key: situation.key, proposals: situation.items, country: situation.country } : null,
    series: series ? { key: series.key, topics: series.items, series: series.series ?? series.vehicle } : null,
  };
}

/** The stage bar's figures for a scope, from the CPM view and the workspace snapshot (server side). */
export function stageFigures(vehicle: VehicleContent, market: string, snapshot: WorkspaceSnapshot | undefined): StageFigures {
  const view = cpmView(vehicle.code, market);
  const scope = scopeContent(vehicle.code, market, snapshot);
  const counts = scope.requirements && snapshot ? stageCounts(snapshot, candidatesOf(snapshot, view)) : null;
  const h1 = scope.requirements ? snapshot?.scenarios.find((s) => s.scenario === "H1") : undefined;
  return {
    subsystems: view?.subsystems.length ?? 0,
    verbatims: vehicle.verbatims,
    counts,
    h1Package: h1 && h1.requirements > 0 ? { effortPct: h1.effort_pct, decision: h1.decision } : null,
    scope,
  };
}

/** Whether a stage exists for a scope; a page shell calls notFound otherwise (step 19). */
export function hasStage(stage: StageKey, vehicle: string, market: string): boolean {
  return stageAvailable(stage, scopeContent(vehicle.toUpperCase(), market.toUpperCase(), workspaceSnapshot(vehicle, market)));
}

/** The route params of the scopes where a stage exists, for generateStaticParams. */
export function stageParams(stage: StageKey): { market: string; vehicle: string }[] {
  return allVehicleParams().filter(({ market, vehicle }) => hasStage(stage, vehicle, market));
}
