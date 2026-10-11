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
 * The car is what the studio does not reach:
 *
 * 1. The studio is grown in from the image border. A pixel joins when every
 *    channel is within REACH of a reference colour carried along the growth
 *    (it follows the wall's and floor's slow gradients at RATE per pixel) and
 *    when it is brighter than STUDIO_LUMA. A car's rim, a step or a short ramp
 *    in colour stops it, and it never enters the dark shadow under the car, so
 *    it cannot run from there into the tyres and sills.
 * 2. Per car, measured on the source (2560 x 1646 px):
 *    - `guides`: lines on the outline where the car meets the wall with too
 *      little contrast to stop the growth (white paint, a windscreen showing
 *      the wall through it); the growth does not cross them.
 *    - `ground`: the body's lower edge from the front of the car to the rear,
 *      along the arch liners where the floor shows beside a tyre; below it are
 *      the floor and the car's shadow, so it is studio.
 *    - `wheels`: [x, y, r, tread] per tyre: an approximate circle, fitted to
 *      the wheel (see fitWheel), and how far the tread shows beyond the
 *      sidewall towards the camera's centre (+ right, - left), so a tyre is
 *      the circle swept over that distance. Nothing inside is cut by `ground`.
 *    - `horizon`: the row of the wall/floor joint, a thin dark line; its
 *      rows take the car's outline from the clean rows next to it.
 * 3. The car is the largest remaining component with its holes filled (glass
 *    that shows the studio through the cabin stays car). Its edge pixels get a
 *    soft alpha by projecting each between the studio colour beside it and
 *    the car colour inside it, and their colour is freed of the studio's, so
 *    anti-aliased rims keep their partial cover without a halo or a bite.
 *
 *   node scripts/vehicles/photos.mjs [--preview <dir>] [--mask <dir>]
 *
 * --preview writes each cut-out over white; --mask writes the source-sized
 * car mask, for checking the edge against the source.
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
/** Studio growth: the largest per-channel step from the reference colour, the reference's adaptation per pixel, and the darkest studio pixel (mean of the channels). */
const REACH = 12;
const RATE = 0.15;
const STUDIO_LUMA = 120;
/** Wheel fit: the least brightness step that counts as the rim's or the tyre's edge. */
const WHEEL_EDGE = 30;
/** Edge alpha: the least car/studio colour difference for which the projection is trusted, and the sampling ring around an edge pixel, px. */
const ALPHA_CONTRAST = 40;
const ALPHA_RING = 3;
/** Margin around the car in the cut-out, as a fraction of its width. */
const MARGIN = 0.015;

const argv = process.argv.slice(2);
const option = (name) => (argv.includes(name) ? argv[argv.indexOf(name) + 1] : null);
const previewDir = option("--preview");
const maskDir = option("--mask");

