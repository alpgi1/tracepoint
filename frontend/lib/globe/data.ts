import { geoCentroid } from "d3-geo";
import { merge } from "topojson-client";
import type { GeometryCollection, GeometryObject, MultiPolygon as TopoMultiPolygon, Polygon as TopoPolygon, Topology } from "topojson-specification";
import type { Feature, MultiPolygon } from "geojson";
import { latitudeRows, toCartesian } from "./math";
import type { RegionSpec } from "./regions";

export type WorldTopology = Topology<{ countries: GeometryCollection; land: GeometryCollection }>;

export interface RegionShape {
  spec: RegionSpec;
  feature: Feature<MultiPolygon>;
}

/** Dot classification: 0 sea, 1 land, 2 + regionIndex inside a market. */
export const DOT_SEA = 0;
export const DOT_LAND = 1;
export const DOT_REGION = 2;

export type Classifier = (lon: number, lat: number) => number;

export interface DotField {
  count: number;
  /** Unit vectors, three floats per dot. */
  xyz: Float32Array;
  kind: Uint8Array;
}

export interface GlobeData {
  land: Feature<MultiPolygon>;
  regions: RegionShape[];
  dots: DotField;
  classify: Classifier;
}

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

/** Keep the sample points that fall on land. */
export function sampleDots(points: { lon: Float64Array; lat: Float64Array }, classify: Classifier): DotField {
  const { lon, lat } = points;
  const count = lon.length;
  const xyz = new Float32Array(count * 3);
  const kind = new Uint8Array(count);
  let n = 0;
  for (let i = 0; i < count; i++) {
    const k = classify(lon[i], lat[i]);
    if (k === DOT_SEA) continue;
    const [x, y, z] = toCartesian(lon[i], lat[i]);
    xyz[n * 3] = x;
    xyz[n * 3 + 1] = y;
    xyz[n * 3 + 2] = z;
    kind[n] = k;
    n++;
  }
  return { count: n, xyz: xyz.slice(0, n * 3), kind: kind.slice(0, n) };
}

export interface BuildOptions {
  /** Dot spacing in degrees of arc, rows and columns alike. */
  spacing: number;
  /** Builds the point classifier from the land and region shapes (raster in the browser, exact in tests). */
  classifier: (land: Feature<MultiPolygon>, regions: RegionShape[]) => Classifier;
}

export function buildGlobeData(topology: WorldTopology, regions: readonly RegionSpec[], options: BuildOptions): GlobeData {
  const land = landFeature(topology);
  const shapes = regionShapes(topology, regions);
  const classify = options.classifier(land, shapes);
  return { land, regions: shapes, dots: sampleDots(latitudeRows(options.spacing), classify), classify };
}
