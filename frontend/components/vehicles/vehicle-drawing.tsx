import type { DomainKey } from "@/lib/content/types";
import type { VehicleDrawing as Drawing } from "@/lib/vehicles/drawings";
import type { Zone } from "@/lib/vehicles/zones";
import { cn } from "@/lib/utils";

/*
 * A vehicle as a layered sketch. Alpha masks from the pipeline are tinted
 * by tokens and stacked: the body as a flat wash, every line of the drawing
 * in a lighter ink, the outer contour on top in a heavier ink. Cards use
 * the small lines mask, whose strokes were thickened for that size, so the
 * drawing stays whole at a quarter of the raster width. With zones and heat,
 * soft radial washes clipped to the body tint each domain's place by its
 * complaint share, between the wash and the lines.
 */

export type DrawingSize = "card" | "stage";

export interface VehicleDrawingProps {
  drawing: Drawing;
  size: DrawingSize;
  zones?: Zone[];
  /** Emphasis per domain, 0..1. Zones without a value stay untinted. */
  heat?: Partial<Record<DomainKey, number>>;
  active?: DomainKey | null;
  className?: string;
}

const HEAT_FLOOR = 0.07;
const HEAT_CEILING = 0.82;
/** The wash reaches a little past its zone so neighbouring zones blend. */
const HEAT_SPREAD = 1.18;

function mask(url: string): React.CSSProperties {
  return { maskImage: `url(${url})`, WebkitMaskImage: `url(${url})` };
}

export function VehicleDrawing({ drawing, size, zones = [], heat, active = null, className }: VehicleDrawingProps) {
  const { width, height, bbox, layers } = drawing;
  const [x0, y0, x1, y1] = bbox;
  const bw = x1 - x0;
  const bh = y1 - y0;
  const heated = heat ? zones.filter((zone) => heat[zone.domain] !== undefined) : [];
  const gradientId = `heat-${drawing.code}-${drawing.view}`;
  return (
    <div className={cn("vehicle", className)} style={{ aspectRatio: `${String(width)} / ${String(height)}` }}>
      <span className="vehicle-layer vehicle-body" style={mask(layers.body)} />
      {heated.length > 0 ? (
        <svg className="vehicle-layer vehicle-heat" style={mask(layers.body)} viewBox={`0 0 ${String(width)} ${String(height)}`} aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id={gradientId}>
              <stop offset="0" stopColor="currentColor" stopOpacity="1" />
              <stop offset="0.55" stopColor="currentColor" stopOpacity="0.55" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </radialGradient>
          </defs>
          {heated.map((zone) => {
            const value = heat?.[zone.domain] ?? 0;
            const isActive = active === zone.domain;
            return zone.rects.map((rect, index) => (
              <ellipse
                key={`${zone.domain}-${String(index)}`}
                cx={x0 + ((rect[0] + rect[2]) / 2) * bw}
                cy={y0 + ((rect[1] + rect[3]) / 2) * bh}
                rx={(((rect[2] - rect[0]) / 2) * bw * HEAT_SPREAD)}
                ry={(((rect[3] - rect[1]) / 2) * bh * HEAT_SPREAD)}
                fill={`url(#${gradientId})`}
                data-zone={zone.domain}
                data-active={isActive ? "true" : undefined}
                style={{ opacity: isActive ? 1 : HEAT_FLOOR + (HEAT_CEILING - HEAT_FLOOR) * value }}
              />
            ));
          })}
        </svg>
      ) : null}
      <span className="vehicle-layer vehicle-lines" style={mask(size === "card" ? layers.linesSmall : layers.lines)} />
      <span className="vehicle-layer vehicle-contour" style={mask(layers.contour)} />
    </div>
  );
}