const PHOTOS = [
  {
    code: "F70",
    file: "F70-sideleft.webp",
    source: "BMW configurator (configure.bmw.de), F70 31GE, paint P0300, SIDELEFT desktop view, fetched 2026-10-10",
    wheels: [
      [457, 905, 109, 3],
      [1388, 905, 109, 0],
    ],
    // The flap ahead of the front tyre ends at y 962; the sill's last row is y 941-942 between its ends at x 594
    // and 1258, where the floor shows under the arch liners' slanted edges; the rear bumper is above y 935.
    ground: [[40, 963], [352, 963], [353, 942.5], [558, 942.5], [561, 955], [593, 937], [594, 942.5], [870, 942.5], [880, 941.5], [1180, 941.5], [1190, 942.5], [1258, 942.5], [1259, 940], [1270, 941], [1288, 960], [1720, 960]],
    guides: [
      // The nose below the headlight: white bumper on the white wall.
      [[214, 758], [209, 761], [208, 770], [204, 772], [199, 773], [198, 776], [198, 794], [197, 797], [197, 803], [196, 806], [196, 811], [195, 812], [195, 817], [194, 818], [194, 826], [193, 830], [193, 836]],
      // The bonnet's top from the nose, over the headlight, to the windscreen cowl.
      [[209, 761], [210, 751], [216, 747], [222, 742], [228, 740], [234, 737], [240, 734], [246, 729], [252, 726], [258, 723], [264, 720], [270, 717], [286, 710], [306, 702], [326, 695], [346, 689], [366, 684], [386, 681], [406, 677], [426, 675], [446, 672], [466, 670], [486, 667], [506, 665], [526, 663], [546, 660], [566, 658], [586, 655], [600, 654]],
      // The windscreen's outer edge: the glass shows the wall through it, a little greener.
      [[600, 654], [612, 654], [618, 653], [624, 651], [630, 647], [636, 644], [642, 639], [648, 636], [654, 633], [660, 629], [666, 626], [672, 623], [678, 619], [684, 615], [690, 612], [696, 609], [702, 605], [708, 603], [714, 599], [720, 595], [726, 593], [732, 589], [738, 586], [744, 583], [750, 579], [756, 577], [762, 574], [768, 570], [774, 567], [780, 564], [786, 561], [792, 558], [798, 556], [804, 553], [812, 548]],
      // The roof from the A-pillar to the spoiler: its lit top is a few levels off the wall.
      [[812, 548], [820, 545], [828, 541], [836, 539], [844, 536], [852, 535], [860, 532], [868, 531], [876, 529], [884, 528], [892, 526], [900, 524], [920, 522], [940, 521], [960, 519], [980, 517], [1000, 515], [1020, 515], [1040, 514], [1060, 514], [1080, 514], [1100, 514], [1120, 514], [1140, 515], [1160, 516], [1180, 516], [1200, 518], [1220, 523], [1240, 523], [1260, 522], [1280, 522], [1300, 520], [1320, 517], [1340, 522], [1360, 532], [1380, 535], [1400, 537], [1420, 541], [1440, 546], [1460, 549], [1480, 553], [1500, 557], [1505, 562]],
      // The tailgate and rear bumper from the spoiler's tip to the diffuser.
      [[1582, 648], [1589, 652], [1599, 656], [1603, 660], [1605, 664], [1608, 668], [1608, 700], [1607, 708], [1605, 716], [1603, 724], [1600, 732], [1600, 748], [1603, 756], [1605, 764], [1609, 772], [1613, 780], [1616, 788], [1620, 796], [1623, 804], [1626, 812], [1627, 820], [1627, 832], [1626, 848]],
    ],
    horizon: 825,
  },
  {
    code: "G60",
    file: "G60-sideleft.webp",
    source: "BMW configurator (configure.bmw.de), G60 71FJ, paint P0A90, SIDELEFT desktop view, fetched 2026-10-10",
    wheels: [
      [387, 898, 112, 11],
      [1367, 896, 112, -9],
    ],
    // The front lip ends at (253, 957), with floor between it and the tyre up to the arch liner; the sill's lit
    // lower chamfer runs at y 956-958 between its ends at x 530 and 1235, with floor between each end and its
    // tyre up to the mud flap; the rear bumper is above y 940.
    ground: [[40, 958], [253, 958], [257, 950], [277, 940], [300, 940], [301, 958], [492, 958], [493, 950.5], [497, 949.5], [500, 948.5], [503, 946.5], [506, 945.5], [509, 943.5], [512, 941.5], [527, 941.5], [528, 942.5], [529, 946.5], [530, 950.5], [531, 956.5], [560, 956.5], [610, 957.5], [660, 958.5], [1110, 958.5], [1135, 957.5], [1160, 956.5], [1234, 956.5], [1235, 939.5], [1237, 937.5], [1247, 937.5], [1250, 939.5], [1253, 941.5], [1256, 943.5], [1260, 945.5], [1264, 947.5], [1266, 950.5], [1267, 953], [1482, 953], [1483, 940], [1740, 940]],
    guides: [
      // The windscreen's outer edge above the A-pillar: the glass shows the wall through it, a little greyer.
      [[620, 657], [625, 656], [630, 653], [635, 650], [640, 646], [645, 643], [650, 641], [655, 638], [660, 634], [665, 632], [670, 629], [675, 626], [680, 623], [685, 620], [690, 617], [695, 614], [700, 611], [705, 608], [710, 605], [715, 602], [720, 598], [725, 596], [730, 594], [735, 591], [740, 589], [745, 586], [750, 583]],
    ],
    horizon: 825,
  },
  {
    code: "G70",
    file: "G70-sideleft.webp",
    source: "BMW configurator (configure.bmw.de), G70 61HZ, paint P0C36, SIDELEFT desktop view, fetched 2026-10-10",
    wheels: [
      [419, 1050, 105, 3],
      [1353, 1050, 105, 0],
    ],
    // The front bumper's corner ends at y 1122, with floor between its fin and the tyre up to the arch liner; the sill's
    // last row is y 1111-1114 between its ends at x 542 and 1228, with floor under the arch liners beside the tyres; the
    // rear bumper is above y 1100.
    ground: [[40, 1123], [299, 1123], [300, 1119], [304, 1115], [308, 1112], [312, 1110], [316, 1109], [320, 1108], [511, 1108], [512, 1112], [520, 1105], [541, 1105], [542, 1111.5], [560, 1112.5], [620, 1112.5], [630, 1114.5], [735, 1114.5], [745, 1113.5], [1190, 1113.5], [1205, 1111.5], [1228, 1111.5], [1229, 1108], [1255, 1108], [1262, 1122], [1440, 1122], [1441, 1101], [1720, 1101]],
    guides: [
      // The front's upper corner below the light strip: a lit, neutral surface against the warm wall.
      [[182, 910], [180, 915], [177, 918], [174, 920], [172, 922], [171, 924], [170, 928]],
    ],
    horizon: 1038,
  },
];

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** The 4-neighbours of pixel i, -1 where the image ends. */
function neighbours(i, width, size) {
  const x = i % width;
  return [x > 0 ? i - 1 : -1, x < width - 1 ? i + 1 : -1, i >= width ? i - width : -1, i + width < size ? i + width : -1];
}

