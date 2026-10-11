import type { CpmCatalogue, CpmView } from "@/lib/content/cpm-types";
import type { EffortScenario, EffortSubsystem, EvidenceLevel, Horizon, Requirement, RequirementEffort, WorkspaceSnapshot } from "@/lib/content/workspace-types";

/*
 * Stage 4, Prioritization: the points of the matrix, the packages, the
 * derived sentence about the H1 package, and the package builder's chosen
 * set. Every figure is a field of the snapshot; the page adds no score.
 */
export interface MatrixPoint {
  id: string;
  title: string;
  horizon: Horizon;
  evidence: EvidenceLevel;
  /** Complaint rows of the primary finding(s); 0 where the primary finding carries none. */
  complaintRows: number;
  /** The kinds of the primary findings, to say why a point sits at 0. */
  primaryKinds: string[];
  effort: RequirementEffort | null;
}

/** Complaint rows of the primary findings, as the backend quantified them. */
export function complaintRowsOf(snapshot: WorkspaceSnapshot, requirement: Requirement): { rows: number; kinds: string[] } {
  const detail = snapshot.details[requirement.id];
  const primary = detail?.findings.filter((f) => f.role === "primary") ?? [];
  let rows = 0;
  for (const f of primary) {
    const value = f.quantification.complaints;
    if (typeof value === "number") rows += value;
  }
  return { rows, kinds: primary.map((f) => f.kind) };
}

export function matrixPoints(snapshot: WorkspaceSnapshot): MatrixPoint[] {
  const efforts = new Map(snapshot.efforts.map((e) => [e.id, e]));
  return snapshot.requirements.map((r) => {
    const { rows, kinds } = complaintRowsOf(snapshot, r);
    return { id: r.id, title: r.title, horizon: r.horizon, evidence: r.evidence_level, complaintRows: rows, primaryKinds: kinds, effort: efforts.get(r.id) ?? null };
  });
}

/** The table twin's order: most complaint rows first, then the larger effort, then the id. */
export function byEvidence(points: MatrixPoint[]): MatrixPoint[] {
  return [...points].sort((a, b) => b.complaintRows - a.complaintRows || (b.effort?.effort_pct ?? 0) - (a.effort?.effort_pct ?? 0) || a.id.localeCompare(b.id));
}

/** A clean upper bound for an axis: the next multiple of a step that covers the maximum. */
export function axisMax(max: number, step: number): number {
  return Math.max(step, Math.ceil(max / step) * step);
}

export interface PackageSubsystemRow {
  key: string;
  name: string;
  weight: number;
  risk: number;
  effortPct: number;
  path: string[] | null;
}

/** The subsystems of a package or an estimate with the vehicle's weights, as the footprint rows show them. */
export function packageRows(subsystems: EffortSubsystem[], catalogue: CpmCatalogue, view: CpmView): PackageSubsystemRow[] {
  return subsystems.map((s) => ({
    key: s.subsystem,
    name: s.name,
    weight: view.subsystems.find((v) => v.key === s.subsystem)?.weight ?? catalogue.subsystems.find((c) => c.key === s.subsystem)?.weight ?? 0,
    risk: s.risk,
    effortPct: s.effort_pct,
    path: s.path,
  }));
}

export interface H1Note {
  /** The class every H1 requirement has on its own, where they all share one; null otherwise. */
  singleClass: string | null;
  combined: EffortScenario;
  largest: RequirementEffort[];
  beyondAdapt: boolean;
}

/** The sentence about the H1 package: single estimates against the combined figure (step 12 of the backend). */
export function h1Note(snapshot: WorkspaceSnapshot): H1Note | null {
  const combined = snapshot.scenarios.find((s) => s.scenario === "H1");
  if (!combined || combined.requirements === 0) return null;
  const h1 = snapshot.efforts.filter((e) => e.horizon === "H1" && e.recommend && e.status !== "rejected" && e.kind === "change");
  const classes = new Set(h1.map((e) => e.decision));
  const largest = [...h1].sort((a, b) => b.effort_pct - a.effort_pct || a.id.localeCompare(b.id)).slice(0, 3);
  return { singleClass: classes.size === 1 ? [...classes][0] : null, combined, largest, beyondAdapt: combined.decision !== "adapt" };
}

/** The requirement ids a URL names for the package builder, in the scope's order, unknown ids dropped. */
export function chosenIds(snapshot: WorkspaceSnapshot, value: string | string[] | undefined): string[] {
  const wanted = new Set((Array.isArray(value) ? value : value ? [value] : []).map((v) => v.toUpperCase()));
  return snapshot.requirements.map((r) => r.id).filter((id) => wanted.has(id));
}

/** The ids of a preset: the recommended, not rejected requirements of a horizon, or all of them. */
export function presetIds(snapshot: WorkspaceSnapshot, preset: "H1" | "H2" | "ALL"): string[] {
  return snapshot.requirements.filter((r) => r.recommend && r.status !== "rejected" && (preset === "ALL" || r.horizon === preset)).map((r) => r.id);
}
