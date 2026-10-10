/**
 * Vehicle drawing pipeline.
 *
 * Reads the line drawings in assets/vehicles/sources (brochure vector pages
 * for F70 and G60, the BMW press specification raster for G70), strips the
 * dimension annotations, crops the side and the top view, and writes per view
 * three alpha masks the UI tints with CSS tokens, stacked as layers:
 *
 *   public/vehicles/<code>-<view>-body.png     the silhouette (a flat wash)
 *   public/vehicles/<code>-<view>-lines.png    every line of the drawing (1600 px)
 *   public/vehicles/<code>-<view>-lines-small.png  the same lines at 520 px, thickened so they survive the card size
 *   public/vehicles/<code>-<view>-contour.png  the outer contour, heavier
 *   content/vehicles/<code>-<view>.json        size, silhouette box, scale, sources
 *
 * The silhouette is found by flooding the outside of the closed outline; the
 * contour is the silhouette's edge, so the body reads at a glance even where
 * the drawing's own lines are thin.
 *
 *   node scripts/vehicles/build.mjs [--preview <dir>]
 *
 * --preview also writes a composite of the three layers per view for a visual
 * check. Sources, licences and the extraction commands are listed in
 * assets/vehicles/sources/README.md.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCES = join(ROOT, "assets/vehicles/sources");
const PUBLIC_OUT = join(ROOT, "public/vehicles");
const CONTENT_OUT = join(ROOT, "content/vehicles");

/** Width of every rasterised view, px. Shown at most ~1100 px wide on screen. */
const RASTER_WIDTH = 1600;
/** Width of the small lines mask for the cards (shown at ~420 px), and the stroke floor that keeps its lines at least a pixel wide. */
const SMALL_WIDTH = 520;
const SMALL_MIN_STROKE_PT = 0.8;
/** Ink coverage above which a pixel is a line for the silhouette flood. */
const INK = 0.25;
/** Half-width of the outer contour and the feather of the body wash, px of the 1600 px raster. The contour is a thin edge, not a frame. */
const CONTOUR_RADIUS = 1;
const FEATHER = 0.6;
/** Paper and ink levels of the press raster (grey 0..255), and the gamma that thins its strokes. */
const PAPER = 235;
const BLACK = 70;
const RASTER_GAMMA = 1.6;

const argv = process.argv.slice(2);
const previewDir = argv.includes("--preview") ? argv[argv.indexOf("--preview") + 1] : null;

/**
 * Crop boxes are [x, y, width, height]: PDF points for vector pages, pixels
 * for the raster. `erase` shapes are in the source raster's pixel space and
 * cover the interior dimension arrows the vector filter cannot see;
 * `eraseRaster` rectangles are in the rendered view's pixel space.
 */
