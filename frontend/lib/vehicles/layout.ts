/**
 * Geometry shared by the landing page and the vehicle screen so a card's
 * drawing grows into the place it has on the next screen. CSS pixels; the
 * same numbers are written in globals.css (.workspace).
 */
export const STAGE_TOP = 112;
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
