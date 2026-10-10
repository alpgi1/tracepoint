import type { DomainKey } from "@/lib/content/types";
import type { DrawingView } from "./drawings";

/**
 * Where each requirement domain lives on the car, as rectangles in the
 * drawing's silhouette box: x from the front (0) to the rear (1), y from
 * the roof (0) to the ground (1) in the side view, across the body in the
 * top view. The zones are the team's approximation of where a customer
 * experiences a domain, not measured geometry; the silhouette clips them.
 * Zones never overlap (tested), since their heat washes would otherwise
 * stack. Domains without a place on the body (variants, general) have no
 * zone.
 */
export type Rect = [number, number, number, number];

export interface Zone {
  domain: DomainKey;
  rects: Rect[];
}

const SIDE: Zone[] = [
  { domain: "driver_assistance", rects: [[0, 0.45, 0.085, 0.95]] },
  { domain: "exterior_design", rects: [[0, 0.12, 0.085, 0.45], [0.3, 0, 0.75, 0.08], [0.93, 0.12, 1, 0.95]] },
  { domain: "powertrain_range_charging", rects: [[0.085, 0.28, 0.28, 0.55], [0.33, 0.8, 0.68, 0.93]] },
  { domain: "driving_dynamics", rects: [[0.085, 0.55, 0.33, 1], [0.68, 0.55, 0.93, 1]] },
  { domain: "infotainment_digital", rects: [[0.28, 0.08, 0.42, 0.55]] },
  { domain: "interior_comfort", rects: [[0.42, 0.08, 0.68, 0.55]] },
  { domain: "space_practicality", rects: [[0.68, 0.08, 0.93, 0.55]] },
  { domain: "quality_nvh", rects: [[0.33, 0.55, 0.68, 0.8]] },
];

const TOP: Zone[] = [
  { domain: "driver_assistance", rects: [[0, 0.1, 0.08, 0.9]] },
  { domain: "exterior_design", rects: [[0.08, 0, 0.95, 0.1], [0.08, 0.9, 0.95, 1], [0.95, 0.1, 1, 0.9]] },
  { domain: "powertrain_range_charging", rects: [[0.08, 0.1, 0.32, 0.9]] },
  { domain: "infotainment_digital", rects: [[0.32, 0.15, 0.42, 0.85]] },
  { domain: "interior_comfort", rects: [[0.42, 0.1, 0.72, 0.9]] },
  { domain: "space_practicality", rects: [[0.72, 0.1, 0.95, 0.9]] },
];

export const ZONES: Record<DrawingView, Zone[]> = { side: SIDE, top: TOP };

export function zoneAt(zones: Zone[], fx: number, fy: number): DomainKey | null {
  for (const zone of zones) {
    for (const [x0, y0, x1, y1] of zone.rects) {
      if (fx >= x0 && fx < x1 && fy >= y0 && fy < y1) return zone.domain;
    }
  }
  return null;
}

/** The zone's anchor for a leader line: the centre of its largest rectangle, as fractions of the silhouette box. */
export function zoneAnchor(zone: Zone): [number, number] {
  let best = zone.rects[0];
  let bestArea = 0;
  for (const rect of zone.rects) {
    const area = (rect[2] - rect[0]) * (rect[3] - rect[1]);
    if (area > bestArea) {
      best = rect;
      bestArea = area;
    }
  }
  return [(best[0] + best[2]) / 2, (best[1] + best[3]) / 2];
}
