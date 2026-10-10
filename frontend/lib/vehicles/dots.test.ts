import { describe, expect, it } from "vitest";
import { drawingFor } from "./drawings";
import { dotsOf, runsByZone, UNZONED } from "./dots";
import { ZONES, zoneAt } from "./zones";

describe("vehicle dot runs", () => {
  const drawing = drawingFor("F70", "side");

  it("expands rows to the dot count the pipeline reported and keeps every dot inside the silhouette box", () => {
    const fine = dotsOf(drawing.grids.fine);
    const coarse = dotsOf(drawing.grids.coarse);
    expect(fine.length).toBeGreaterThan(coarse.length * 3);
    const [x0, y0, x1, y1] = drawing.bbox;
    for (const [x, y] of fine) {
      expect(x).toBeGreaterThanOrEqual(x0);
      expect(x).toBeLessThanOrEqual(x1);
      expect(y).toBeGreaterThanOrEqual(y0);
      expect(y).toBeLessThanOrEqual(y1);
    }
  });

  it("keeps the physical pitch across vehicles", () => {
    for (const code of ["F70", "G60", "G70"] as const) {
      const side = drawingFor(code, "side");
      expect(side.grids.fine.pitchMm).toBe(32);
      expect(side.grids.fine.pitch / side.pxPerMm).toBeCloseTo(32, 0);
      expect(side.grids.coarse.pitch).toBeCloseTo(side.grids.fine.pitch * 2, 2);
    }
  });

  it("groups runs by zone without losing a dot", () => {
    const grid = drawing.grids.coarse;
    const groups = runsByZone(drawing, grid, ZONES.side);
    const total = Object.values(groups).reduce((n, d) => n + countDots(d ?? "", grid.pitch), 0);
    expect(total).toBe(dotsOf(grid).length);
    expect(Object.keys(groups)).toContain("driving_dynamics");
    expect(Object.keys(groups)).toContain("interior_comfort");
    const plain = runsByZone(drawing, grid);
    expect(Object.keys(plain)).toEqual([UNZONED]);
  });

  it("assigns the wheels to driving dynamics and the cabin to interior comfort", () => {
    expect(zoneAt(ZONES.side, 0.2, 0.85)).toBe("driving_dynamics");
    expect(zoneAt(ZONES.side, 0.55, 0.4)).toBe("interior_comfort");
    expect(zoneAt(ZONES.side, 0.5, 0.97)).toBeNull();
  });
});

/** Dots in a path of `M x y H x2` subpaths at a given pitch. */
function countDots(d: string, pitch: number): number {
  let count = 0;
  for (const m of d.matchAll(/M([-\d.]+) [-\d.]+H([-\d.]+)/g)) {
    count += Math.round((Number(m[2]) - Number(m[1])) / pitch) + 1;
  }
  return count;
}
