import f70Side from "@/content/vehicles/F70-side.json";
import f70Top from "@/content/vehicles/F70-top.json";
import g60Side from "@/content/vehicles/G60-side.json";
import g60Top from "@/content/vehicles/G60-top.json";
import g70Side from "@/content/vehicles/G70-side.json";
import g70Top from "@/content/vehicles/G70-top.json";

/**
 * Drawings produced by scripts/vehicles/build.mjs: the lines as an alpha
 * mask PNG under public/vehicles and the silhouette as dot runs. Runs are
 * stored per grid row as [j, i0, n, i0, n, ...]: dot (i, j) sits at
 * origin + (i, j) · pitch in the raster's pixel space.
 */
export type DrawingCode = "F70" | "G60" | "G70";
export type DrawingView = "side" | "top";
export type Density = "coarse" | "fine";

export interface DotGrid {
  pitchMm: number;
  pitch: number;
  origin: [number, number];
  rows: number[][];
}

export interface VehicleDrawing {
  code: string;
  name: string;
  view: DrawingView;
  source: string;
  lines: string;
  width: number;
  height: number;
  bbox: [number, number, number, number];
  lengthMm: number;
  pxPerMm: number;
  grids: Record<Density, DotGrid>;
}

const DRAWINGS: Record<DrawingCode, Record<DrawingView, VehicleDrawing>> = {
  F70: { side: f70Side as VehicleDrawing, top: f70Top as VehicleDrawing },
  G60: { side: g60Side as VehicleDrawing, top: g60Top as VehicleDrawing },
  G70: { side: g70Side as VehicleDrawing, top: g70Top as VehicleDrawing },
};

export function drawingFor(code: DrawingCode, view: DrawingView): VehicleDrawing {
  return DRAWINGS[code][view];
}
