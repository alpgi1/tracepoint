/**
 * Vehicle photo cut-outs.
 *
 * Reads the side-profile renders of the configured cars from the BMW
 * configurator's image service (assets/vehicles/photos, see its README),
 * lifts the car off the studio background and writes a tight transparent
 * cut-out per vehicle plus its size:
 *
 *   public/vehicles/<code>-photo-side.webp
 *   content/vehicles/<code>-photo.json
 *
 * The studio (wall, floor, the car's shadow) is warm: red exceeds blue by at
 * least 7 everywhere, at a brightness of 150 or more. The cars' paint, glass,
 * wheels and lights are not, so that one test separates them. The mask is
 * then cleaned: an opening removes specks, the largest component is the car,
 * its holes (warm reflections on the paint) are filled, a closing smooths
 * the edge, and the alpha is feathered by a pixel.
 *
 *   node scripts/vehicles/photos.mjs [--preview <dir>]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCES = join(ROOT, "assets/vehicles/photos");
const PUBLIC_OUT = join(ROOT, "public/vehicles");
const CONTENT_OUT = join(ROOT, "content/vehicles");

const OUTPUT_WIDTH = 1600;
/** Studio pixels: red minus blue at least WARM, at a brightness of at least BRIGHT. */
const WARM = 7;
const BRIGHT = 150;
/** Radii of the opening (specks) and the closing (notches), source px. */
const OPEN = 3;
const CLOSE = 4;
/** Margin around the car in the cut-out, as a fraction of its width. */
const MARGIN = 0.015;

const argv = process.argv.slice(2);
const previewDir = argv.includes("--preview") ? argv[argv.indexOf("--preview") + 1] : null;

const PHOTOS = [
  { code: "F70", file: "F70-sideleft.webp", source: "BMW configurator (configure.bmw.de), F70 31GE, paint P0300, SIDELEFT desktop view, fetched 2026-10-10" },
  { code: "G60", file: "G60-sideleft.webp", source: "BMW configurator (configure.bmw.de), G60 71FJ, paint P0A90, SIDELEFT desktop view, fetched 2026-10-10" },
  { code: "G70", file: "G70-sideleft.webp", source: "BMW configurator (configure.bmw.de), G70 61HZ, paint P0C36, SIDELEFT desktop view, fetched 2026-10-10" },
];

/** Separable box dilation (max filter) of a binary mask, radius r. */
function dilate(mask, width, height, r) {
  const tmp = new Uint8Array(mask.length);
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    for (let x = 0; x < width; x++) {
      let v = 0;
      for (let dx = -r; dx <= r && !v; dx++) {
        const xx = x + dx;
        if (xx >= 0 && xx < width && mask[row + xx]) v = 1;
      }
      tmp[row + x] = v;
    }
  }
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      for (let dy = -r; dy <= r && !v; dy++) {
        const yy = y + dy;
        if (yy >= 0 && yy < height && tmp[yy * width + x]) v = 1;
      }
      out[y * width + x] = v;
    }
  }
  return out;
}

function erode(mask, width, height, r) {
  const inverted = mask.map((v) => (v ? 0 : 1));
  return dilate(inverted, width, height, r).map((v) => (v ? 0 : 1));
}

/** Flood fill over `allowed` from the given seeds; returns the reached mask. */
function flood(allowed, width, seeds) {
  const reach = new Uint8Array(allowed.length);
  const queue = new Int32Array(allowed.length);
  let head = 0;
  let tail = 0;
  for (const s of seeds) {
    if (allowed[s] && !reach[s]) {
      reach[s] = 1;
      queue[tail++] = s;
    }
  }
  while (head < tail) {
    const i = queue[head++];
    const x = i % width;
    const n = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i >= width ? i - width : -1, i + width < allowed.length ? i + width : -1];
    for (const j of n) {
      if (j < 0 || reach[j] || !allowed[j]) continue;
      reach[j] = 1;
      queue[tail++] = j;
    }
  }
  return reach;
}

function borderSeeds(width, height) {
  const seeds = [];
  for (let x = 0; x < width; x++) seeds.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) seeds.push(y * width, y * width + width - 1);
  return seeds;
}