const VEHICLES = [
  {
    code: "F70",
    name: "BMW 1 Series",
    lengthMm: 4361,
    source: { kind: "svg", file: "F70-brochure-p21.svg", note: "docs/F70_OptionList.PDF page 21" },
    views: { side: { box: [222, 118, 285, 105] }, top: { box: [60, 255, 290, 150] } },
  },
  {
    code: "G60",
    name: "BMW 5 Series Sedan",
    lengthMm: 5060,
    source: { kind: "svg", file: "G60-brochure-p26.svg", note: "docs/G60_OptionList.PDF page 26" },
    views: {
      // The ground line shares a path with parts of the car, so it is erased after rasterising (raster px).
      side: { box: [215, 118, 300, 115], eraseRaster: [[0, 566, 1600, 613]] },
      top: { box: [50, 270, 300, 140] },
    },
  },
  {
    code: "G70",
    name: "BMW 7 Series",
    lengthMm: 5391,
    source: {
      kind: "png",
      file: "G70-press-specifications-p9.png",
      note: "BMW Group PressClub, The new BMW 7 Series, Specifications (04/2022), page 9",
    },
    views: {
      side: {
        box: [50, 582, 995, 289],
        erase: [
          { rect: [532, 612, 559, 674] },
          { rect: [733, 618, 763, 674] },
          { line: [540, 672, 524, 764] },
          { line: [737.5, 672, 701, 760] },
          { circle: [524, 761, 7] },
          { circle: [702, 757, 7] },
        ],
      },
      top: {
        box: [50, 1040, 995, 405],
        erase: [
          { rect: [502, 1226, 525, 1282] },
          { rect: [671, 1226, 696, 1282] },
          { line: [513, 1094, 513, 1410] },
          { line: [682.5, 1094, 682.5, 1410] },
          { rect: [508, 1094, 519, 1110] },
          { rect: [508, 1385, 519, 1410] },
          { rect: [677, 1094, 688, 1110] },
          { rect: [677, 1385, 688, 1410] },
        ],
      },
    },
  },
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const round = (v, places = 2) => Number(v.toFixed(places));

/* ---------- vector sources ---------- */

/**
 * Straight-only paths are dimension furniture: a single segment longer than
 * 25 pt is an arrow shaft, a path whose segments are all axis-aligned is a
 * dimension box, a ground line or a tick (ticks share a path with the line
 * as extra subpaths). Curved paths are the car.
 */
function isAnnotationLine(d) {
  if (/[CcQqAaSsTtHhVvmlz]/.test(d)) return false;
  const tokens = d.match(/[MLZ]|-?\d*\.?\d+/g) ?? [];
  let command = "";
  let point = null;
  let segments = 0;
  let axisAligned = true;
  let longest = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token === "M" || token === "L" || token === "Z") {
      command = token;
      continue;
    }
    const x = Number(token);
    const y = Number(tokens[++i]);
    if (command === "L" && point) {
      const dx = Math.abs(x - point[0]);
      const dy = Math.abs(y - point[1]);
      if (dx > 0.05 && dy > 0.05) axisAligned = false;
      longest = Math.max(longest, Math.hypot(dx, dy));
      segments++;
    }
    point = [x, y];
    if (command === "M") command = "L";
  }
  if (segments === 0) return false;
  return axisAligned || (segments === 1 && longest > 25);
}

/** Largest extent of a path's coordinates, pt. Control points count, which is fine for a size test. */
function extent(d) {
  const numbers = d.match(/-?\d*\.?\d+/g)?.map(Number) ?? [];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    minX = Math.min(minX, numbers[i]);
    maxX = Math.max(maxX, numbers[i]);
    minY = Math.min(minY, numbers[i + 1]);
    maxY = Math.max(maxY, numbers[i + 1]);
  }
  return Math.max(maxX - minX, maxY - minY);
}

/**
 * Remove glyphs, hairlines, arrowheads and straight dimension lines from a
 * pdftocairo page. Arrowheads are small black fills; the G60 page draws the
 * car itself as large black fills (outlined strokes), so size decides.
 */
const ARROWHEAD_PT = 4;

function stripAnnotations(svg) {
  // Clip paths are rectangles, which the straight-line rule would delete and so clip everything away.
  return svg
    .split(/(<clipPath\b[\s\S]*?<\/clipPath>)/)
    .map((part, index) => (index % 2 === 1 ? part : stripDrawingAnnotations(part)))
    .join("");
}

function stripDrawingAnnotations(svg) {
  return svg
    .replace(/<use\b[^>]*\/>/g, "")
    .replace(/<path\b[^>]*\/?>/g, (tag) => {
      const strokeWidth = /stroke-width="([^"]+)"/.exec(tag);
      if (strokeWidth && parseFloat(strokeWidth[1]) < 0.15) return "";
      const d = /\sd="([^"]+)"/.exec(tag)?.[1] ?? "";
      if (/fill="rgb\(0%, 0%, 0%\)"/.test(tag) && extent(d) < ARROWHEAD_PT) return "";
      if (d && isAnnotationLine(d)) return "";
      return tag;
    });
}

/** Raise every stroke to at least `minPt` and give filled drawing shapes a stroke, so a small render keeps whole lines. */
function thickenStrokes(svg, minPt) {
  return svg.replace(/<path\b[^>]*\/?>/g, (tag) => {
    const sw = /stroke-width="([^"]+)"/.exec(tag);
    if (sw) return parseFloat(sw[1]) < minPt ? tag.replace(sw[0], `stroke-width="${minPt}"`) : tag;
    if (/fill="rgb\(0%, 0%, 0%\)"/.test(tag) || !/fill=/.test(tag)) {
      return tag.replace("<path", `<path stroke="rgb(0%, 0%, 0%)" stroke-width="${(minPt * 0.6).toFixed(2)}" stroke-linejoin="round"`);
    }
    return tag;
  });
}

