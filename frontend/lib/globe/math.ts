import { geoRotation } from "d3-geo";

export type Vec3 = [number, number, number];
export type LonLat = [number, number];
export type Rotate = [number, number] | [number, number, number];

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

/** Unit vector for a point on the sphere, in d3's convention: x towards lon 0 / lat 0, z towards the north pole. */
export function toCartesian(lon: number, lat: number): Vec3 {
  const cl = Math.cos(lat * RAD);
  return [cl * Math.cos(lon * RAD), cl * Math.sin(lon * RAD), Math.sin(lat * RAD)];
}

export function toLonLat([x, y, z]: Vec3): LonLat {
  return [Math.atan2(y, x) * DEG, Math.asin(Math.max(-1, Math.min(1, z))) * DEG];
}

/**
 * 3x3 row-major matrix that applies d3's `geoRotation(rotate)` to cartesian
 * unit vectors. Built from d3 itself (three basis vectors through the real
 * rotation) so the dot field and the d3-drawn outlines can never disagree.
 */
export function rotationMatrix(rotate: Rotate): Float64Array {
  const r = geoRotation(rotate as [number, number, number]);
  const m = new Float64Array(9);
  const basis: LonLat[] = [
    [0, 0],
    [90, 0],
    [0, 90],
  ];
  basis.forEach((p, col) => {
    const [lon, lat] = r(p);
    const [x, y, z] = toCartesian(lon, lat);
    m[col] = x;
    m[3 + col] = y;
    m[6 + col] = z;
  });
  return m;
}

/** Orthographic screen position of a rotated unit vector (d3 flips y). */
export function orthographicPoint(v: Vec3, scale: number, tx: number, ty: number): [number, number] {
  return [tx + scale * v[1], ty - scale * v[2]];
}

export function applyMatrix(m: Float64Array, v: Vec3): Vec3 {
  return [
    m[0] * v[0] + m[1] * v[1] + m[2] * v[2],
    m[3] * v[0] + m[4] * v[1] + m[5] * v[2],
    m[6] * v[0] + m[7] * v[1] + m[8] * v[2],
  ];
}

/** Angular distance between two points in degrees. */
export function angularDistance(a: LonLat, b: LonLat): number {
  const [x1, y1, z1] = toCartesian(a[0], a[1]);
  const [x2, y2, z2] = toCartesian(b[0], b[1]);
  return Math.acos(Math.max(-1, Math.min(1, x1 * x2 + y1 * y2 + z1 * z2))) * DEG;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/**
 * Evenly spread points over the sphere (Fibonacci lattice): uniform density,
 * but the spiral structure shows near the poles. Kept for tests and as an
 * alternative; the globe uses `latitudeRows`.
 */
export function fibonacciSphere(count: number): { lon: Float64Array; lat: Float64Array } {
  const lon = new Float64Array(count);
  const lat = new Float64Array(count);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * i + 1) / count;
    const radius = Math.sqrt(1 - y * y);
    const theta = i * golden;
    const x = radius * Math.cos(theta);
    const z = radius * Math.sin(theta);
    lon[i] = Math.atan2(z, x) * DEG;
    lat[i] = Math.asin(y) * DEG;
  }
  return { lon, lat };
}

/**
 * Dots on rows of constant latitude, the classic halftone-globe texture: rows
 * `spacing` degrees apart, columns `spacing` degrees of arc apart (so the
 * count per row shrinks with cos(lat)), every other row shifted by half a
 * step. Density stays even from the equator to the poles and the rows read
 * as a quiet grid instead of a spiral.
 */
export function latitudeRows(spacing: number): { lon: Float64Array; lat: Float64Array } {
  const rows = Math.max(1, Math.round(180 / spacing));
  const lons: number[] = [];
  const lats: number[] = [];
  for (let r = 0; r < rows; r++) {
    const lat = -90 + (r + 0.5) * (180 / rows);
    const circumference = 360 * Math.cos(lat * RAD);
    const columns = Math.max(1, Math.round(circumference / spacing));
    const step = 360 / columns;
    const phase = r % 2 === 0 ? 0 : step / 2;
    for (let c = 0; c < columns; c++) {
      const lon = -180 + phase + c * step;
      lons.push(lon >= 180 ? lon - 360 : lon);
      lats.push(lat);
    }
  }
  return { lon: Float64Array.from(lons), lat: Float64Array.from(lats) };
}
