import type { VehicleDrawing as Drawing } from "@/lib/vehicles/drawings";
import { cn } from "@/lib/utils";

/*
 * A vehicle as a layered sketch. Alpha masks from the pipeline are tinted
 * by tokens and stacked: the body as a flat wash, every line of the drawing
 * in a mid grey, a thin outer contour one step darker. Cards use the small
 * lines mask, whose strokes were thickened for that size, so the drawing
 * stays whole at a quarter of the raster width.
 */

export type DrawingSize = "card" | "stage";

export interface VehicleDrawingProps {
  drawing: Drawing;
  size: DrawingSize;
  className?: string;
}

function mask(url: string): React.CSSProperties {
  return { maskImage: `url(${url})`, WebkitMaskImage: `url(${url})` };
}

export function VehicleDrawing({ drawing, size, className }: VehicleDrawingProps) {
  const { width, height, layers } = drawing;
  return (
    <div className={cn("vehicle", className)} style={{ aspectRatio: `${String(width)} / ${String(height)}` }}>
      <span className="vehicle-layer vehicle-body" style={mask(layers.body)} />
      <span className="vehicle-layer vehicle-lines" style={mask(size === "card" ? layers.linesSmall : layers.lines)} />
      <span className="vehicle-layer vehicle-contour" style={mask(layers.contour)} />
    </div>
  );
}
