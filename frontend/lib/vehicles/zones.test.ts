import { describe, expect, it } from "vitest";
import { DRAWING_CODES, drawingFor } from "./drawings";
import { ZONES, zoneAt } from "./zones";

describe("vehicle drawings", () => {
  it("carry three layers, a silhouette box inside the raster and the physical scale", () => {
    for (const code of DRAWING_CODES) {
      for (const view of ["side", "top"] as const) {
        const d = drawingFor(code, view);
        expect(d.layers.body).toMatch(/-body\.png$/);
        expect(d.layers.lines).toMatch(/-lines\.png$/);
        expect(d.layers.contour).toMatch(/-contour\.png$/);
        const [x0, y0, x1, y1] = d.bbox;
        expect(x0).toBeGreaterThanOrEqual(0);
        expect(y0).toBeGreaterThanOrEqual(0);
        expect(x1).toBeLessThanOrEqual(d.width);
        expect(y1).toBeLessThanOrEqual(d.height);
        expect(x1 - x0).toBeGreaterThan(d.width * 0.85);
        expect((x1 - x0) / d.lengthMm).toBeCloseTo(d.pxPerMm, 3);
      }
    }
  });
});

describe("zones", () => {
  it("assign the wheels to driving dynamics, the cabin to interior comfort and the gap between the wheels to nothing", () => {
    expect(zoneAt(ZONES.side, 0.2, 0.85)).toBe("driving_dynamics");
    expect(zoneAt(ZONES.side, 0.55, 0.4)).toBe("interior_comfort");
    expect(zoneAt(ZONES.side, 0.5, 0.97)).toBeNull();
    expect(zoneAt(ZONES.top, 0.5, 0.5)).toBe("interior_comfort");
  });

  it("do not overlap in either view", () => {
    for (const zones of [ZONES.side, ZONES.top]) {
      for (let i = 0; i < zones.length; i++) {
        for (let j = i + 1; j < zones.length; j++) {
          for (const a of zones[i].rects) {
            for (const b of zones[j].rects) {
              const overlap = a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
              expect(overlap, `${zones[i].domain} overlaps ${zones[j].domain}`).toBe(false);
            }
          }
        }
      }
    }
  });
});

describe("vehicle photos", () => {
  it("exist for every drawing with the cut-out's size and source", async () => {
    const { photoFor } = await import("./drawings");
    for (const code of DRAWING_CODES) {
      const photo = photoFor(code);
      expect(photo.src).toBe(`/vehicles/${code}-photo-side.webp`);
      expect(photo.width).toBe(1600);
      expect(photo.height).toBeGreaterThan(400);
      expect(photo.height).toBeLessThan(700);
      expect(photo.source).toContain("configure.bmw.de");
    }
  });
});
