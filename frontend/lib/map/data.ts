import { geoCentroid } from "d3-geo";
import { merge } from "topojson-client";
import type { GeometryCollection, GeometryObject, MultiPolygon as TopoMultiPolygon, Polygon as TopoPolygon, Topology } from "topojson-specification";
import type { Feature, MultiPolygon, Polygon } from "geojson";
import type { RegionSpec } from "./regions";

export type WorldTopology = Topology<{ countries: GeometryCollection; land: GeometryCollection }>;

export interface RegionShape {
  spec: RegionSpec;
  feature: Feature<MultiPolygon>;
}

export interface MapData {
  land: Feature<MultiPolygon>;
  regions: RegionShape[];
}

/** Point classification: 0 sea, 1 land, 2 + regionIndex inside a market. */
export const KIND_SEA = 0;
export const KIND_LAND = 1;
export const KIND_REGION = 2;

/** Antarctica is left off the map: no market is there and it costs a fifth of the height. */
const ANTARCTICA = "010";

/**
 * The part of the world the map is fitted to, [west, south] to [east, north]
 * in degrees. The west edge runs through Hawaii's Big Island, so the empty
 * Pacific west of it and the tip of Alaska's peninsula fall just off the left
 * edge; the south edge lies 12 degrees below Cape Horn, so the land sits
 * slightly above the middle with room below South America.
 */
export const FIT_WINDOW: [[number, number], [number, number]] = [
  [-156, -68],
  [180, 84],
];

type Mergeable = TopoPolygon | TopoMultiPolygon;

function asFeature(geometry: MultiPolygon): Feature<MultiPolygon> {
  return { type: "Feature", properties: {}, geometry };
}

function isMergeable(g: GeometryObject): g is Mergeable {
  return g.type === "Polygon" || g.type === "MultiPolygon";
}

/** Merge the member countries of a region into one outline (shared borders disappear). */
export function mergeMembers(topology: WorldTopology, ids: readonly string[]): MultiPolygon {
  const wanted = new Set(ids);
  const geometries = topology.objects.countries.geometries.filter(
    (g): g is Mergeable => isMergeable(g) && wanted.has(String(g.id)),
  );
  if (geometries.length === 0) throw new Error(`none of ${ids.join(", ")} is in the topology`);
  return merge(topology, geometries);
}

/** Keep only the polygons whose centroid longitude lies inside the span. */
export function trimToLonSpan(geometry: MultiPolygon, span: [number, number]): MultiPolygon {
  const coordinates = geometry.coordinates.filter((polygon) => {
    const [lon] = geoCentroid({ type: "Polygon", coordinates: polygon });
    return lon >= span[0] && lon <= span[1];
  });
  return { type: "MultiPolygon", coordinates };
}

export function landFeature(topology: WorldTopology): Feature<MultiPolygon> {
  const geometries = topology.objects.countries.geometries.filter(
    (g): g is Mergeable => isMergeable(g) && String(g.id) !== ANTARCTICA,
  );
  return asFeature(merge(topology, geometries));
}

/**
 * The fit window as a polygon whose edges follow the parallels and meridians.
 * d3 projects straight edges along great circles, so the ring is densified
 * every five degrees to keep the window's true shape. d3 takes a clockwise
 * ring's inside as the polygon: the ring runs west to east along the north
 * edge first; the other way round it would mean the rest of the globe, and a
 * fit to it is a fit to the whole sphere.
 */
export function fitWindow(step = 5): Polygon {
  const [[west, south], [east, north]] = FIT_WINDOW;
  const ring: [number, number][] = [];
  for (let lon = west; lon < east; lon += step) ring.push([lon, north]);
  for (let lat = north; lat > south; lat -= step) ring.push([east, lat]);
  for (let lon = east; lon > west; lon -= step) ring.push([lon, south]);
  for (let lat = south; lat < north; lat += step) ring.push([west, lat]);
  ring.push([west, north]);
  return { type: "Polygon", coordinates: [ring] };
}

export function regionShapes(topology: WorldTopology, regions: readonly RegionSpec[]): RegionShape[] {
  return regions.map((spec) => {
    let geometry = mergeMembers(topology, spec.members);
    if (spec.lonSpan) geometry = trimToLonSpan(geometry, spec.lonSpan);
    return { spec, feature: asFeature(geometry) };
  });
}

export function buildMapData(topology: WorldTopology, regions: readonly RegionSpec[]): MapData {
  return { land: landFeature(topology), regions: regionShapes(topology, regions) };
}
