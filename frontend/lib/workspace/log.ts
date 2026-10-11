import type { AuditEvent, Requirement, WorkspaceSnapshot } from "@/lib/content/workspace-types";

/*
 * Stage 5, Documentation: the decision record and the timeline of a scope
 * from its audit events. Nothing is computed beyond joins; the D2 list is
 * the backend's exporter's (lib/data/exports.ts, step 19).
 */
export const DECIDED = "requirement.decided";

/** The latest decision event per requirement; requirements without one are absent. */
export function latestDecisions(snapshot: WorkspaceSnapshot): Map<string, AuditEvent> {
  const out = new Map<string, AuditEvent>();
  for (const e of snapshot.events) {
    if (e.action !== DECIDED) continue;
    const seen = out.get(e.entity_id);
    if (!seen || e.id > seen.id) out.set(e.entity_id, e);
  }
  return out;
}

/** The scope's events newest first. */
export function timelineOf(snapshot: WorkspaceSnapshot): AuditEvent[] {
  return [...snapshot.events].sort((a, b) => b.id - a.id);
}

export interface DecisionRow {
  requirement: Requirement;
  decision: AuditEvent | null;
}

export function decisionRecord(snapshot: WorkspaceSnapshot): DecisionRow[] {
  const latest = latestDecisions(snapshot);
  return snapshot.requirements.map((requirement) => ({ requirement, decision: latest.get(requirement.id) ?? null }));
}