/** The largest connected component of a mask. */
function largestComponent(mask, width) {
  const label = new Int32Array(mask.length);
  const queue = new Int32Array(mask.length);
  let best = null;
  let bestSize = 0;
  let next = 0;
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || label[start]) continue;
    next++;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    label[start] = next;
    while (head < tail) {
      const i = queue[head++];
      const x = i % width;
      const n = [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i >= width ? i - width : -1, i + width < mask.length ? i + width : -1];
      for (const j of n) {
        if (j < 0 || !mask[j] || label[j]) continue;
        label[j] = next;
        queue[tail++] = j;
      }
    }
    if (tail > bestSize) {
      bestSize = tail;
      best = next;
    }
  }
  return mask.map((v, i) => (v && label[i] === best ? 1 : 0));
}

async function cutOut(photo) {
  const file = join(SOURCES, photo.file);
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let car = new Uint8Array(width * height);
  for (let i = 0; i < car.length; i++) {
    const r = data[i * channels];
    const g = data[i * channels + 1];
    const b = data[i * channels + 2];
    const studio = r - b >= WARM && (r + g + b) / 3 >= BRIGHT;
    car[i] = studio ? 0 : 1;
  }
  car = dilate(erode(car, width, height, OPEN), width, height, OPEN);
  car = largestComponent(car, width);
  const outside = flood(car.map((v) => (v ? 0 : 1)), width, borderSeeds(width, height));
  car = outside.map((v) => (v ? 0 : 1));
  car = erode(dilate(car, width, height, CLOSE), width, height, CLOSE);

  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let i = 0; i < car.length; i++) {
    if (!car[i]) continue;
    const x = i % width;
    const y = (i - x) / width;
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  const margin = Math.round((x1 - x0) * MARGIN);
  const left = Math.max(0, x0 - margin);
  const top = Math.max(0, y0 - margin);
  const right = Math.min(width - 1, x1 + margin);
  const bottom = Math.min(height - 1, y1 + margin);
  const cw = right - left + 1;
  const ch = bottom - top + 1;

  const rgba = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = (top + y) * width + (left + x);
      const o = (y * cw + x) * 4;
      rgba[o] = data[si * channels];
      rgba[o + 1] = data[si * channels + 1];
      rgba[o + 2] = data[si * channels + 2];
      rgba[o + 3] = car[si] ? 255 : 0;
    }
  }
  const alpha = await sharp(rgba, { raw: { width: cw, height: ch, channels: 4 } }).extractChannel(3).blur(0.8).raw().toBuffer();
  for (let i = 0; i < cw * ch; i++) rgba[i * 4 + 3] = alpha[i];

  const outHeight = Math.round((ch * OUTPUT_WIDTH) / cw);
  const image = sharp(rgba, { raw: { width: cw, height: ch, channels: 4 } }).resize(OUTPUT_WIDTH, outHeight, { kernel: "lanczos3" });
  const out = `${photo.code}-photo-side.webp`;
  await image.clone().webp({ quality: 88, alphaQuality: 90 }).toFile(join(PUBLIC_OUT, out));
  if (previewDir) {
    await sharp({ create: { width: OUTPUT_WIDTH, height: outHeight, channels: 4, background: "#ffffff" } })
      .composite([{ input: await image.clone().png().toBuffer() }])
      .png()
      .toFile(join(previewDir, `${photo.code}-photo.png`));
  }
  const record = {
    code: photo.code,
    view: "side",
    source: photo.source,
    src: `/vehicles/${out}`,
    width: OUTPUT_WIDTH,
    height: outHeight,
    carBox: [left, top, right + 1, bottom + 1],
    sourceSize: [width, height],
  };
  writeFileSync(join(CONTENT_OUT, `${photo.code}-photo.json`), JSON.stringify(record));
  const coverage = car.reduce((n, v) => n + v, 0) / car.length;
  console.log(`${photo.code}: car ${String(cw)}x${String(ch)} px of ${String(width)}x${String(height)}, coverage ${coverage.toFixed(3)}, out ${String(OUTPUT_WIDTH)}x${String(outHeight)}`);
}

mkdirSync(PUBLIC_OUT, { recursive: true });
mkdirSync(CONTENT_OUT, { recursive: true });
if (previewDir) mkdirSync(previewDir, { recursive: true });
for (const photo of PHOTOS) await cutOut(photo);
