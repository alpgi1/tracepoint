import f70Side from "@/content/vehicles/F70-side.json";
import f70Top from "@/content/vehicles/F70-top.json";
import g60Side from "@/content/vehicles/G60-side.json";
import g60Top from "@/content/vehicles/G60-top.json";
import g70Side from "@/content/vehicles/G70-side.json";
import g70Top from "@/content/vehicles/G70-top.json";
import f70Photo from "@/content/vehicles/F70-photo.json";
import g60Photo from "@/content/vehicles/G60-photo.json";
import g70Photo from "@/content/vehicles/G70-photo.json";

/**
 * Drawings produced by scripts/vehicles/build.mjs: alpha masks per view
 * under public/vehicles (the body as a flat wash, every line of the drawing
 * at two sizes, the outer contour), tinted with CSS tokens and stacked as
 * layers, plus the silhouette box the zones are measured in.
 */
export type DrawingCode = "F70" | "G60" | "G70";
export type DrawingView = "side" | "top";

export interface VehicleDrawing {
  code: string;
  name: string;
  view: DrawingView;
  source: string;
  /** Alpha masks: the body wash, the lines at 1600 px, the same lines thickened at 520 px for cards, the outer contour. */
  layers: { body: string; lines: string; linesSmall: string; contour: string };
  width: number;
  height: number;
  /** Silhouette box in raster pixels: [x0, y0, x1, y1]. */
  bbox: [number, number, number, number];
  lengthMm: number;
  pxPerMm: number;
}

const DRAWINGS: Record<DrawingCode, Record<DrawingView, VehicleDrawing>> = {
  F70: { side: f70Side as VehicleDrawing, top: f70Top as VehicleDrawing },
  G60: { side: g60Side as VehicleDrawing, top: g60Top as VehicleDrawing },
  G70: { side: g70Side as VehicleDrawing, top: g70Top as VehicleDrawing },
};

export function drawingFor(code: DrawingCode, view: DrawingView): VehicleDrawing {
  return DRAWINGS[code][view];
}

/** A side-profile photo of the configured car, cut out by scripts/vehicles/photos.mjs. */
export interface VehiclePhoto {
  code: string;
  view: "side";
  source: string;
  src: string;
  width: number;
  height: number;
  carBox: [number, number, number, number];
  sourceSize: [number, number];
}

const PHOTOS: Record<DrawingCode, VehiclePhoto> = {
  F70: f70Photo as VehiclePhoto,
  G60: g60Photo as VehiclePhoto,
  G70: g70Photo as VehiclePhoto,
};

export function photoFor(code: DrawingCode): VehiclePhoto {
  return PHOTOS[code];
}

export const DRAWING_CODES: readonly DrawingCode[] = ["F70", "G60", "G70"];
