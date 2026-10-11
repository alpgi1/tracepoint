import type { CpmCatalogue, CpmView } from "@/lib/content/cpm-types";
import type { EffortScenario, EffortSubsystem, EvidenceLevel, Horizon, Requirement, RequirementEffort, WorkspaceSnapshot } from "@/lib/content/workspace-types";

/*
 * Stage 4, Prioritization: the points of the evidence and effort chart,
 * its two scales, the packages, the derived sentence about the H1 package,
 * and the package builder's chosen set. Every figure is a field of the
 * snapshot; the page adds no score.
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

/** The chart's rows, one group per horizon (H1 first), each in the table twin's order. */
export function horizonGroups(points: MatrixPoint[]): { horizon: Horizon; points: MatrixPoint[] }[] {
  return (["H1", "H2"] as const).map((horizon) => ({ horizon, points: byEvidence(points.filter((p) => p.horizon === horizon)) })).filter((g) => g.points.length > 0);
}

export interface LinearAxis {
  max: number;
  ticks: number[];
}

/** The complaint rows' scale: from 0 in steps of 25, or of 50 past 100 rows. */
export function rowsAxis(points: MatrixPoint[]): LinearAxis {
  const top = Math.max(0, ...points.map((p) => p.complaintRows));
  const step = top > 100 ? 50 : 25;
  const max = axisMax(top, step);
  return { max, ticks: Array.from({ length: max / step + 1 }, (_, i) => i * step) };
}

export interface LogAxis {
  min: number;
  max: number;
  /** The decades inside the axis. */
  ticks: number[];
}

/**
 * The effort scale is logarithmic: the single estimates of a scope span
 * three orders of magnitude (0.2 % to 49 % on G60 US), and on a linear
 * axis the one H2 change pushes every H1 change into the first few pixels.
 * It starts at a clean bound under the smallest P5 and ends at 100 %, a
 * whole new vehicle generation, or the decade past the largest P95.
 */
export function effortAxis(points: MatrixPoint[]): LogAxis {
  const changes = points.flatMap((p) => (p.effort && p.effort.kind === "change" ? [p.effort] : []));
  const low = Math.min(...changes.flatMap((e) => [e.p5, e.effort_pct]).filter((v) => v > 0));
  const min = [0.05, 0.01, 0.005, 0.001].find((c) => c <= low) ?? 0.001;
  const high = Math.max(100, ...changes.map((e) => e.p95));
  const max = 10 ** Math.ceil(Math.log10(high));
  const ticks: number[] = [];
  for (let k = Math.ceil(Math.log10(min)); k <= Math.log10(max); k++) ticks.push(Number((10 ** k).toPrecision(1)));
  return { min, max, ticks };
}

/** Where a value sits on a logarithmic axis, from 0 to 1; values outside the axis sit on its ends. */
export function logPosition(axis: LogAxis, value: number): number {
  const v = Math.min(axis.max, Math.max(axis.min, value));
  return (Math.log10(v) - Math.log10(axis.min)) / (Math.log10(axis.max) - Math.log10(axis.min));
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
