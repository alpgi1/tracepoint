import { describe, expect, it } from "vitest";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import { workspaceSnapshot } from "@/lib/data/workspace";
import { bridgesFor, footprintOf, requirementBySlug, requirementHref, requirementsCitingTheme, resolveEvidence } from "./requirements";

/*
 * Stage 3 helpers on the G60 US snapshot: the route, the lookup by slug,
 * the resolution of evidence references into verbatims, metrics and
 * catalogue items, the footprint over the subsystems, and the bridges
 * from the vehicle screen.
 */
const snapshot = workspaceSnapshot("G60", "US");
const view = cpmView("G60", "US");
const catalogue = cpmCatalogue();

describe("requirement routes and lookup", () => {
  it("build lower-case routes and find a requirement by its slug in any case", () => {
    expect(requirementHref("US", "G60", "REQ-G60-US-IC-01")).toBe("/markets/us/g60/requirements/req-g60-us-ic-01");
    if (!snapshot) throw new Error("no snapshot");
    const record = requirementBySlug(snapshot, "req-g60-us-ic-01");
    expect(record?.requirement.id).toBe("REQ-G60-US-IC-01");
    expect(record?.detail.findings.length).toBe(record?.requirement.findings.length);
    expect(record?.effort?.id).toBe("REQ-G60-US-IC-01");
    expect(requirementBySlug(snapshot, "req-g60-us-zz-99")).toBeUndefined();
  });
});

describe("evidence resolution", () => {
  it("resolves every evidence row of the seats requirement to a verbatim, a metric, a catalogue item, a count or a finding", () => {
    if (!snapshot) throw new Error("no snapshot");
    const detail = snapshot.details["REQ-G60-US-IC-01"];
    const kinds = new Set<string>();
    for (const finding of detail.findings) {
      for (const row of finding.evidence) {
        const item = resolveEvidence(snapshot, row);
        kinds.add(item.kind);
        expect(item.kind).not.toBe("unresolved");
        if (item.kind === "verbatim") {
          expect(item.verbatim.text.length).toBeGreaterThan(0);
          if (row.evidence_ref.includes("#")) expect(item.classification?.id).toBe(row.evidence_ref.replace("vclass:", ""));
        }
      }
    }
    expect([...kinds].sort()).toEqual(["aggregate", "equipment", "finding", "metric", "verbatim"]);
  });
});

describe("footprint", () => {
  it("lists every subsystem of the vehicle by weight with the engine's risk and effort where the change reaches it", () => {
    if (!snapshot || !view) throw new Error("no snapshot");
    const effort = snapshot.efforts.find((e) => e.id === "REQ-G60-US-PR-03") ?? null;
    const rows = footprintOf(effort, catalogue, view);
    expect(rows).toHaveLength(12);
    expect(rows[0].name).toBe("Body/structure");
    const battery = rows.find((r) => r.key === "hv_battery");
    expect(battery?.starts).toBe(true);
    expect(battery?.risk).toBe(1);
    expect(battery?.effortPct).toBe(10);
    const seats = rows.find((r) => r.key === "seats");
    expect(seats?.path?.[0]).toBe("HV battery");
    const paint = rows.find((r) => r.key === "paint_color");
    expect(paint?.risk).toBe(0);
    expect(paint?.effortPct).toBe(0);
    const total = rows.reduce((n, r) => n + r.effortPct, 0);
    expect(total).toBeLessThanOrEqual(effort?.effort_pct ?? 0);
  });
});

describe("bridges", () => {
  it("name the requirements that start in or reach a subsystem, largest effort first", () => {
    if (!snapshot || !view) throw new Error("no snapshot");
    const bridges = bridgesFor(snapshot, view);
    const seats = bridges.seats;
    expect(seats?.starts.map((r) => r.id)).toContain("REQ-G60-US-IC-01");
    expect(seats?.reaches.map((r) => r.id)).toContain("REQ-G60-US-PR-03");
    for (const entry of Object.values(bridges)) {
      for (let i = 1; i < entry.starts.length; i++) expect(entry.starts[i - 1].effortPct).toBeGreaterThanOrEqual(entry.starts[i].effortPct);
      for (const r of entry.starts) expect(entry.reaches.map((x) => x.id)).not.toContain(r.id);
    }
    expect(bridges.hv_battery?.starts.map((r) => r.id)).toEqual(["REQ-G60-US-PR-03"]);
  });

  it("find the requirements citing a criticised theme through the finding title", () => {
    if (!snapshot || !view) throw new Error("no snapshot");
    expect(requirementsCitingTheme(snapshot, "Automatic engine start-stop function (MSA)").map((r) => r.id)).toEqual(["REQ-G60-US-PR-01"]);
    expect(requirementsCitingTheme(snapshot, "Seats").map((r) => r.id)).toContain("REQ-G60-US-IC-01");
    expect(requirementsCitingTheme(snapshot, "No such theme")).toHaveLength(0);
    const powertrain = bridgesFor(snapshot, view).powertrain;
    expect(powertrain?.citing.some((c) => c.theme === "Automatic engine start-stop function (MSA)")).toBe(true);
  });
});
