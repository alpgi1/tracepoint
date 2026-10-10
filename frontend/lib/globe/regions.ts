/**
 * The three markets the landing globe lets a product manager pick. Member ids
 * are ISO 3166-1 numeric codes as used by Natural Earth / world-atlas. The
 * `view` is where the camera settles when a market is selected; `lonSpan`
 * drops merged polygons whose centroid lies outside the span (overseas
 * territories such as French Guiana, which Natural Earth files under France).
 */
export type RegionId = "CN" | "US" | "EU";

export interface RegionView {
  /** [longitude, latitude] the globe is centred on when selected. */
  center: [number, number];
  /** Multiplier on the resting globe radius. */
  zoom: number;
}

export interface RegionSpec {
  id: RegionId;
  name: string;
  members: readonly string[];
  view: RegionView;
  lonSpan?: [number, number];
}

/** The 27 member states of the European Union (2026). Malta (470) is below the 1:110m resolution and is absent from the data. */
const EU_MEMBERS = [
  "040", // Austria
  "056", // Belgium
  "100", // Bulgaria
  "191", // Croatia
  "196", // Cyprus
  "203", // Czechia
  "208", // Denmark
  "233", // Estonia
  "246", // Finland
  "250", // France
  "276", // Germany
  "300", // Greece
  "348", // Hungary
  "372", // Ireland
  "380", // Italy
  "428", // Latvia
  "440", // Lithuania
  "442", // Luxembourg
  "470", // Malta
  "528", // Netherlands
  "616", // Poland
  "620", // Portugal
  "642", // Romania
  "703", // Slovakia
  "705", // Slovenia
  "724", // Spain
  "752", // Sweden
] as const;

export const REGIONS: readonly RegionSpec[] = [
  { id: "CN", name: "China", members: ["156"], view: { center: [104, 36], zoom: 2.2 } },
  { id: "US", name: "United States", members: ["840"], view: { center: [-98, 39], zoom: 2.1 } },
  { id: "EU", name: "European Union", members: EU_MEMBERS, view: { center: [12, 52], zoom: 2.6 }, lonSpan: [-32, 45] },
];

/** Resting view: the Atlantic from the north, so the EU and the US are in sight and China is one drag away. */
export const HOME_VIEW: RegionView = { center: [-32, 42], zoom: 1 };

export function regionById(id: RegionId): RegionSpec {
  const spec = REGIONS.find((r) => r.id === id);
  if (!spec) throw new Error(`unknown region ${id}`);
  return spec;
}
