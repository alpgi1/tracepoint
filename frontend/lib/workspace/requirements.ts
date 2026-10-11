import type { CpmSubsystemKey, CpmView } from "@/lib/content/cpm-types";
import { vehicleHref } from "@/lib/content/markets";
import type { MarketCode } from "@/lib/content/types";
import type {
  EffortDecision,
  EffortKind,
  EquipmentItem,
  EvidenceRow,
  Horizon,
  Requirement,
  RequirementDetail,
  RequirementEffort,
  StudyMetric,
  Verbatim,
  VerbatimClassification,
  WorkspaceSnapshot,
} from "@/lib/content/workspace-types";

/*
 * Stage 3, Requirements definition: routes, the resolution of evidence
 * references into the snapshot's verbatims, metrics and catalogue items,
 * and the bridges from the
 * vehicle screen (which requirements change a subsystem, which cite a
 * theme). Every function reads the snapshot; nothing is computed beyond
 * joins and shares.
 */
export function requirementsHref(market: MarketCode, vehicle: string): string {
  return `${vehicleHref(market, vehicle)}/requirements`;
}

/** Route segments are lower case: /markets/us/g60/requirements/req-g60-us-ic-01. */
export function requirementHref(market: MarketCode, vehicle: string, id: string): string {
  return `${requirementsHref(market, vehicle)}/${id.toLowerCase()}`;
}

export interface RequirementRecord {
  requirement: Requirement;
  detail: RequirementDetail;
  effort: RequirementEffort | null;
}

export function requirementBySlug(snapshot: WorkspaceSnapshot, slug: string): RequirementRecord | undefined {
  const requirement = snapshot.requirements.find((r) => r.id.toLowerCase() === slug.toLowerCase());
  const detail = requirement ? snapshot.details[requirement.id] : undefined;
  if (!requirement || !detail) return undefined;
  return { requirement, detail, effort: snapshot.efforts.find((e) => e.id === requirement.id) ?? null };
}

/** "vclass:G60-0876#1" -> ["vclass", "G60-0876#1"]; the rest may hold colons of its own. */
export function splitRef(ref: string): [string, string] {
  const at = ref.indexOf(":");
  return at < 0 ? [ref, ""] : [ref.slice(0, at), ref.slice(at + 1)];
}

export type EvidenceItem =
  | { kind: "verbatim"; row: EvidenceRow; verbatim: Verbatim; classification: VerbatimClassification | null }
  | { kind: "metric"; row: EvidenceRow; metric: StudyMetric }
  | { kind: "equipment"; row: EvidenceRow; item: EquipmentItem }
  | { kind: "aggregate"; row: EvidenceRow }
  | { kind: "finding"; row: EvidenceRow; findingId: string }
  | { kind: "unresolved"; row: EvidenceRow };

export function resolveEvidence(snapshot: WorkspaceSnapshot, row: EvidenceRow): EvidenceItem {
  const [kind, rest] = splitRef(row.evidence_ref);
  if (kind === "vclass" || kind === "verbatim") {
    const [verbatimId, classificationId] = rest.split("#");
    const verbatim = snapshot.verbatims[verbatimId];
    if (!verbatim) return { kind: "unresolved", row };
    const classification = classificationId ? (verbatim.classifications.find((c) => c.id === `${verbatimId}#${classificationId}`) ?? null) : null;
    return { kind: "verbatim", row, verbatim, classification };
  }
  if (kind === "metric") {
    const metric = snapshot.metrics[rest];
    return metric ? { kind: "metric", row, metric } : { kind: "unresolved", row };
  }
  if (kind === "equipment") {
    const item = snapshot.equipment[rest];
    return item ? { kind: "equipment", row, item } : { kind: "unresolved", row };
  }
  if (kind === "aggregate") return { kind: "aggregate", row };
  if (kind === "finding") return { kind: "finding", row, findingId: rest };
  return { kind: "unresolved", row };
}

const ROLE_ORDER = { primary: 0, supporting: 1, context: 2 };

/** The findings of a detail, primary first, then supporting, then context; ties by id. */
export function findingsByRole(detail: RequirementDetail): RequirementDetail["findings"] {
  return [...detail.findings].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role] || a.id.localeCompare(b.id));
}

/** One requirement on a bridge: what a CPM row or the dialog needs, nothing more (it travels to the browser). */
export interface RequirementLine {
  id: string;
  title: string;
  horizon: Horizon;
  effortPct: number;
  decision: EffortDecision;
  kind: EffortKind;
}

export interface SubsystemBridge {
  /** Requirements whose change profile starts in the subsystem, largest effort first. */
  starts: RequirementLine[];
  /** Requirements whose change propagates into the subsystem. */
  reaches: RequirementLine[];
  /** The requirements citing each of the subsystem's criticised themes (bridge 3), themes with none left out. */
  citing: { theme: string; requirements: { id: string; title: string }[] }[];
}

function lineOf(effort: RequirementEffort): RequirementLine {
  return { id: effort.id, title: effort.title, horizon: effort.horizon, effortPct: effort.effort_pct, decision: effort.decision, kind: effort.kind };
}

/** Bridges 1 to 3: per subsystem of the view, the requirements that change it and those on its criticised themes. */
export function bridgesFor(snapshot: WorkspaceSnapshot | undefined, view: CpmView): Partial<Record<CpmSubsystemKey, SubsystemBridge>> {
  const out: Partial<Record<CpmSubsystemKey, SubsystemBridge>> = {};
  const slot = (key: CpmSubsystemKey) => (out[key] ??= { starts: [], reaches: [], citing: [] });
  for (const effort of snapshot?.efforts ?? []) {
    const starts = new Set(effort.changes.map((c) => c.subsystem));
    for (const key of starts) slot(key).starts.push(lineOf(effort));
    for (const s of effort.subsystems) if (!starts.has(s.subsystem)) slot(s.subsystem).reaches.push(lineOf(effort));
  }
  const byEffort = (a: RequirementLine, b: RequirementLine) => b.effortPct - a.effortPct || a.id.localeCompare(b.id);
  for (const entry of Object.values(out)) {
    entry.starts.sort(byEffort);
    entry.reaches.sort(byEffort);
  }
  for (const subsystem of view.subsystems) {
    for (const theme of subsystem.criticised.themes) {
      const requirements = requirementsCitingTheme(snapshot, theme.theme).map((r) => ({ id: r.id, title: r.title }));
      if (requirements.length > 0) slot(subsystem.key).citing.push({ theme: theme.theme, requirements });
    }
  }
  return out;
}

/**
 * Bridge 3: the requirements citing a theme's customer-voice finding. The
 * backend titles such a finding "{theme}: {n} complaints ({kind})" or
 * "{theme}: {n} likes ({kind})" (findings/extract.py), so the theme name
 * followed by a colon identifies it; the title travels with the linked
 * findings of every requirement.
 */
export function requirementsCitingTheme(snapshot: WorkspaceSnapshot | undefined, theme: string): Requirement[] {
  if (!snapshot) return [];
  const prefix = `${theme}:`;
  return snapshot.requirements.filter((r) => r.findings.some((f) => f.title?.startsWith(prefix)));
}