function cropSvg(svg, box, width) {
  const [x, y, w, h] = box;
  const height = Math.round((width * h) / w);
  const open = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="${x} ${y} ${w} ${h}">`;
  return svg.replace(/<svg\b[^>]*>/, open);
}

/** Ink coverage 0..1 per pixel, rendered on white so a page background does not count. */
async function inkFromSvg(svg, box, width = RASTER_WIDTH, minStrokePt = 0) {
  const stripped = stripAnnotations(svg);
  const cropped = cropSvg(minStrokePt > 0 ? thickenStrokes(stripped, minStrokePt) : stripped, box, width);
  const { data, info } = await sharp(Buffer.from(cropped))
    .flatten({ background: "#ffffff" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ink = new Float32Array(info.width * info.height);
  for (let i = 0; i < ink.length; i++) ink[i] = 1 - data[i * info.channels] / 255;
  return normalise(ink, info.width, info.height);
}

/* ---------- raster source ---------- */

function eraseShape(shape, left, top) {
  if (shape.rect) {
    const [x0, y0, x1, y1] = shape.rect;
    return `<rect x="${x0 - left}" y="${y0 - top}" width="${x1 - x0}" height="${y1 - y0}" fill="#fff"/>`;
  }
  if (shape.line) {
    const [x0, y0, x1, y1] = shape.line;
    return `<line x1="${x0 - left}" y1="${y0 - top}" x2="${x1 - left}" y2="${y1 - top}" stroke="#fff" stroke-width="6" stroke-linecap="round"/>`;
  }
  const [cx, cy, r] = shape.circle;
  return `<circle cx="${cx - left}" cy="${cy - top}" r="${r}" fill="#fff"/>`;
}

/** A smaller copy of an ink raster whose lines stay at least a pixel wide: dilate by one pixel, then resize. */
async function shrinkInk({ ink, width, height }, targetWidth) {
  const dilated = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let m = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
          const v = ink[yy * width + xx];
          if (v > m) m = v;
        }
      }
      dilated[y * width + x] = Math.round(m * 255);
    }
  }
  const targetHeight = Math.round((height * targetWidth) / width);
  const { data, info } = await sharp(dilated, { raw: { width, height, channels: 1 } })
    .resize(targetWidth, targetHeight, { kernel: "lanczos3" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  const out = new Float32Array(info.width * info.height);
  for (let i = 0; i < out.length; i++) out[i] = data[i * info.channels] / 255;
  return normalise(out, info.width, info.height);
}

async function inkFromRaster(file, view) {
  const [left, top, width, height] = view.box;
  const shapes = (view.erase ?? []).map((s) => eraseShape(s, left, top)).join("");
  const overlay = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${shapes}</svg>`);
  const { data, info } = await sharp(file)
    .extract({ left, top, width, height })
    .composite([{ input: overlay }])
    .flatten({ background: "#ffffff" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  // The erase overlay adds an alpha channel, so read with the stride sharp reports.
  const coverage = Buffer.alloc(info.width * info.height);
  for (let i = 0; i < coverage.length; i++) {
    coverage[i] = Math.round(255 * clamp((PAPER - data[i * info.channels]) / (PAPER - BLACK), 0, 1));
  }
  const outHeight = Math.round((info.height * RASTER_WIDTH) / info.width);
  const resized = await sharp(coverage, { raw: { width: info.width, height: info.height, channels: 1 } })
    .resize(RASTER_WIDTH, outHeight, { kernel: "lanczos3" })
    .raw()
    .toBuffer({ resolveWithObject: true });
  // sharp widens a one-channel raw image on resize; read with the stride it reports.
  // A gamma above 1 trims the soft shoulders of the upscaled raster strokes towards the vector weight.
  const ink = new Float32Array(resized.info.width * resized.info.height);
  for (let i = 0; i < ink.length; i++) ink[i] = Math.pow(resized.data[i * resized.info.channels] / 255, RASTER_GAMMA);
  return normalise(ink, resized.info.width, resized.info.height);
}

/** Scale so the darkest line is full ink; grey drawings then tint like black ones. */
function normalise(ink, width, height) {
  let max = 0;
  for (let i = 0; i < ink.length; i++) if (ink[i] > max) max = ink[i];
  if (max > 0 && max < 1) for (let i = 0; i < ink.length; i++) ink[i] = Math.min(1, ink[i] / max);
  return { ink, width, height };
}

/* ---------- silhouette and dots ---------- */

/** Flood the outside from the border; everything else, lines included, is the car. */
function silhouette({ ink, width, height }) {
  const wall = new Uint8Array(width * height);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (ink[y * width + x] < INK) continue;
      wall[y * width + x] = 1;
      if (x > 0) wall[y * width + x - 1] = 1;
      if (x < width - 1) wall[y * width + x + 1] = 1;
      if (y > 0) wall[(y - 1) * width + x] = 1;
      if (y < height - 1) wall[(y + 1) * width + x] = 1;
    }
  }
  const outside = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const push = (i) => {
    if (outside[i] || wall[i]) return;
    outside[i] = 1;
    queue[tail++] = i;
  };
  for (let x = 0; x < width; x++) {
    push(x);
    push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    push(y * width);
    push(y * width + width - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % width;
    if (x > 0) push(i - 1);
    if (x < width - 1) push(i + 1);
    if (i >= width) push(i - width);
    if (i + width < width * height) push(i + width);
  }
  // Lines count as inside (dots may sit on them); the box is measured on the
  // interior only, so a stray annotation line outside the car cannot widen it.
  const inside = new Uint8Array(width * height);
  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  let area = 0;
  for (let i = 0; i < inside.length; i++) {
    if (outside[i]) continue;
    inside[i] = 1;
    if (wall[i]) continue;
    area++;
    const x = i % width;
    const y = (i - x) / width;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return { inside, wall, bbox: [x0, y0, x1 + 1, y1 + 1], area };
}

/** The silhouette as a soft-edged alpha mask. */
function bodyMask(inside) {
  const alpha = new Float32Array(inside.length);
  for (let i = 0; i < inside.length; i++) alpha[i] = inside[i];
  return alpha;
}

/** The silhouette's edge, dilated to a line of 2 × CONTOUR_RADIUS px. */
function contourMask(inside, width, height) {
  const edge = new Uint8Array(inside.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      if (!inside[i]) continue;
      const open =
        x === 0 || y === 0 || x === width - 1 || y === height - 1 ||
        !inside[i - 1] || !inside[i + 1] || !inside[i - width] || !inside[i + width];
      if (open) edge[i] = 1;
    }
  }
  const r = Math.round(CONTOUR_RADIUS);
  const horizontal = new Uint8Array(inside.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!edge[y * width + x]) continue;
      for (let dx = -r; dx <= r; dx++) {
        const xx = x + dx;
        if (xx >= 0 && xx < width) horizontal[y * width + xx] = 1;
      }
    }
  }
  const alpha = new Float32Array(inside.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!horizontal[y * width + x]) continue;
      for (let dy = -r; dy <= r; dy++) {
        const yy = y + dy;
        if (yy >= 0 && yy < height) alpha[yy * width + x] = 1;
      }
    }
  }
  return alpha;
}