/** Rasterise polylines into a mask, 8-connected, which a 4-connected growth cannot cross. */
function drawLines(lines, width, height) {
  const mask = new Uint8Array(width * height);
  for (const line of lines) {
    for (let k = 0; k + 1 < line.length; k++) {
      const [ax, ay] = line[k];
      const [bx, by] = line[k + 1];
      const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay), 1);
      for (let s = 0; s <= steps; s++) {
        const x = Math.round(ax + ((bx - ax) * s) / steps);
        const y = Math.round(ay + ((by - ay) * s) / steps);
        if (x >= 0 && y >= 0 && x < width && y < height) mask[y * width + x] = 1;
      }
    }
  }
  return mask;
}

/** Grow the studio from the image border; returns the reached mask. */
function growStudio(rgb, width, height, barrier) {
  const size = width * height;
  const studio = new Uint8Array(size);
  const ref = new Float32Array(size * 3);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  const seed = (i) => {
    if (studio[i] || barrier[i]) return;
    studio[i] = 1;
    for (let c = 0; c < 3; c++) ref[i * 3 + c] = rgb[i * 3 + c];
    queue[tail++] = i;
  };
  for (let x = 0; x < width; x++) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    seed(y * width);
    seed(y * width + width - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    for (const j of neighbours(i, width, size)) {
      if (j < 0 || studio[j] || barrier[j]) continue;
      const r = rgb[j * 3];
      const g = rgb[j * 3 + 1];
      const b = rgb[j * 3 + 2];
      if ((r + g + b) / 3 < STUDIO_LUMA) continue;
      if (Math.abs(r - ref[i * 3]) > REACH || Math.abs(g - ref[i * 3 + 1]) > REACH || Math.abs(b - ref[i * 3 + 2]) > REACH) continue;
      studio[j] = 1;
      ref[j * 3] = ref[i * 3] + RATE * (r - ref[i * 3]);
      ref[j * 3 + 1] = ref[i * 3 + 1] + RATE * (g - ref[i * 3 + 1]);
      ref[j * 3 + 2] = ref[i * 3 + 2] + RATE * (b - ref[i * 3 + 2]);
      queue[tail++] = j;
    }
  }
  return studio;
}

/** Bilinear brightness (mean of the channels) at a fractional position. */
function lumaAt(rgb, width, height, x, y) {
  const xi = clamp(Math.floor(x), 0, width - 2);
  const yi = clamp(Math.floor(y), 0, height - 2);
  const fx = clamp(x - xi, 0, 1);
  const fy = clamp(y - yi, 0, 1);
  const at = (xx, yy) => {
    const i = (yy * width + xx) * 3;
    return (rgb[i] + rgb[i + 1] + rgb[i + 2]) / 3;
  };
  return (at(xi, yi) * (1 - fx) + at(xi + 1, yi) * fx) * (1 - fy) + (at(xi, yi + 1) * (1 - fx) + at(xi + 1, yi + 1) * fx) * fy;
}

