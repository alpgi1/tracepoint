import type { CSSProperties } from "react";
import type { DomainKey } from "@/lib/content/types";
import { runsByZone, UNZONED } from "@/lib/vehicles/dots";
import type { Density, VehicleDrawing as Drawing } from "@/lib/vehicles/drawings";
import type { Zone } from "@/lib/vehicles/zones";
import { cn } from "@/lib/utils";

/*
 * A vehicle as dots and lines: the silhouette as a grid of dots (SVG, one
 * dashed path per run so it scales crisply) under the drawing's lines (a
 * PNG alpha mask tinted by the --vehicle-line token). With zones, the dots
 * of each domain form their own path, so a heat value per domain tints the
 * body where that domain lives. Colours are CSS tokens, see globals.css.
 */

export interface VehicleDrawingProps {
  drawing: Drawing;
  density: Density;
  zones?: Zone[];
  /** Emphasis per domain, 0..1. Zoned dots without a value keep the body colour. */
  heat?: Partial<Record<DomainKey, number>>;
  active?: DomainKey | null;
  className?: string;
}

const DOT_SCALE = 0.6; // dot diameter as a fraction of the pitch, like the map's dots
const HEAT_FLOOR = 0.18;

export function VehicleDrawing({ drawing, density, zones = [], heat, active = null, className }: VehicleDrawingProps) {
  const grid = drawing.grids[density];
  const groups = runsByZone(drawing, grid, zones);
  return (
    <div className={cn("vehicle", className)} style={{ aspectRatio: `${String(drawing.width)} / ${String(drawing.height)}` }}>
      <svg className="vehicle-dots" viewBox={`0 0 ${String(drawing.width)} ${String(drawing.height)}`} aria-hidden="true" focusable="false">
        <g fill="none" strokeWidth={grid.pitch * DOT_SCALE} strokeDasharray={`0 ${String(grid.pitch)}`} strokeLinecap="round">
          {Object.entries(groups).map(([key, d]) => {
            const value = key === UNZONED ? undefined : heat?.[key as DomainKey];
            const style = value === undefined ? undefined : ({ "--heat": HEAT_FLOOR + (1 - HEAT_FLOOR) * value } as CSSProperties);
            return (
              <path
                key={key}
                d={d}
                data-zone={key}
                data-heat={value === undefined ? undefined : "true"}
                data-active={active !== null && key === active ? "true" : undefined}
                style={style}
              />
            );
          })}
        </g>
      </svg>
      <span className="vehicle-lines" style={{ maskImage: `url(${drawing.lines})`, WebkitMaskImage: `url(${drawing.lines})` }} />
    </div>
  );
}
