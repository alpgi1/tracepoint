import type { CSSProperties } from "react";
import type { DomainKey } from "@/lib/content/types";
import type { VehicleDrawing as Drawing } from "@/lib/vehicles/drawings";
import type { Zone } from "@/lib/vehicles/zones";
import { cn } from "@/lib/utils";

/*
 * A vehicle as a layered sketch. Three alpha masks from the pipeline are
 * tinted by tokens and stacked: the body as a flat wash, every line of the
 * drawing in a lighter ink, the outer contour on top in a heavier ink. With
 * zones and heat, soft blue washes clipped to the body tint each domain's
 * place by its complaint share, between the wash and the lines.
 */

export interface VehicleDrawingProps {
  drawing: Drawing;
  zones?: Zone[];
  /** Emphasis per domain, 0..1. Zones without a value stay untinted. */
  heat?: Partial<Record<DomainKey, number>>;
  active?: DomainKey | null;
  className?: string;
}

const HEAT_FLOOR = 0.12;
const HEAT_CEILING = 0.7;
/** Blur of the heat edges, as a fraction of the raster width. */
const HEAT_BLUR = 0.012;

function mask(url: string): CSSProperties {
  return { maskImage: `url(${url})`, WebkitMaskImage: `url(${url})` };
}

export function VehicleDrawing({ drawing, zones = [], heat, active = null, className }: VehicleDrawingProps) {
  const { width, height, bbox, layers } = drawing;
  const [x0, y0, x1, y1] = bbox;
  const bw = x1 - x0;
  const bh = y1 - y0;
  const heated = heat ? zones.filter((zone) => heat[zone.domain] !== undefined) : [];
  const blurId = `heat-blur-${drawing.code}-${drawing.view}`;
  return (
    <div className={cn("vehicle", className)} style={{ aspectRatio: `${String(width)} / ${String(height)}` }}>
      <span className="vehicle-layer vehicle-body" style={mask(layers.body)} />
      {heated.length > 0 ? (
        <svg className="vehicle-layer vehicle-heat" style={mask(layers.body)} viewBox={`0 0 ${String(width)} ${String(height)}`} aria-hidden="true" focusable="false">
          <defs>
            <filter id={blurId} x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation={width * HEAT_BLUR} />
            </filter>
          </defs>
          <g filter={`url(#${blurId})`}>
            {heated.map((zone) => {
              const value = heat?.[zone.domain] ?? 0;
              const isActive = active === zone.domain;
              return zone.rects.map((rect, index) => (
                <rect
                  key={`${zone.domain}-${String(index)}`}
                  x={x0 + rect[0] * bw}
                  y={y0 + rect[1] * bh}
                  width={(rect[2] - rect[0]) * bw}
                  height={(rect[3] - rect[1]) * bh}
                  data-zone={zone.domain}
                  data-active={isActive ? "true" : undefined}
                  style={{ opacity: isActive ? 1 : HEAT_FLOOR + (HEAT_CEILING - HEAT_FLOOR) * value }}
                />
              ));
            })}
          </g>
        </svg>
      ) : null}
      <span className="vehicle-layer vehicle-lines" style={mask(layers.lines)} />
      <span className="vehicle-layer vehicle-contour" style={mask(layers.contour)} />
    </div>
  );
}