/* ---------- outputs ---------- */

async function writeAlpha(file, alpha, width, height, blur = 0) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < alpha.length; i++) rgba[i * 4 + 3] = Math.round(alpha[i] * 255);
  let image = sharp(rgba, { raw: { width, height, channels: 4 } });
  if (blur > 0) image = image.blur(blur);
  await image.png({ compressionLevel: 9 }).toFile(file);
}

function tinted(alpha, width, height, [r, g, b]) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < alpha.length; i++) {
    rgba[i * 4] = r;
    rgba[i * 4 + 1] = g;
    rgba[i * 4 + 2] = b;
    rgba[i * 4 + 3] = Math.round(alpha[i] * 255);
  }
  return { input: rgba, raw: { width, height, channels: 4 } };
}

/** The three layers composed as the UI shows them at rest: wash, lines, contour. */
async function writePreview(file, { width, height }, body, lines, contour) {
  await sharp({ create: { width, height, channels: 4, background: "#ffffff" } })
    .composite([
      tinted(body, width, height, [243, 245, 248]),
      tinted(lines, width, height, [95, 104, 115]),
      tinted(contour, width, height, [79, 88, 100]),
    ])
    .png()
    .toFile(file);
}

async function buildView(vehicle, viewName, view) {
  const file = join(SOURCES, vehicle.source.file);
  const raster =
    vehicle.source.kind === "svg" ? await inkFromSvg(readFileSync(file, "utf8"), view.box) : await inkFromRaster(file, view);
  // The silhouette is flooded before any raster erase so a ground line touching
  // the tyres still closes them; erased line pixels then leave the silhouette,
  // so the contour does not trace the ground line's remains.
  const { inside, wall, bbox, area } = silhouette(raster);
  for (const [x0, y0, x1, y1] of view.eraseRaster ?? []) {
    for (let y = y0; y < Math.min(y1, raster.height); y++) {
      for (let x = x0; x < Math.min(x1, raster.width); x++) {
        const i = y * raster.width + x;
        raster.ink[i] = 0;
        if (wall[i]) inside[i] = 0;
      }
    }
  }
  const { width, height } = raster;
  const body = bodyMask(inside);
  const contour = contourMask(inside, width, height);
  const lengthPx = bbox[2] - bbox[0];
  const pxPerMm = lengthPx / vehicle.lengthMm;
  const fill = area / ((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]));

  const base = `${vehicle.code}-${viewName}`;
  await writeAlpha(join(PUBLIC_OUT, `${base}-lines.png`), raster.ink, width, height);
  // Cards show the car at about a quarter of the raster width, where the thin lines would break up:
  // a small mask with thickened strokes (vector) or dilated lines (raster) keeps them whole.
  const small =
    vehicle.source.kind === "svg"
      ? await inkFromSvg(readFileSync(file, "utf8"), view.box, SMALL_WIDTH, SMALL_MIN_STROKE_PT)
      : await shrinkInk(raster, SMALL_WIDTH);
  for (const [x0, y0, x1, y1] of view.eraseRaster ?? []) {
    const f = small.width / width;
    for (let y = Math.floor(y0 * f); y < Math.min(Math.ceil(y1 * f), small.height); y++) {
      for (let x = Math.floor(x0 * f); x < Math.min(Math.ceil(x1 * f), small.width); x++) small.ink[y * small.width + x] = 0;
    }
  }
  await writeAlpha(join(PUBLIC_OUT, `${base}-lines-small.png`), small.ink, small.width, small.height);
  await writeAlpha(join(PUBLIC_OUT, `${base}-body.png`), body, width, height, FEATHER);
  await writeAlpha(join(PUBLIC_OUT, `${base}-contour.png`), contour, width, height, FEATHER);
  const record = {
    code: vehicle.code,
    name: vehicle.name,
    view: viewName,
    source: vehicle.source.note,
    layers: {
      body: `/vehicles/${base}-body.png`,
      lines: `/vehicles/${base}-lines.png`,
      linesSmall: `/vehicles/${base}-lines-small.png`,
      contour: `/vehicles/${base}-contour.png`,
    },
    width,
    height,
    bbox,
    lengthMm: vehicle.lengthMm,
    pxPerMm: round(pxPerMm, 4),
  };
  writeFileSync(join(CONTENT_OUT, `${base}.json`), JSON.stringify(record));
  if (previewDir) await writePreview(join(previewDir, `${base}.png`), raster, body, raster.ink, contour);
  console.log(
    `${base}: ${String(width)}x${String(height)} px, bbox ${bbox.join(",")}, fill ${fill.toFixed(2)}, ${(pxPerMm * 1000).toFixed(0)} px per metre`,
  );
  if (fill < 0.45) console.warn(`  warning: silhouette covers ${fill.toFixed(2)} of its box, the outline may leak`);
}

mkdirSync(PUBLIC_OUT, { recursive: true });
mkdirSync(CONTENT_OUT, { recursive: true });
if (previewDir) mkdirSync(previewDir, { recursive: true });
for (const vehicle of VEHICLES) {
  for (const [viewName, view] of Object.entries(vehicle.views)) await buildView(vehicle, viewName, view);
}
