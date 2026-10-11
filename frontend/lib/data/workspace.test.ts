import { describe, expect, it } from "vitest";
import type { AuditEvent, RequirementDetail } from "@/lib/content/workspace-types";
import { mergeLive, workspaceSnapshot } from "./workspace";

/*
 * The live merge (D-085): the API's current lists replace the snapshot's,
 * the excluded candidates come from the scope events, the requirement
 * events are kept to this scope and sorted by id, the detail of the page
 * replaces the snapshot's, and the evidence stays.
 */
const base = workspaceSnapshot("G60", "US");
if (!base) throw new Error("no snapshot");

function event(id: number, entityType: string, entityId: string, action: string, after: Record<string, unknown> | null): AuditEvent {
  return { id, ts: "2026-10-11T10:00:00Z", run_id: null, actor_type: "system", actor_id: "system", action, entity_type: entityType, entity_id: entityId, before: null, after, rationale: null, model_id: null, prompt_version: null, parent_event_id: null };
}

describe("mergeLive", () => {
  const first = base.requirements[0];
  const detail: RequirementDetail = { ...base.details[first.id], findings: [] };
  const merged = mergeLive(base, {
    requirements: base.requirements.map((r) => (r.id === first.id ? { ...r, status: "approved", version: 2 } : r)),
    efforts: base.efforts.slice(0, 3),
    scenarios: base.scenarios,
    scopeEvents: [event(900, "scope", "G60:US", "requirements.candidates_excluded", { excluded: [{ finding: "F-1", reason: "below the threshold" }] })],
    requirementEvents: [
      event(902, "requirement", first.id, "requirement.decided", { status: "approved", version: 2 }),
      event(901, "requirement", "REQ-F70-EU-ID-01", "requirement.decided", { status: "approved" }),
      event(903, "requirement", first.id, "requirement.imported", null),
    ],
    detail,
  });

  it("takes the API's requirements, efforts and scenarios as they are", () => {
    expect(merged.requirements.find((r) => r.id === first.id)?.status).toBe("approved");
    expect(merged.efforts).toHaveLength(3);
    expect(merged.scenarios).toBe(base.scenarios);
  });

  it("reads the excluded candidates from the scope events", () => {
    expect(merged.excluded).toEqual([{ finding: "F-1", reason: "below the threshold" }]);
  });

  it("keeps the events of this scope's requirements, sorted by id", () => {
    expect(merged.events.map((e) => e.id)).toEqual([902, 903]);
  });

  it("replaces the detail of the requirement that was read and keeps the evidence", () => {
    expect(merged.details[first.id]).toBe(detail);
    expect(merged.details[base.requirements[1].id]).toBe(base.details[base.requirements[1].id]);
    expect(merged.verbatims).toBe(base.verbatims);
    expect(merged.metrics).toBe(base.metrics);
    expect(merged.equipment).toBe(base.equipment);
  });

  it("leaves the snapshot untouched", () => {
    expect(base.requirements.find((r) => r.id === first.id)?.status).not.toBe("approved");
    expect(base.events.find((e) => e.id === 902)).toBeUndefined();
  });
});
