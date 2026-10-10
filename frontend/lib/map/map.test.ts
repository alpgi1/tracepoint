import { readFileSync } from "node:fs";
import { geoContains, geoNaturalEarth1, geoPath } from "d3-geo";
import { describe, expect, it } from "vitest";
import { KIND_LAND, KIND_REGION, KIND_SEA, buildMapData, mergeMembers, trimToLonSpan, type WorldTopology } from "./data";
import { REGIONS, regionById } from "./regions";

const topology = JSON.parse(readFileSync("node_modules/world-atlas/countries-110m.json", "utf8")) as WorldTopology;
const data = buildMapData(topology, REGIONS);

/** Exact spherical containment; slow, test use only. The renderer uses a raster instead. */
function classify(lon: number, lat: number): number {
  const index = data.regions.findIndex((r) => geoContains(r.feature, [lon, lat]));
  if (index >= 0) return KIND_REGION + index;
  return geoContains(data.land, [lon, lat]) ? KIND_LAND : KIND_SEA;
}

describe("market outlines", () => {
  it("merges the EU members into one outline and drops French Guiana", () => {
    const eu = regionById("EU");
    const raw = mergeMembers(topology, eu.members);
    expect(raw.coordinates.length).toBe(10);
    expect(trimToLonSpan(raw, eu.lonSpan as [number, number]).coordinates.length).toBe(9);
  });

  it("classifies well-known cities", () => {
    const cn = KIND_REGION + REGIONS.findIndex((r) => r.id === "CN");
    const us = KIND_REGION + REGIONS.findIndex((r) => r.id === "US");
    const eu = KIND_REGION + REGIONS.findIndex((r) => r.id === "EU");
    expect(classify(13.4, 52.5)).toBe(eu); // Berlin
    expect(classify(-3.7, 40.4)).toBe(eu); // Madrid
    expect(classify(25, 60.2)).toBe(eu); // Helsinki
    expect(classify(8.5, 47.4)).toBe(KIND_LAND); // Zurich, inside the EU hole
    expect(classify(-52.3, 4.9)).toBe(KIND_LAND); // Cayenne, French Guiana
    expect(classify(-0.1, 51.5)).toBe(KIND_LAND); // London
    expect(classify(116.4, 39.9)).toBe(cn); // Beijing
    expect(classify(110.3, 19.9)).toBe(cn); // Hainan
    expect(classify(121.5, 25)).toBe(KIND_LAND); // Taipei
    expect(classify(-104.9, 39.7)).toBe(us); // Denver
    expect(classify(-157.9, 21.3)).toBe(us); // Honolulu
    expect(classify(-149.9, 61.2)).toBe(us); // Anchorage
    expect(classify(-30, 30)).toBe(KIND_SEA); // Atlantic
  });
});

describe("projection fit", () => {
  it("fits the whole sphere inside the padded extent and keeps the market centres on the map", () => {
    const projection = geoNaturalEarth1().fitExtent(
      [
        [48, 48],
        [1392, 852],
      ],
      { type: "Sphere" },
    );
    const [[x0, y0], [x1, y1]] = geoPath(projection).bounds({ type: "Sphere" });
    expect(x0).toBeGreaterThanOrEqual(47.9);
    expect(x1).toBeLessThanOrEqual(1392.1);
    expect(y0).toBeGreaterThanOrEqual(47.9);
    expect(y1).toBeLessThanOrEqual(852.1);
    for (const region of REGIONS) {
      const at = projection(region.view.center);
      expect(at).not.toBeNull();
      const [x, y] = at as [number, number];
      expect(x).toBeGreaterThan(x0);
      expect(x).toBeLessThan(x1);
      expect(y).toBeGreaterThan(y0);
      expect(y).toBeLessThan(y1);
      expect(classify(region.view.center[0], region.view.center[1])).toBe(KIND_REGION + REGIONS.indexOf(region));
    }
  });
});
