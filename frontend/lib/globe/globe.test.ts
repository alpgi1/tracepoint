import { readFileSync } from "node:fs";
import { geoContains, geoOrthographic } from "d3-geo";
import { describe, expect, it } from "vitest";
import {
  DOT_LAND,
  DOT_REGION,
  DOT_SEA,
  buildGlobeData,
  mergeMembers,
  regionShapes,
  trimToLonSpan,
  type Classifier,
  type WorldTopology,
} from "./data";
import { angularDistance, applyMatrix, fibonacciSphere, latitudeRows, orthographicPoint, rotationMatrix, toCartesian } from "./math";
import { HOME_VIEW, REGIONS, regionById } from "./regions";

const topology = JSON.parse(readFileSync("node_modules/world-atlas/countries-110m.json", "utf8")) as WorldTopology;

/** Exact spherical containment; slow, test use only. */
function exactClassifier(...[land, regions]: Parameters<Parameters<typeof buildGlobeData>[2]["classifier"]>): Classifier {
  return (lon, lat) => {
    const index = regions.findIndex((r) => geoContains(r.feature, [lon, lat]));
    if (index >= 0) return DOT_REGION + index;
    return geoContains(land, [lon, lat]) ? DOT_LAND : DOT_SEA;
  };
}

describe("region outlines", () => {
  const shapes = regionShapes(topology, REGIONS);
  const eu = regionById("EU");

  it("merges the EU members into one outline and drops French Guiana", () => {
    const raw = mergeMembers(topology, eu.members);
    expect(raw.coordinates.length).toBe(10);
    const trimmed = trimToLonSpan(raw, eu.lonSpan as [number, number]);
    expect(trimmed.coordinates.length).toBe(9);
  });

  it("classifies well-known cities", () => {
    const classify = exactClassifier(shapes.length ? { type: "Feature", properties: {}, geometry: mergeMembers(topology, topology.objects.countries.geometries.map((g) => String(g.id))) } : ({} as never), shapes);
    const cn = DOT_REGION + REGIONS.findIndex((r) => r.id === "CN");
    const us = DOT_REGION + REGIONS.findIndex((r) => r.id === "US");
    const euIndex = DOT_REGION + REGIONS.findIndex((r) => r.id === "EU");
    expect(classify(13.4, 52.5)).toBe(euIndex); // Berlin
    expect(classify(-3.7, 40.4)).toBe(euIndex); // Madrid
    expect(classify(25, 60.2)).toBe(euIndex); // Helsinki
    expect(classify(8.5, 47.4)).toBe(DOT_LAND); // Zurich, inside the EU hole
    expect(classify(-52.3, 4.9)).toBe(DOT_LAND); // Cayenne, French Guiana
    expect(classify(-0.1, 51.5)).toBe(DOT_LAND); // London
    expect(classify(116.4, 39.9)).toBe(cn); // Beijing
    expect(classify(110.3, 19.9)).toBe(cn); // Hainan
    expect(classify(121.5, 25)).toBe(DOT_LAND); // Taipei
    expect(classify(-104.9, 39.7)).toBe(us); // Denver
    expect(classify(-157.9, 21.3)).toBe(us); // Honolulu
    expect(classify(-149.9, 61.2)).toBe(us); // Anchorage
    expect(classify(-30, 30)).toBe(DOT_SEA); // Atlantic
  });

  it("builds a dot field with every market represented", () => {
    const data = buildGlobeData(topology, REGIONS, { spacing: 4, classifier: exactClassifier });
    // 4 degree spacing gives about 2600 points on the sphere, roughly 29 % of them on land
    expect(data.dots.count).toBeGreaterThan(600);
    expect(data.dots.count).toBeLessThan(1000);
    const kinds = new Set(Array.from(data.dots.kind));
    REGIONS.forEach((_, index) => expect(kinds.has(DOT_REGION + index)).toBe(true));
    expect(kinds.has(DOT_SEA)).toBe(false);
  });
});

describe("rotation matrix", () => {
  it("matches d3's orthographic projection for random points", () => {
    const rotate: [number, number, number] = [37, -22, 0];
    const projection = geoOrthographic().rotate(rotate).scale(300).translate([400, 350]);
    const m = rotationMatrix(rotate);
    for (let i = 0; i < 200; i++) {
      const lon = Math.random() * 360 - 180;
      const lat = Math.random() * 180 - 90;
      const v = applyMatrix(m, toCartesian(lon, lat));
      if (v[0] <= 0.05) continue; // back of the globe, d3 still projects it but it is hidden
      const expected = projection([lon, lat]);
      const actual = orthographicPoint(v, 300, 400, 350);
      expect(expected).not.toBeNull();
      expect(actual[0]).toBeCloseTo((expected as [number, number])[0], 6);
      expect(actual[1]).toBeCloseTo((expected as [number, number])[1], 6);
    }
  });
});

describe("fibonacci sphere", () => {
  it("spreads points evenly between hemispheres and latitudes", () => {
    const { lon, lat } = fibonacciSphere(10000);
    const north = Array.from(lat).filter((l) => l > 0).length;
    expect(Math.abs(north - 5000)).toBeLessThan(10);
    const polar = Array.from(lat).filter((l) => Math.abs(l) > 60).length;
    // cap above 60 degrees is 1 - sin(60) ~ 13.4 % of each hemisphere
    expect(polar / 10000).toBeCloseTo(0.134, 1);
    expect(Math.min(...lon)).toBeGreaterThanOrEqual(-180);
    expect(Math.max(...lon)).toBeLessThanOrEqual(180);
  });
});

describe("latitude rows", () => {
  it("keeps the spacing even from the equator to the poles", () => {
    const { lon, lat } = latitudeRows(2);
    expect(lat.length).toBe(lon.length);
    const near = (a: number, b: number) => Math.abs(a - b) < 0.01;
    const equator = Array.from(lat).filter((l) => near(l, 1)).length;
    const polar = Array.from(lat).filter((l) => near(l, 71)).length;
    expect(equator).toBe(180);
    // columns scale with cos(lat): cos(71) is about a third of cos(1)
    expect(polar / equator).toBeCloseTo(Math.cos((71 * Math.PI) / 180), 1);
    expect(Math.min(...lon)).toBeGreaterThanOrEqual(-180);
    expect(Math.max(...lon)).toBeLessThan(180);
    // sphere area 41,253 square degrees at 4 square degrees per dot
    expect(lat.length).toBeGreaterThan(9500);
    expect(lat.length).toBeLessThan(11000);
  });
});

describe("views", () => {
  it("keeps the EU and the US in sight from the resting view", () => {
    expect(angularDistance(HOME_VIEW.center, regionById("EU").view.center)).toBeLessThan(80);
    expect(angularDistance(HOME_VIEW.center, regionById("US").view.center)).toBeLessThan(80);
    expect(angularDistance(HOME_VIEW.center, regionById("CN").view.center)).toBeGreaterThan(90);
  });
});
