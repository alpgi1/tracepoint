/**
 * The three markets a product manager can pick on the map. Member ids are
 * ISO 3166-1 numeric codes as used by Natural Earth / world-atlas. `view` is
 * the point the map centres on and the magnification applied when a market
 * is selected; `readoutAt` is where the market's figures sit on the resting
 * map (inside the big markets, beside the small one); `lonSpan` drops merged
 * polygons whose centroid lies outside the span (overseas territories such
 * as French Guiana, which Natural Earth files under France).
 */
export type RegionId = "CN" | "US" | "EU";

export type LonLat = [number, number];

export interface RegionView {
  /** [longitude, latitude] placed at the focus of the viewport when selected. */
  center: LonLat;
  /** Magnification relative to the resting map. */
  zoom: number;
}

export interface RegionSpec {
  id: RegionId;
  name: string;
  members: readonly string[];
  view: RegionView;
  /** Anchor of the readout on the resting map and which edge of the readout sits on it. */
  readoutAt: LonLat;
  readoutAlign: "center" | "end";
  lonSpan?: [number, number];
}

/** The 27 member states of the European Union (2026). Malta (470) is below the 1:110m resolution and absent from the data. */
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
  {
    id: "CN",
    name: "China",
    members: ["156"],
    view: { center: [104, 36], zoom: 2.6 },
    readoutAt: [103, 37],
    readoutAlign: "center",
  },
  {
    id: "US",
    name: "United States",
    members: ["840"],
    view: { center: [-98, 39], zoom: 2.4 },
    readoutAt: [-98, 40],
    readoutAlign: "center",
  },
  {
    id: "EU",
    name: "European Union",
    members: EU_MEMBERS,
    view: { center: [12, 53], zoom: 3.2 },
    // Europe is small on the resting map; the readout sits on the Atlantic, its right edge at the Irish coast.
    readoutAt: [-12, 51],
    readoutAlign: "end",
    lonSpan: [-32, 45],
  },
];

export function regionById(id: RegionId): RegionSpec {
  const spec = REGIONS.find((r) => r.id === id);
  if (!spec) throw new Error(`unknown region ${id}`);
  return spec;
}
