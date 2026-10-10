/**
 * Vehicle drawing pipeline.
 *
 * Reads the line drawings in assets/vehicles/sources (brochure vector pages
 * for F70 and G60, the BMW press specification raster for G70), strips the
 * dimension annotations, crops the side and the top view, and writes per view:
 *
 *   public/vehicles/<code>-<view>.png    the lines as an alpha mask, tinted by CSS
 *   content/vehicles/<code>-<view>.json  the silhouette as dot runs on two grids
 *
 * The silhouette is found by flooding the outside of the closed outline; the
 * dot grids have a constant physical pitch (millimetres of car), so a card and
 * a magnified view can show the same car at two densities that nest.
 *
 *   node scripts/vehicles/build.mjs [--preview <dir>]
 *
 * --preview also writes a composite (dots under tinted lines) per view for a
 * visual check. Sources, licences and the extraction commands are listed in
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
/** Ink coverage above which a pixel is a line for the silhouette flood. */
const INK = 0.25;
/** Dot pitches in millimetres of car; the fine grid is half the coarse one so the two nest. */
const PITCHES_MM = { coarse: 64, fine: 32 };
/** Paper and ink levels of the press raster (grey 0..255). */
const PAPER = 235;
const BLACK = 70;

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
      side: { box: [215, 118, 300, 115], eraseRaster: [[0, 567, 1600, 613]] },
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

function cropSvg(svg, box, width) {
  const [x, y, w, h] = box;
  const height = Math.round((width * h) / w);
  const open = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="${x} ${y} ${w} ${h}">`;
  return svg.replace(/<svg\b[^>]*>/, open);
}

/** Ink coverage 0..1 per pixel, rendered on white so a page background does not count. */
async function inkFromSvg(svg, box) {
  const cropped = cropSvg(stripAnnotations(svg), box, RASTER_WIDTH);
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
  const ink = new Float32Array(resized.info.width * resized.info.height);
  for (let i = 0; i < ink.length; i++) ink[i] = resized.data[i * resized.info.channels] / 255;
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
  return { inside, bbox: [x0, y0, x1 + 1, y1 + 1], area };
}

/** Dot runs on a square grid: per row [j, i0, n, i0, n, ...], x = ox + i·pitch, y = oy + j·pitch. */
function dotGrid(inside, width, bbox, pitch) {
  const [x0, y0, x1, y1] = bbox;
  const ox = x0 + pitch / 2;
  const oy = y0 + pitch / 2;
  const rows = [];
  let count = 0;
  for (let j = 0; oy + j * pitch < y1; j++) {
    const y = Math.round(oy + j * pitch);
    const row = [j];
    let runStart = -1;
    let previous = -2;
    for (let i = 0; ox + i * pitch < x1; i++) {
      const x = Math.round(ox + i * pitch);
      if (inside[y * width + x] !== 1) continue;
      count++;
      if (i !== previous + 1) {
        if (runStart >= 0) row.push(runStart, previous - runStart + 1);
        runStart = i;
      }
      previous = i;
    }
    if (runStart >= 0) row.push(runStart, previous - runStart + 1);
    if (row.length > 1) rows.push(row);
  }
  return { pitch: round(pitch, 3), origin: [round(ox), round(oy)], rows, count };
}

function expandGrid(grid) {
  const points = [];
  for (const [j, ...runs] of grid.rows) {
    for (let r = 0; r < runs.length; r += 2) {
      for (let i = runs[r]; i < runs[r] + runs[r + 1]; i++) {
        points.push([grid.origin[0] + i * grid.pitch, grid.origin[1] + j * grid.pitch]);
      }
    }
  }
  return points;
}

/* ---------- outputs ---------- */

async function writeLines(file, { ink, width, height }) {
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < ink.length; i++) rgba[i * 4 + 3] = Math.round(ink[i] * 255);
  await sharp(rgba, { raw: { width, height, channels: 4 } }).png({ compressionLevel: 9 }).toFile(file);
}

async function writePreview(file, raster, grid) {
  const { ink, width, height } = raster;
  const r = grid.pitch * 0.3;
  const circles = expandGrid(grid)
    .map(([x, y]) => `<circle cx="${round(x, 1)}" cy="${round(y, 1)}" r="${round(r, 2)}"/>`)
    .join("");
  const dots = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><g fill="#9fb9e3">${circles}</g></svg>`);
  const lines = Buffer.alloc(width * height * 4);
  for (let i = 0; i < ink.length; i++) {
    lines[i * 4] = 28;
    lines[i * 4 + 1] = 105;
    lines[i * 4 + 2] = 212;
    lines[i * 4 + 3] = Math.round(ink[i] * 255);
  }
  await sharp({ create: { width, height, channels: 4, background: "#ffffff" } })
    .composite([{ input: dots }, { input: lines, raw: { width, height, channels: 4 } }])
    .png()
    .toFile(file);
}

