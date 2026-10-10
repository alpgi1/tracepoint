import { geoCentroid } from "d3-geo";
import { merge } from "topojson-client";
import type { GeometryCollection, GeometryObject, MultiPolygon as TopoMultiPolygon, Polygon as TopoPolygon, Topology } from "topojson-specification";
import type { Feature, MultiPolygon } from "geojson";
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
  const geometries = topology.objects.countries.geometries.filter(isMergeable);
  return asFeature(merge(topology, geometries));
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
