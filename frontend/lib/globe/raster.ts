import { geoEquirectangular, geoPath } from "d3-geo";
import type { Feature, MultiPolygon } from "geojson";
import { DOT_LAND, DOT_REGION, DOT_SEA, type Classifier, type RegionShape } from "./data";

/**
 * Point classifier backed by a small equirectangular raster: land is painted
 * white, each market in its own red level, and a lookup is one pixel read.
 * Exact spherical containment for tens of thousands of sample points would
 * take seconds on the main thread; the raster takes milliseconds and is
 * accurate to about 0.18 degrees at 2048 pixels wide, below the dot spacing.
 */
export function createRasterClassifier(
  land: Feature<MultiPolygon>,
  regions: RegionShape[],
  width = 2048,
  height = 1024,
): Classifier {
  const canvas = typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(width, height) : document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true }) as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!context) throw new Error("2d context unavailable");

  const projection = geoEquirectangular()
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
  const path = geoPath(projection, context);

  context.clearRect(0, 0, width, height);
  context.fillStyle = "rgb(255 255 255)";
  context.beginPath();
  path(land);
  context.fill();

  regions.forEach((region, index) => {
    context.fillStyle = `rgb(${String(regionLevel(index))} 0 0)`;
    context.beginPath();
    path(region.feature);
    context.fill();
  });

  const pixels = context.getImageData(0, 0, width, height).data;
  const levels = regions.map((_, index) => regionLevel(index));

  return (lon, lat) => {
    const projected = projection([lon, lat]);
    if (!projected) return DOT_SEA;
    const x = Math.min(width - 1, Math.max(0, Math.round(projected[0])));
    const y = Math.min(height - 1, Math.max(0, Math.round(projected[1])));
    const offset = (y * width + x) * 4;
    const alpha = pixels[offset + 3];
    if (alpha < 128) return DOT_SEA;
    const green = pixels[offset + 1];
    if (green > 127) return DOT_LAND;
    const red = pixels[offset];
    let best = 0;
    let bestDistance = Infinity;
    levels.forEach((level, index) => {
      const distance = Math.abs(level - red);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = index;
      }
    });
    return DOT_REGION + best;
  };
}

/** Red level that encodes a region index; spread apart so anti-aliased edges still resolve. */
function regionLevel(index: number): number {
  return 60 + index * 60;
}