async function buildView(vehicle, viewName, view) {
  const file = join(SOURCES, vehicle.source.file);
  const raster =
    vehicle.source.kind === "svg" ? await inkFromSvg(readFileSync(file, "utf8"), view.box) : await inkFromRaster(file, view);
  // The silhouette is flooded before any raster erase so a ground line touching the tyres still closes them.
  const { inside, bbox, area } = silhouette(raster);
  for (const [x0, y0, x1, y1] of view.eraseRaster ?? []) {
    for (let y = y0; y < Math.min(y1, raster.height); y++) {
      for (let x = x0; x < Math.min(x1, raster.width); x++) {
        raster.ink[y * raster.width + x] = 0;
        inside[y * raster.width + x] = 0;
      }
    }
  }
  const lengthPx = bbox[2] - bbox[0];
  const pxPerMm = lengthPx / vehicle.lengthMm;
  const grids = {};
  for (const [name, mm] of Object.entries(PITCHES_MM)) grids[name] = dotGrid(inside, raster.width, bbox, mm * pxPerMm);
  const fill = area / ((bbox[2] - bbox[0]) * (bbox[3] - bbox[1]));

  const base = `${vehicle.code}-${viewName}`;
  await writeLines(join(PUBLIC_OUT, `${base}.png`), raster);
  const record = {
    code: vehicle.code,
    name: vehicle.name,
    view: viewName,
    source: vehicle.source.note,
    lines: `/vehicles/${base}.png`,
    width: raster.width,
    height: raster.height,
    bbox,
    lengthMm: vehicle.lengthMm,
    pxPerMm: round(pxPerMm, 4),
    grids: Object.fromEntries(
      Object.entries(grids).map(([name, g]) => [name, { pitchMm: PITCHES_MM[name], pitch: g.pitch, origin: g.origin, rows: g.rows }]),
    ),
  };
  writeFileSync(join(CONTENT_OUT, `${base}.json`), JSON.stringify(record));
  if (previewDir) await writePreview(join(previewDir, `${base}.png`), raster, grids.fine);
  console.log(
    `${base}: ${String(raster.width)}x${String(raster.height)} px, bbox ${bbox.join(",")}, fill ${fill.toFixed(2)}, ` +
      `${String(grids.coarse.count)} coarse / ${String(grids.fine.count)} fine dots, ${(pxPerMm * 1000).toFixed(0)} px per metre`,
  );
  if (fill < 0.45) console.warn(`  warning: silhouette covers ${fill.toFixed(2)} of its box, the outline may leak`);
}

mkdirSync(PUBLIC_OUT, { recursive: true });
mkdirSync(CONTENT_OUT, { recursive: true });
if (previewDir) mkdirSync(previewDir, { recursive: true });
for (const vehicle of VEHICLES) {
  for (const [viewName, view] of Object.entries(vehicle.views)) await buildView(vehicle, viewName, view);
}
