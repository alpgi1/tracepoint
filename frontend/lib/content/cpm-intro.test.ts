import { describe, expect, it } from "vitest";
import { effortContent } from "@/lib/data/effort";
import { EFFORT_CLASSES, cpmIntro, introNodes, pickExample } from "./cpm-intro";

/*
 * The CPM explainer of the brand mark on the committed effort snapshot: one
 * reproduced, independent BMW decision per class, its subsystems as columns
 * whose links follow the engine's paths, and the model figures the steps
 * quote.
 */
const content = effortContent();
const intro = cpmIntro(content);

describe("the CPM explainer", () => {
  it("quotes the model: twelve subsystems, the thresholds, the path length, the back-test", () => {
    expect(intro.subsystems).toBe(12);
    expect(intro.thresholds).toEqual({ adaptBelowPercent: 15, newGenerationFromPercent: 50 });
    expect(intro.maxPathLength).toBe(3);
    expect(intro.backtest).toEqual({ hits: 8, anchors: 8 });
    expect(intro.modelHash).toBe(content.model.modelHash);
    expect(intro.takenAt).toBe(content.snapshot.takenAt);
  });

  it("takes one reproduced, independent anchor per class, the one reaching the most subsystems", () => {
    expect(intro.examples.map((e) => e.decision)).toEqual([...EFFORT_CLASSES]);
    expect(intro.examples.map((e) => e.id)).toEqual(["i4-lci-2025-range", "g68-lwb", "gen6-battery-7-series"]);
    for (const example of intro.examples) {
      const row = content.backtest.rows.find((r) => r.id === example.id);
      expect(row?.anchor && row.independent && row.ok).toBe(true);
      expect(example.actual).toBe(row?.actual);
      expect(example.effortPct).toBe(row?.effort_pct);
    }
    // The dependent long-wheelbase iX3 never replaces the independent G68 it was calibrated with.
    expect(pickExample(content.backtest.rows, "major revision")?.id).toBe("g68-lwb");
  });

  it("puts every reached subsystem in the column of its distance, linked to the subsystem its path arrives from", () => {
    for (const example of intro.examples) {
      const row = content.backtest.rows.find((r) => r.id === example.id);
      if (!row) throw new Error(example.id);
      expect(example.nodes).toHaveLength(row.subsystems.length);
      const byKey = new Map(example.nodes.map((n) => [n.key, n]));
      const starts = example.nodes.filter((n) => n.depth === 0);
      expect(starts).toHaveLength(1);
      expect(starts[0].parent).toBeNull();
      for (const node of example.nodes) {
        expect(node.depth).toBeLessThanOrEqual(intro.maxPathLength);
        if (node.depth === 0) continue;
        const parent = node.parent ? byKey.get(node.parent) : undefined;
        expect(parent?.depth).toBe(node.depth - 1);
        const source = row.subsystems.find((s) => s.subsystem === node.key);
        expect(source?.path?.at(-2)).toBe(parent?.name);
      }
      expect(example.nodes.length + example.notReached.length).toBe(intro.subsystems);
    }
  });

  it("orders a column by its parents' rows, then by effort, and keeps the drawing's height across examples", () => {
    const battery = intro.examples.find((e) => e.id === "i4-lci-2025-range");
    if (!battery) throw new Error("no adapt example");
    expect(battery.nodes[0]).toMatchObject({ name: "HV battery", depth: 0, row: 0, effortPct: 3 });
    expect(battery.nodes.filter((n) => n.depth === 1).map((n) => n.name)).toEqual(["Body/structure", "E/E architecture", "Chassis", "Thermal/HVAC", "Charging"]);
    expect(battery.nodes.filter((n) => n.depth === 2).map((n) => n.name)).toEqual(["Interior/console", "Exterior design", "Software/HMI"]);
    expect(battery.notReached).toEqual(["Powertrain", "Paint/color"]);
    expect(intro.rows).toBe(5);
  });

  it("carries the rules that move a figure: the certification add-on and the platform rule", () => {
    const [adapt, major, generation] = intro.examples;
    expect(adapt.certificationAddOn || adapt.platformRule).toBe(false);
    expect(major.certificationAddOn).toBe(true);
    expect(generation.platformRule).toBe(true);
    expect(generation.effortPct).toBeLessThan(intro.thresholds.newGenerationFromPercent);
  });

  it("orders nodes of one row deterministically", () => {
    const row = content.backtest.rows.find((r) => r.id === "g68-lwb");
    if (!row) throw new Error("no G68 row");
    expect(introNodes(row)).toEqual(introNodes({ ...row, subsystems: [...row.subsystems].reverse() }));
  });
});
