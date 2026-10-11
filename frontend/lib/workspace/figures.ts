import { cpmView } from "@/lib/content/cpm";
import type { VehicleContent } from "@/lib/content/types";
import type { WorkspaceSnapshot } from "@/lib/content/workspace-types";
import { candidatesOf, stageCounts } from "./candidates";
import type { StageFigures } from "./stages";

/** The stage bar's figures for a scope, from the CPM view and the workspace snapshot (server side). */
export function stageFigures(vehicle: VehicleContent, market: string, snapshot: WorkspaceSnapshot | undefined): StageFigures {
  const view = cpmView(vehicle.code, market);
  const hasSet = snapshot !== undefined && snapshot.requirements.length > 0;
  const counts = hasSet ? stageCounts(snapshot, candidatesOf(snapshot, view)) : null;
  const h1 = hasSet ? snapshot.scenarios.find((s) => s.scenario === "H1") : undefined;
  return {
    subsystems: view?.subsystems.length ?? 0,
    verbatims: vehicle.verbatims,
    counts,
    h1Package: h1 && h1.requirements > 0 ? { effortPct: h1.effort_pct, decision: h1.decision } : null,
  };
}
