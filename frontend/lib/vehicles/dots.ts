import type { DomainKey } from "@/lib/content/types";
import type { DotGrid, VehicleDrawing } from "./drawings";
import { zoneAt, type Zone } from "./zones";

/** The key under which dots outside every zone are grouped. */
export const UNZONED = "body";

export type RunGroups = Partial<Record<DomainKey | typeof UNZONED, string>>;

/** Every dot of a grid as raster coordinates (tests and previews). */
export function dotsOf(grid: DotGrid): [number, number][] {
  const points: [number, number][] = [];
  for (const [j, ...runs] of grid.rows) {
    const y = grid.origin[1] + j * grid.pitch;
    for (let r = 0; r + 1 < runs.length; r += 2) {
      for (let i = runs[r]; i < runs[r] + runs[r + 1]; i++) points.push([grid.origin[0] + i * grid.pitch, y]);
    }
  }
  return points;
}

/**
 * SVG path data per zone: one `M x y H x` subpath per run of dots that share
 * a zone, drawn with `stroke-dasharray="0 pitch"` and round caps so each dash
 * is a dot. A run is split where the zone changes; dots in no zone go to
 * UNZONED. Without zones everything is one group.
 */
export function runsByZone(drawing: VehicleDrawing, grid: DotGrid, zones: Zone[] = []): RunGroups {
  const [bx0, by0, bx1, by1] = drawing.bbox;
  const bw = bx1 - bx0;
  const bh = by1 - by0;
  const groups: Record<string, string[]> = {};
  const push = (key: string, y: number, x0: number, x1: number) => {
    (groups[key] ??= []).push(`M${fmt(x0)} ${fmt(y)}H${fmt(x1)}`);
  };
  for (const [j, ...runs] of grid.rows) {
    const y = grid.origin[1] + j * grid.pitch;
    for (let r = 0; r + 1 < runs.length; r += 2) {
      let key: string | null = null;
      let start = 0;
      for (let i = runs[r]; i < runs[r] + runs[r + 1]; i++) {
        const x = grid.origin[0] + i * grid.pitch;
        const zone = zones.length > 0 ? zoneAt(zones, (x - bx0) / bw, (y - by0) / bh) : null;
        const next = zone ?? UNZONED;
        if (key === null) {
          key = next;
          start = x;
        } else if (next !== key) {
          push(key, y, start, x - grid.pitch);
          key = next;
          start = x;
        }
      }
      if (key !== null) push(key, y, start, grid.origin[0] + (runs[r] + runs[r + 1] - 1) * grid.pitch);
    }
  }
  const out: RunGroups = {};
  for (const [key, parts] of Object.entries(groups)) out[key as keyof RunGroups] = parts.join("");
  return out;
}

function fmt(n: number): string {
  return String(Math.round(n * 10) / 10);
}