/**
 * Along each ray from (cx, cy) at the given angles, a brightness edge in
 * [r0, r1] (sign +1: dark inside to bright outside, -1: bright inside to dark
 * outside), as points: the steepest step, or with `first` the peak of the
 * first step of at least `least` outward. Rays without such a step give none.
 */
function rayEdges(rgb, width, height, [cx, cy], angles, [r0, r1], sign, least, first = false) {
  const points = [];
  for (const deg of angles) {
    const a = (deg * Math.PI) / 180;
    const c = Math.cos(a);
    const s = Math.sin(a);
    let best = 0;
    let bestR = -1;
    for (let r = r0; r <= r1; r += 0.25) {
      const step = sign * (lumaAt(rgb, width, height, cx + (r + 1.5) * c, cy + (r + 1.5) * s) - lumaAt(rgb, width, height, cx + (r - 1.5) * c, cy + (r - 1.5) * s));
      if (step > best) {
        best = step;
        bestR = r;
      } else if (first && best >= least && step < best) {
        break;
      }
    }
    if (best >= least) points.push([cx + bestR * c, cy + bestR * s]);
  }
  return points;
}

/** Least-squares circle through points, refitted without points more than 1.5 px off. */
function robustCircle(points, fallback) {
  let circle = fallback;
  let kept = points;
  for (let pass = 0; pass < 4 && kept.length >= 8; pass++) {
    circle = circleFit(kept);
    const [x, y, r] = circle;
    kept = points.filter(([px, py]) => Math.abs(Math.hypot(px - x, py - y) - r) <= 1.5);
  }
  return { circle, kept: kept.length };
}

/**
 * Fit a tyre. The alloy rim's outer lip is a bright ring around the whole
 * wheel, so its circle gives the hub centre. The tyre is concentric: on rays
 * left and right below the hub the first rise from dark rubber to something
 * brighter is the tyre's edge where the floor shows beside it, and rays
 * meeting the contact shadow or the wheel-arch liner first find that
 * shadow's outline further out, at radii that change with the angle. The
 * tyre's radius is therefore the densest cluster of these radii (most rays
 * within 1 px), averaged.
 */
function fitWheel(rgb, width, height, [cx, cy, r]) {
  const all = Array.from({ length: 180 }, (_, k) => k * 2);
  let centre = [cx, cy];
  let rim = { circle: [cx, cy, r * 0.72], kept: 0 };
  for (let pass = 0; pass < 3; pass++) {
    const points = rayEdges(rgb, width, height, centre, all, [r * 0.55, r * 0.9], -1, WHEEL_EDGE);
    rim = robustCircle(points, rim.circle);
    centre = rim.circle.slice(0, 2);
  }
  const sides = [...Array.from({ length: 56 }, (_, k) => 15 + k), ...Array.from({ length: 56 }, (_, k) => 110 + k)];
  const rimR = rim.circle[2];
  const radii = rayEdges(rgb, width, height, centre, sides, [rimR * 1.15, rimR * 1.6], 1, WHEEL_EDGE, true)
    .map(([x, y]) => Math.hypot(x - centre[0], y - centre[1]));
  let cluster = [];
  for (const candidate of radii) {
    const near = radii.filter((v) => Math.abs(v - candidate) <= 1);
    if (near.length > cluster.length) cluster = near;
  }
  const tyre = cluster.length ? cluster.reduce((s, v) => s + v, 0) / cluster.length : r;
  return { circle: [centre[0], centre[1], tyre], rim: rim.circle, rimPoints: rim.kept, tyrePoints: cluster.length };
}

