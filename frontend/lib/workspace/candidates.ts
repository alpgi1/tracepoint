import type { CpmSubsystemKey, CpmView } from "@/lib/content/cpm-types";
import type { EffortFlag, Requirement, RequirementEffort, WorkspaceSnapshot } from "@/lib/content/workspace-types";

/*
 * Stage 2, Structure & context: the candidates of a scope and the rules
 * that put one in front of the product manager (plan 08 section 4.1). Every
 * rule reads a field the backend already serves; nothing is scored here.
 * The rules are listed in site.ts beside the table so the PM can check
 * every entry against them.
 */
export interface Candidate {
  requirement: Requirement;
  /** Null where the backend has no estimate for the requirement. */
  effort: RequirementEffort | null;
  /** Where the change starts (the profile's subsystems) and where it propagates to. */
  starts: CpmSubsystemKey[];
  reaches: CpmSubsystemKey[];
  /** Why the candidate needs a decision; empty where none of the rules fires. */
  reasons: InboxReason[];
}

export type InboxRule = "not_recommended" | "evidence_c" | "criteria_assumed" | "effort_flag" | "market_contradiction" | "stale_effort";

export interface InboxReason {
  rule: InboxRule;
  /** The figure or the backend's own text behind the rule. */
  detail: string;
}

/** Effort flags that are a product decision: conflicts, warnings, and the horizon pull-forward note (rule 48). */
export function decisionFlags(flags: EffortFlag[]): EffortFlag[] {
  return flags.filter((f) => f.level === "conflict" || f.level === "warning" || f.rule === "48");
}

export function candidatesOf(snapshot: WorkspaceSnapshot, cpm: CpmView | undefined): Candidate[] {
  const efforts = new Map(snapshot.efforts.map((e) => [e.id, e]));
  return snapshot.requirements.map((requirement) => {
    const effort = efforts.get(requirement.id) ?? null;
    const starts = unique(effort?.changes.map((c) => c.subsystem) ?? []);
    const reaches = unique(effort?.subsystems.map((s) => s.subsystem) ?? []).filter((k) => !starts.includes(k));
    return { requirement, effort, starts, reaches, reasons: reasonsFor(requirement, effort, starts, reaches, cpm) };
  });
}

function reasonsFor(
  r: Requirement,
  effort: RequirementEffort | null,
  starts: CpmSubsystemKey[],
  reaches: CpmSubsystemKey[],
  cpm: CpmView | undefined,
): InboxReason[] {
  const out: InboxReason[] = [];
  if (!r.recommend) out.push({ rule: "not_recommended", detail: r.recommend_rationale });
  if (r.evidence_level === "C") out.push({ rule: "evidence_c", detail: `${String(r.findings.length)} linked findings` });
  const assumed = r.criteria.filter((c) => c.basis === "assumption").length;
  if (r.criteria.length > 0 && assumed === r.criteria.length) {
    out.push({ rule: "criteria_assumed", detail: `${String(assumed)} of ${String(r.criteria.length)} criteria` });
  }
  if (effort) {
    for (const f of decisionFlags(effort.flags)) out.push({ rule: "effort_flag", detail: `Rule ${f.rule}: ${f.text}` });
    if (effort.stale) {
      out.push({ rule: "stale_effort", detail: `estimated on version ${String(effort.requirement_version)}, requirement is at ${String(r.version)}` });
    }
  }
  if (cpm) {
    for (const key of [...starts, ...reaches]) {
      const view = cpm.subsystems.find((s) => s.key === key);
      for (const row of view?.market ?? []) {
        if (row.contradiction) out.push({ rule: "market_contradiction", detail: `${row.statement} (${row.source.title}, ${row.source.date})` });
      }
    }
  }
  return out;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export type CandidateView = "inbox" | "all" | "excluded";

export interface CandidateFilter {
  domain?: string;
  subsystem?: string;
  horizon?: string;
  status?: string;
}

export function filterCandidates(candidates: Candidate[], filter: CandidateFilter): Candidate[] {
  return candidates.filter(
    (c) =>
      (!filter.domain || c.requirement.domain === filter.domain) &&
      (!filter.subsystem || c.starts.includes(filter.subsystem as CpmSubsystemKey) || c.reaches.includes(filter.subsystem as CpmSubsystemKey)) &&
      (!filter.horizon || c.requirement.horizon === filter.horizon) &&
      (!filter.status || c.requirement.status === filter.status),
  );
}

/** The candidates of a view: the inbox is every proposed candidate with at least one reason. */
export function viewCandidates(candidates: Candidate[], view: CandidateView): Candidate[] {
  if (view === "inbox") return candidates.filter((c) => c.requirement.status === "proposed" && c.reasons.length > 0);
  return candidates;
}

/** Group by domain in the order of the given domain keys; domains without candidates are left out. */
export function groupByDomain<T extends { requirement: Requirement }>(items: T[], domainOrder: string[]): { domain: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const list = groups.get(item.requirement.domain) ?? [];
    list.push(item);
    groups.set(item.requirement.domain, list);
  }
  const ordered = [...domainOrder.filter((d) => groups.has(d)), ...[...groups.keys()].filter((d) => !domainOrder.includes(d))];
  return ordered.map((domain) => ({ domain, items: groups.get(domain) ?? [] }));
}

/** The figures of the stage bar, every one a count of rows the backend serves. */
export interface StageCounts {
  candidates: number;
  recommended: number;
  excluded: number;
  inbox: number;
  h1: number;
  h2: number;
  criteria: number;
  criteriaOnEvidence: number;
  decided: number;
  events: number;
  /** The requirement ids of the scope and those decided, for the showcase's decisions in the browser. */
  ids: string[];
  decidedIds: string[];
}

export function stageCounts(snapshot: WorkspaceSnapshot, candidates: Candidate[]): StageCounts {
  const { requirements } = snapshot;
  return {
    candidates: requirements.length,
    recommended: requirements.filter((r) => r.recommend).length,
    excluded: snapshot.excluded.length,
    inbox: viewCandidates(candidates, "inbox").length,
    h1: requirements.filter((r) => r.horizon === "H1").length,
    h2: requirements.filter((r) => r.horizon === "H2").length,
    criteria: requirements.reduce((n, r) => n + r.criteria.length, 0),
    criteriaOnEvidence: requirements.reduce((n, r) => n + r.criteria.filter((c) => c.basis === "evidence").length, 0),
    decided: requirements.filter((r) => r.status !== "proposed").length,
    events: snapshot.events.length,
    ids: requirements.map((r) => r.id),
    decidedIds: requirements.filter((r) => r.status !== "proposed").map((r) => r.id),
  };
}
