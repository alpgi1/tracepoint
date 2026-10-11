import { describe, expect, it } from "vitest";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import { effortContent } from "@/lib/data/effort";
import { workspaceScopes, workspaceSnapshot } from "@/lib/data/workspace";
import { axisMax, byEvidence, chosenIds, effortAxis, h1Note, horizonGroups, logPosition, matrixPoints, packageRows, presetIds, rowsAxis } from "./priorities";

/*
 * Stage 4 on the G60 US snapshot: the chart's points, their order and
 * groups, the two scales, the H1 sentence, the package rows and the builder's chosen set;
 * and the effort model file against the CPM catalogue and the snapshots.
 */
const snapshot = workspaceSnapshot("G60", "US");
const view = cpmView("G60", "US");
const catalogue = cpmCatalogue();

describe("matrix points", () => {
  it("carry one point per requirement with the primary finding's complaint rows and the estimate", () => {
    if (!snapshot) throw new Error("no snapshot");
    const points = matrixPoints(snapshot);
    expect(points).toHaveLength(20);
    const keep = points.find((p) => p.id === "REQ-G60-US-DD-03");
    expect(keep?.complaintRows).toBe(0);
    expect(keep?.primaryKinds).toEqual(["strength"]);
    const seats = points.find((p) => p.id === "REQ-G60-US-IC-01");
    expect(seats?.complaintRows).toBe(62);
    expect(seats?.effort?.effort_pct).toBe(4.58);
    expect(points.every((p) => p.effort !== null)).toBe(true);
  });

  it("order the table twin by complaint rows, then effort, then id, and round the axes to clean steps", () => {
    if (!snapshot) throw new Error("no snapshot");
    const ordered = byEvidence(matrixPoints(snapshot));
    for (let i = 1; i < ordered.length; i++) expect(ordered[i - 1].complaintRows).toBeGreaterThanOrEqual(ordered[i].complaintRows);
    expect(axisMax(56.9, 10)).toBe(60);
    expect(axisMax(98, 25)).toBe(100);
    expect(axisMax(0, 25)).toBe(25);
  });

  it("group the rows by horizon, H1 first, each in the table twin's order", () => {
    if (!snapshot) throw new Error("no snapshot");
    const groups = horizonGroups(matrixPoints(snapshot));
    expect(groups.map((g) => [g.horizon, g.points.length])).toEqual([
      ["H1", 18],
      ["H2", 2],
    ]);
    expect(groups[0].points[0].id).toBe("REQ-G60-US-GE-01");
    expect(groups[1].points.map((p) => p.id)).toEqual(["REQ-G60-US-PR-03", "REQ-G60-US-DD-03"]);
  });

  it("scale the complaint rows from 0 in clean steps", () => {
    if (!snapshot) throw new Error("no snapshot");
    expect(rowsAxis(matrixPoints(snapshot))).toEqual({ max: 100, ticks: [0, 25, 50, 75, 100] });
    const f70 = workspaceSnapshot("F70", "EU");
    if (!f70) throw new Error("no snapshot");
    expect(rowsAxis(matrixPoints(f70))).toEqual({ max: 200, ticks: [0, 50, 100, 150, 200] });
  });

  it("scale the effort logarithmically from under the smallest P5 to a whole new vehicle generation", () => {
    if (!snapshot) throw new Error("no snapshot");
    const axis = effortAxis(matrixPoints(snapshot));
    expect(axis).toEqual({ min: 0.05, max: 100, ticks: [0.1, 1, 10, 100] });
    expect(logPosition(axis, 0.05)).toBe(0);
    expect(logPosition(axis, 100)).toBe(1);
    expect(logPosition(axis, 0.01)).toBe(0);
    expect(logPosition(axis, 1)).toBeCloseTo(0.394, 3);
    // Equal ratios take equal widths: 0.2 % to 2 % is as wide as 4.9 % to 49 %.
    expect(logPosition(axis, 2) - logPosition(axis, 0.2)).toBeCloseTo(logPosition(axis, 49) - logPosition(axis, 4.9), 9);
    for (const p of matrixPoints(snapshot)) {
      if (p.effort?.kind !== "change") continue;
      expect(logPosition(axis, p.effort.p5)).toBeGreaterThan(0);
      expect(logPosition(axis, p.effort.p95)).toBeLessThan(1);
    }
  });
});