/** Algebraic least-squares circle through points: x² + y² + Dx + Ey + F = 0. */
function circleFit(points) {
  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  let sz = 0;
  let sxz = 0;
  let syz = 0;
  const n = points.length;
  for (const [x, y] of points) {
    const z = x * x + y * y;
    sx += x;
    sy += y;
    sxx += x * x;
    syy += y * y;
    sxy += x * y;
    sz += z;
    sxz += x * z;
    syz += y * z;
  }
  // Normal equations for [D, E, F].
  const m = [
    [sxx, sxy, sx, -sxz],
    [sxy, syy, sy, -syz],
    [sx, sy, n, -sz],
  ];
  for (let col = 0; col < 3; col++) {
    let pivot = col;
    for (let row = col + 1; row < 3; row++) if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    for (let row = 0; row < 3; row++) {
      if (row === col) continue;
      const f = m[row][col] / m[col][col];
      for (let k = col; k < 4; k++) m[row][k] -= f * m[col][k];
    }
  }
  const D = m[0][3] / m[0][0];
  const E = m[1][3] / m[1][1];
  const F = m[2][3] / m[2][2];
  const x = -D / 2;
  const y = -E / 2;
  return [x, y, Math.sqrt(x * x + y * y - F)];
}

/** The ground line's height at column x, linear between its points; Infinity outside it. */
function groundAt(ground, x) {
  if (!ground || x < ground[0][0] || x > ground[ground.length - 1][0]) return Infinity;
  for (let k = 0; k + 1 < ground.length; k++) {
    const [ax, ay] = ground[k];
    const [bx, by] = ground[k + 1];
    if (x >= ax && x <= bx) return bx === ax ? Math.min(ay, by) : ay + ((by - ay) * (x - ax)) / (bx - ax);
  }
  return Infinity;
}

