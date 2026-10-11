import { describe, expect, it } from "vitest";
import { cpmCatalogue, cpmView, subsystemsByWeight } from "./cpm";
import { content } from "./markets";

/*
 * The CPM content (content/cpm.json) is generated; these tests pin the
 * contract the screen relies on: twelve subsystems whose weights sum to 100,
 * links to known subsystems, one view per vehicle and market pair with every
 * subsystem present, quotes with their evidence reference, sourced market
 * rows, and theme figures that agree with content/markets.json.
 */
const catalogue = cpmCatalogue();
const keys = catalogue.subsystems.map((s) => s.key);

describe("CPM catalogue", () => {
  it("has twelve subsystems whose weights sum to 100", () => {
    expect(catalogue.subsystems).toHaveLength(12);
    expect(new Set(keys).size).toBe(12);
    expect(catalogue.subsystems.reduce((sum, s) => sum + s.weight, 0)).toBe(100);
  });

  it("links only to known subsystems with likelihood and impact in 0 to 1 and a reason", () => {
    for (const s of catalogue.subsystems) {
      expect(s.basis.length).toBeGreaterThan(0);
      for (const link of s.links) {
        expect(keys).toContain(link.to);
        expect(link.to).not.toBe(s.key);
        expect(link.likelihood).toBeGreaterThan(0);
        expect(link.likelihood).toBeLessThanOrEqual(1);
        expect(link.impact).toBeGreaterThan(0);
        expect(link.impact).toBeLessThanOrEqual(1);
        expect(link.why.length).toBeGreaterThan(0);
      }
    }
  });

  it("orders a vehicle's subsystems by their weight on it, heaviest first", () => {
    const view = cpmView("G60", "US");
    expect(view).toBeDefined();
    if (!view) return;
    const ordered = subsystemsByWeight(catalogue, view);
    expect(ordered).toHaveLength(12);
    expect(ordered[0].entry.weight).toBe(18);
    for (let i = 1; i < ordered.length; i++) expect(ordered[i - 1].entry.weight).toBeGreaterThanOrEqual(ordered[i].entry.weight);
  });

  it("names its method, the engine's model file and marks the values as assumptions", () => {
    expect(catalogue.method.name).toBe("Change Prediction Method");
    expect(catalogue.method.modelSource).toBe("config/effort/model.yaml");
    expect(catalogue.method.basis).toContain("assumption");
    expect(catalogue.mapping.themes + catalogue.mapping.unassigned.length).toBe(225);
  });
});

describe("CPM views", () => {
  const pairs = content.markets.flatMap((m) => m.vehicles.map((v) => ({ market: m, vehicle: v })));

  it("exist for every vehicle and market pair with the subsystems the model keeps on the vehicle, weights renormalised to 100", () => {
    for (const { market, vehicle } of pairs) {
      const view = cpmView(vehicle.code, market.code);
      expect(view, `${vehicle.code} ${market.code}`).toBeDefined();
      if (!view) continue;
      const present = view.subsystems.map((s) => s.key);
      const absent = view.absent.map((a) => a.key);
      expect([...present, ...absent].sort()).toEqual([...keys].sort());
      expect(Math.abs(view.subsystems.reduce((sum, s) => sum + s.weight, 0) - 100)).toBeLessThan(0.3);
      expect(view.verbatims).toBe(vehicle.verbatims);
      if (vehicle.code === "F70") expect(absent).toEqual(["hv_battery", "charging"]);
      else expect(absent).toEqual([]);
    }
  });

  it("count likes and complaints within the rows and carry quotes with evidence references", () => {
    for (const { market, vehicle } of pairs) {
      const view = cpmView(vehicle.code, market.code);
      if (!view) continue;
      let rows = 0;
      for (const s of view.subsystems) {
        rows += s.rows;
        expect(s.likes + s.complaints).toBeLessThanOrEqual(s.rows);
        for (const theme of [...s.liked.themes, ...s.criticised.themes]) {
          expect(theme.quotes.length).toBeLessThanOrEqual(2);
          for (const q of theme.quotes) {
            expect(q.evidenceRef).toBe(`verbatim:${q.id}`);
            expect(q.text.length).toBeGreaterThan(0);
          }
        }
        for (const t of s.criticised.themes) expect(t.defects + t.difficultToUse + t.wants).toBe(t.complaints);
        expect(s.liked.themes.length).toBeLessThanOrEqual(6);
        expect(s.criticised.themes.length).toBeLessThanOrEqual(6);
        for (let i = 1; i < s.liked.themes.length; i++) expect(s.liked.themes[i - 1].likes).toBeGreaterThanOrEqual(s.liked.themes[i].likes);
        for (let i = 1; i < s.criticised.themes.length; i++) expect(s.criticised.themes[i - 1].complaints).toBeGreaterThanOrEqual(s.criticised.themes[i].complaints);
      }
      const absentRows = view.absent.reduce((sum, a) => sum + a.rows, 0);
      expect(rows + absentRows + view.unassignedRows).toBe(view.rows);
      if (view.verbatims === 0) expect(view.rows).toBe(0);
    }
  });

  it("carry a derived suggestion and summary wherever a subsystem has rows, none where it has not", () => {
    for (const { market, vehicle } of pairs) {
      const view = cpmView(vehicle.code, market.code);
      for (const s of view?.subsystems ?? []) {
        for (const block of [s.liked, s.criticised]) {
          if (s.rows === 0) {
            expect(block.narration).toBeNull();
            continue;
          }
          expect(block.narration?.basis).toBe("derived");
          expect(block.narration?.suggestion).toMatch(/\.$/);
          expect(block.narration?.summary.length).toBeGreaterThan(20);
          for (const text of [block.narration?.suggestion ?? "", block.narration?.summary ?? ""]) {
            expect(text).not.toMatch(/[—–!{}]/);
            expect(text).not.toMatch(/\bundefined\b|\bNaN\b|\bnull\b/);
          }
        }
      }
    }
  });

  it("agree with the complaint themes of markets.json", () => {
    let compared = 0;
    for (const { market, vehicle } of pairs) {
      const view = cpmView(vehicle.code, market.code);
      if (!view) continue;
      const criticised = view.subsystems.flatMap((s) => s.criticised.themes);
      for (const theme of vehicle.complaintThemes) {
        const here = criticised.find((t) => t.theme === theme.theme);
        if (!here) continue;
        expect(here.rows, theme.theme).toBe(theme.rows);
        expect(here.complaints, theme.theme).toBe(theme.complaints);
        expect(here.defects, theme.theme).toBe(theme.defects);
        compared++;
      }
    }
    expect(compared).toBeGreaterThan(10);
  });

  it("carries sourced market rows with a date, a type and a level", () => {
    let rows = 0;
    for (const { market, vehicle } of pairs) {
      const view = cpmView(vehicle.code, market.code);
      for (const s of view?.subsystems ?? []) {
        for (const row of s.market) {
          rows++;
          expect(row.source.url).toMatch(/^https:\/\//);
          expect(row.source.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          expect(["primary", "secondary"]).toContain(row.source.type);
          expect(["strong", "medium", "weak"]).toContain(row.level);
          expect(["market", "competitor"]).toContain(row.kind);
          expect(["evidence", "assumption"]).toContain(row.basis);
        }
      }
    }
    expect(rows).toBeGreaterThan(0);
  });
});