describe("packages", () => {
  it("state that the H1 package of G60 US is beyond adapt although every H1 requirement is adapt alone", () => {
    if (!snapshot) throw new Error("no snapshot");
    const note = h1Note(snapshot);
    expect(note?.singleClass).toBe("adapt");
    expect(note?.combined.decision).toBe("major revision");
    expect(note?.beyondAdapt).toBe(true);
    expect(note?.largest.map((e) => e.id)).toEqual(["REQ-G60-US-IC-01", "REQ-G60-US-IC-03", "REQ-G60-US-ID-01"]);
  });

  it("give the package's subsystems the vehicle's weights", () => {
    if (!snapshot || !view) throw new Error("no snapshot");
    const h1 = snapshot.scenarios.find((s) => s.scenario === "H1");
    const rows = packageRows(h1?.subsystems ?? [], catalogue, view);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0].name).toBe("Software/HMI");
    expect(rows[0].weight).toBe(10);
    for (const r of rows) expect(r.risk).toBeGreaterThan(0);
  });

  it("read the builder's chosen set from the URL in the scope's order and offer the presets", () => {
    if (!snapshot) throw new Error("no snapshot");
    expect(chosenIds(snapshot, ["req-g60-us-pr-03", "REQ-G60-US-IC-01", "REQ-X"])).toEqual(["REQ-G60-US-IC-01", "REQ-G60-US-PR-03"]);
    expect(chosenIds(snapshot, "REQ-G60-US-ID-01")).toEqual(["REQ-G60-US-ID-01"]);
    expect(chosenIds(snapshot, undefined)).toEqual([]);
    expect(presetIds(snapshot, "H1")).toHaveLength(17);
    expect(presetIds(snapshot, "H2")).toHaveLength(2);
    expect(presetIds(snapshot, "ALL")).toHaveLength(19);
  });
});

describe("effort model file", () => {
  const { model, backtest, snapshot: meta } = effortContent();

  it("matches the CPM catalogue and the snapshots' model hash", () => {
    expect(model.modelHash).toMatch(/^[0-9a-f]{12}$/);
    expect(model.subsystems.map((s) => [s.key, s.weight])).toEqual(catalogue.subsystems.map((s) => [s.key, s.weight]));
    expect(model.subsystems.reduce((n, s) => n + s.links.length, 0)).toBe(catalogue.subsystems.reduce((n, s) => n + s.links.length, 0));
    for (const s of workspaceScopes()) if (s.snapshot.modelHash) expect(s.snapshot.modelHash).toBe(model.modelHash);
    expect(Object.keys(model.vehicles).sort()).toEqual(["F70", "G60", "G68", "G70"]);
    expect(model.vehicles.F70.absent).toEqual(["hv_battery", "charging"]);
    expect(Date.parse(meta.takenAt)).not.toBeNaN();
  });

  it("reproduces every anchor of the back-test", () => {
    expect(backtest.hits).toBe(backtest.anchors);
    expect(backtest.anchors).toBe(8);
    expect(backtest.model_hash).toBe(model.modelHash);
    const anchors = backtest.rows.filter((r) => r.anchor);
    expect(anchors).toHaveLength(8);
    for (const r of anchors) {
      expect(r.ok).toBe(true);
      expect(r.actual).toBe(r.decision);
      expect(r.p5).toBeLessThanOrEqual(r.effort_pct);
      expect(r.p95).toBeGreaterThanOrEqual(r.effort_pct);
    }
    for (const r of backtest.rows.filter((r) => !r.anchor)) expect(r.actual).toBeNull();
  });
});
