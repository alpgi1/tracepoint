import type { AuditEvent, Requirement, WorkspaceSnapshot } from "@/lib/content/workspace-types";

/*
 * Stage 5, Documentation: the decision record and the timeline of a scope
 * from its audit events, and the D2 list as CSV from the API's fields.
 * Nothing is computed beyond joins.
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

const COLUMNS = [
  "id",
  "vehicle",
  "market",
  "domain",
  "title",
  "statement",
  "recommend",
  "recommend_rationale",
  "horizon",
  "horizon_rationale",
  "markets",
  "criteria",
  "assumptions",
  "uncertainties",
  "evidence_level",
  "findings",
  "effort_pct",
  "effort_p5",
  "effort_p95",
  "effort_decision",
  "effort_layer",
  "effort_model_hash",
  "status",
  "version",
  "decision",
  "decided_by",
  "decided_at",
  "decision_note",
] as const;

function cell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The requirement list of a scope as CSV (deliverable D2): one row per requirement, the API's fields, the latest decision beside them. */
export function requirementsCsv(snapshot: WorkspaceSnapshot): string {
  const efforts = new Map(snapshot.efforts.map((e) => [e.id, e]));
  const latest = latestDecisions(snapshot);
  const lines = [COLUMNS.join(",")];
  for (const r of snapshot.requirements) {
    const e = efforts.get(r.id);
    const d = latest.get(r.id);
    const row: Record<(typeof COLUMNS)[number], unknown> = {
      id: r.id,
      vehicle: r.vehicle,
      market: r.market,
      domain: r.domain,
      title: r.title,
      statement: r.statement,
      recommend: r.recommend ? 1 : 0,
      recommend_rationale: r.recommend_rationale,
      horizon: r.horizon,
      horizon_rationale: r.horizon_rationale,
      markets: r.markets.join(" "),
      criteria: r.criteria.map((c) => `${c.market}: ${c.metric}; target ${c.target}; ${c.method}; ${c.basis}`).join(" | "),
      assumptions: r.assumptions.join(" | "),
      uncertainties: r.uncertainties.join(" | "),
      evidence_level: r.evidence_level,
      findings: r.findings.map((f) => `${f.id} (${f.role})`).join(" | "),
      effort_pct: e ? e.effort_pct : "",
      effort_p5: e ? e.p5 : "",
      effort_p95: e ? e.p95 : "",
      effort_decision: e ? e.decision : "",
      effort_layer: e ? e.layer : "",
      effort_model_hash: e ? e.model_hash : "",
      status: r.status,
      version: r.version,
      decision: d && typeof d.after?.status === "string" ? d.after.status : "",
      decided_by: d ? d.actor_id : "",
      decided_at: d ? d.ts : "",
      decision_note: d ? (d.rationale ?? "") : "",
    };
    lines.push(COLUMNS.map((c) => cell(row[c])).join(","));
  }
  return `${lines.join("\r\n")}\r\n`;
}