/** The largest 4-connected component of a mask. */
function largestComponent(mask, width) {
  const size = mask.length;
  const label = new Int32Array(size);
  const queue = new Int32Array(size);
  let best = 0;
  let bestSize = 0;
  let next = 0;
  for (let start = 0; start < size; start++) {
    if (!mask[start] || label[start]) continue;
    next++;
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    label[start] = next;
    while (head < tail) {
      const i = queue[head++];
      for (const j of neighbours(i, width, size)) {
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

/** Fill the holes of a mask: whatever the outside cannot reach becomes part of it. */
function fillHoles(mask, width, height) {
  const size = mask.length;
  const outside = new Uint8Array(size);
  const queue = new Int32Array(size);
  let head = 0;
  let tail = 0;
  const seed = (i) => {
    if (mask[i] || outside[i]) return;
    outside[i] = 1;
    queue[tail++] = i;
  };
  for (let x = 0; x < width; x++) {
    seed(x);
    seed((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    seed(y * width);
    seed(y * width + width - 1);
  }
  while (head < tail) {
    const i = queue[head++];
    for (const j of neighbours(i, width, size)) if (j >= 0) seed(j);
  }
  return outside.map((v) => (v ? 0 : 1));
}

/**
 * Alpha and colour for the car's edge pixels. B is the mean studio colour and
 * F the mean colour of the car's interior within ALPHA_RING; a pixel's alpha
 * is its colour projected on B→F, and its colour becomes what it would be over
 * nothing. Where car and studio are alike the projection is meaningless and
 * the pixel stays opaque.
 */
function edgeAlpha(rgb, car, width, height) {
  const size = car.length;
  const alpha = new Float32Array(size);
  const colour = Float32Array.from(rgb);
  const isEdge = (i) => {
    if (!car[i]) return false;
    for (const j of neighbours(i, width, size)) if (j >= 0 && !car[j]) return true;
    return false;
  };
  const edge = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    alpha[i] = car[i];
    if (isEdge(i)) edge[i] = 1;
  }
  for (let i = 0; i < size; i++) {
    if (!edge[i]) continue;
    const x = i % width;
    const y = (i - x) / width;
    const B = [0, 0, 0];
    const F = [0, 0, 0];
    let nb = 0;
    let nf = 0;
    for (let dy = -ALPHA_RING; dy <= ALPHA_RING; dy++) {
      for (let dx = -ALPHA_RING; dx <= ALPHA_RING; dx++) {
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
        const j = yy * width + xx;
        if (!car[j]) {
          for (let c = 0; c < 3; c++) B[c] += rgb[j * 3 + c];
          nb++;
        } else if (!edge[j] && Math.max(Math.abs(dx), Math.abs(dy)) >= 2) {
          for (let c = 0; c < 3; c++) F[c] += rgb[j * 3 + c];
          nf++;
        }
      }
    }
    if (!nb || !nf) continue;
    let dot = 0;
    let norm = 0;
    for (let c = 0; c < 3; c++) {
      B[c] /= nb;
      F[c] /= nf;
      dot += (rgb[i * 3 + c] - B[c]) * (F[c] - B[c]);
      norm += (F[c] - B[c]) ** 2;
    }
    if (Math.sqrt(norm) < ALPHA_CONTRAST) continue;
    const a = clamp(dot / norm, 0, 1);
    alpha[i] = a;
    for (let c = 0; c < 3; c++) colour[i * 3 + c] = a >= 0.3 ? clamp((rgb[i * 3 + c] - (1 - a) * B[c]) / a, 0, 255) : F[c];
  }
  return { alpha, colour };
}

async function cutOut(photo) {
  const file = join(SOURCES, photo.file);
  const { data: rgb, info } = await sharp(file).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const size = width * height;

  const wheels = photo.wheels.map((w) => ({ ...fitWheel(rgb, width, height, w), tread: w[3] ?? 0 }));
  for (const w of wheels) {
    console.log(`  ${photo.code} wheel ${w.circle.map((v) => v.toFixed(1)).join(", ")}; rim r ${w.rim[2].toFixed(1)} from ${String(w.rimPoints)} points, tyre from ${String(w.tyrePoints)}`);
  }
  // A tyre is its sidewall circle swept sideways over the visible tread: within r of the segment between the two centres.
  const inWheel = (x, y) =>
    wheels.some(({ circle: [cx, cy, r], tread }) => {
      const px = x + 0.5;
      const nearest = clamp(px, Math.min(cx, cx + tread), Math.max(cx, cx + tread));
      return Math.hypot(px - nearest, y + 0.5 - cy) <= r;
    });

  const barrier = drawLines(photo.guides, width, height);
  const studio = growStudio(rgb, width, height, barrier);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (y + 0.5 > groundAt(photo.ground, x) && !inWheel(x, y)) studio[y * width + x] = 1;
    }
  }
  if (photo.horizon !== null) {
    // The joint's rows take the state of the nearest clean row above or below, so the line goes and the car's edge runs on across it.
    const h = photo.horizon;
    for (let y = h - 2; y <= h + 2; y++) {
      const from = (y <= h ? h - 3 : h + 3) * width;
      for (let x = 0; x < width; x++) studio[y * width + x] = studio[from + x];
    }
  }
  let car = new Uint8Array(size);
  for (let i = 0; i < size; i++) car[i] = studio[i] ? 0 : 1;
  car = fillHoles(largestComponent(car, width), width, height);

  if (maskDir) {
    await sharp(Buffer.from(car.map((v) => v * 255)), { raw: { width, height, channels: 1 } }).png().toFile(join(maskDir, `${photo.code}-mask.png`));
  }

  let x0 = width;
  let y0 = height;
  let x1 = -1;
  let y1 = -1;
  for (let i = 0; i < size; i++) {
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

  const { alpha, colour } = edgeAlpha(rgb, car, width, height);
  const rgba = Buffer.alloc(cw * ch * 4);
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const si = (top + y) * width + (left + x);
      const o = (y * cw + x) * 4;
      rgba[o] = Math.round(colour[si * 3]);
      rgba[o + 1] = Math.round(colour[si * 3 + 1]);
      rgba[o + 2] = Math.round(colour[si * 3 + 2]);
      rgba[o + 3] = Math.round(alpha[si] * 255);
    }
  }

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
  const coverage = car.reduce((n, v) => n + v, 0) / size;
  console.log(`${photo.code}: car ${String(cw)}x${String(ch)} px of ${String(width)}x${String(height)}, coverage ${coverage.toFixed(3)}, out ${String(OUTPUT_WIDTH)}x${String(outHeight)}`);
}

mkdirSync(PUBLIC_OUT, { recursive: true });
mkdirSync(CONTENT_OUT, { recursive: true });
if (previewDir) mkdirSync(previewDir, { recursive: true });
if (maskDir) mkdirSync(maskDir, { recursive: true });
for (const photo of PHOTOS) await cutOut(photo);
