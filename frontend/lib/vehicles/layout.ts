/**
 * Geometry shared by the landing page and the vehicle screen so a card's
 * drawing grows into the place it has on the next screen. CSS pixels; the
 * same numbers are written in globals.css (.workspace).
 */
/** Header row 112 px, the stage bar 48 px under a hairline, 16 px below it (step 14). */
export const STAGE_TOP = 112 + 1 + 48 + 16;
export const PAGE_PAD = 48;
export const ASIDE_WIDTH = 400;
export const COLUMN_GAP = 72;
export const STAGE_MAX_WIDTH = 1040;

export interface StageRect {
  left: number;
  top: number;
  width: number;
}

export function stageRect(viewportWidth: number): StageRect {
  const column = Math.max(320, viewportWidth - PAGE_PAD * 2 - COLUMN_GAP - ASIDE_WIDTH);
  const width = Math.min(STAGE_MAX_WIDTH, column);
  return { left: PAGE_PAD + (column - width) / 2, top: STAGE_TOP, width };
}

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface Sized {
  width: number;
  height: number;
}

interface Framed extends Sized {
  bbox: [number, number, number, number];
}

/**
 * Where the car photo sits on the vehicle screen: inside the stage, over the
 * drawing's silhouette box, the same length and top-aligned (roof on roof),
 * so the photo's shadow falls below the drawn ground. Mirrored by the
 * `.vehicle-photo` percentages set in the workspace.
 */
export function photoTarget(viewportWidth: number, drawing: Framed, photo: Sized): Box {
  const stage = stageRect(viewportWidth);
  const stageHeight = (stage.width * drawing.height) / drawing.width;
  const [x0, y0, x1] = drawing.bbox;
  const width = (stage.width * (x1 - x0)) / drawing.width;
  const height = (width * photo.height) / photo.width;
  const left = stage.left + (stage.width * x0) / drawing.width;
  const top = stage.top + (stageHeight * y0) / drawing.height;
  return { left, top, width, height };
}

/** The photo at full screen: most of the viewport's width, centred, never taller than four fifths of it. */
export function fullScreenTarget(viewportWidth: number, viewportHeight: number, photo: Sized): Box {
  let width = Math.min(viewportWidth * 0.9, 1500);
  let height = (width * photo.height) / photo.width;
  if (height > viewportHeight * 0.8) {
    height = viewportHeight * 0.8;
    width = (height * photo.width) / photo.height;
  }
  return { left: (viewportWidth - width) / 2, top: (viewportHeight - height) / 2, width, height };
}
