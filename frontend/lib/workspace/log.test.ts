import { describe, expect, it } from "vitest";
import type { AuditEvent, WorkspaceSnapshot } from "@/lib/content/workspace-types";
import { workspaceSnapshot } from "@/lib/data/workspace";
import { decisionRecord, latestDecisions, requirementsCsv, timelineOf } from "./log";

/*
 * Stage 5 helpers on the G60 US snapshot with decision events added: the
 * latest decision per requirement, the timeline order, and the CSV of the
 * D2 list (one row per requirement, the API's fields, the cell quoting).
 */
const base = workspaceSnapshot("G60", "US");
if (!base) throw new Error("no snapshot");

function decided(id: number, entityId: string, status: string, ts: string, rationale: string | null): AuditEvent {
  return {
    id,
    ts,
    run_id: null,
    actor_type: "human",
    actor_id: "human:pm",
    action: "requirement.decided",
    entity_type: "requirement",
    entity_id: entityId,
    before: { status: "proposed", version: 1 },
    after: { status, version: 1 },
    rationale,
    model_id: null,
    prompt_version: null,
    parent_event_id: null,
  };
}

const first = base.requirements[0];
const second = base.requirements[1];
const top = base.events.reduce((n, e) => Math.max(n, e.id), 0);
const events = [
  ...base.events,
  decided(top + 1, first.id, "approved", "2026-10-11T10:00:00Z", "Approved, customer evidence on both markets"),
  decided(top + 2, second.id, "deferred", "2026-10-11T10:05:00Z", 'Deferred: "wait for the G60 EU study", said the PM'),
  decided(top + 3, first.id, "rejected", "2026-10-11T10:10:00Z", "Reversed after the effort review"),
];
const snapshot: WorkspaceSnapshot = {
  ...base,
  requirements: base.requirements.map((r) => (r.id === first.id ? { ...r, status: "rejected" } : r.id === second.id ? { ...r, status: "deferred" } : r)),
  events,
};

describe("the decision record", () => {
  it("takes the latest decision event per requirement and leaves the others without one", () => {
    const latest = latestDecisions(snapshot);
    expect(latest.get(first.id)?.id).toBe(top + 3);
    expect(latest.get(second.id)?.id).toBe(top + 2);
    expect(latest.size).toBe(2);
    const rows = decisionRecord(snapshot);
    expect(rows).toHaveLength(base.requirements.length);
    expect(rows.find((row) => row.requirement.id === first.id)?.decision?.after?.status).toBe("rejected");
    expect(rows.filter((row) => row.decision === null)).toHaveLength(base.requirements.length - 2);
  });

  it("orders the timeline newest first", () => {
    const ids = timelineOf(snapshot).map((e) => e.id);
    expect(ids[0]).toBe(top + 3);
    expect([...ids].sort((a, b) => b - a)).toEqual(ids);
    expect(ids).toHaveLength(events.length);
  });
});

describe("the CSV of the requirement list", () => {
  const csv = requirementsCsv(snapshot);
  const lines = csv.split("\r\n");

  it("writes a header and one row per requirement, CRLF terminated", () => {
    expect(lines[0]).toMatch(/^id,vehicle,market,domain,title,statement,/);
    expect(lines[0]).toMatch(/,status,version,decision,decided_by,decided_at,decision_note$/);
    expect(lines.at(-1)).toBe("");
    expect(lines).toHaveLength(base.requirements.length + 2);
  });

  it("quotes cells with commas, quotes or line breaks and doubles the quotes inside", () => {
    const row = lines.find((l) => l.startsWith(`${second.id},`));
    expect(row).toContain('"Deferred: ""wait for the G60 EU study"", said the PM"');
    expect(row).toContain(",deferred,human:pm,2026-10-11T10:05:00Z,");
  });

  it("carries the latest decision beside the requirement and leaves the cells empty without one", () => {
    const decidedRow = lines.find((l) => l.startsWith(`${first.id},`));
    expect(decidedRow).toContain(",rejected,human:pm,2026-10-11T10:10:00Z,Reversed after the effort review");
    const third = base.requirements[2];
    expect(lines.find((l) => l.startsWith(`${third.id},`))).toMatch(/,proposed,1,,,,$/);
  });

  it("carries the effort of the engine where there is one", () => {
    const withEffort = base.efforts.find((e) => e.kind === "change");
    if (!withEffort) throw new Error("no effort row");
    const row = lines.find((l) => l.startsWith(`${withEffort.id},`));
    expect(row).toContain(`,${String(withEffort.effort_pct)},${String(withEffort.p5)},${String(withEffort.p95)},${withEffort.decision},${withEffort.layer},${withEffort.model_hash},`);
  });
});
