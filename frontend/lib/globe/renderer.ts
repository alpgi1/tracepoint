import { geoGraticule, geoOrthographic, geoPath, geoInterpolate, type GeoPermissibleObjects } from "d3-geo";
import { DOT_REGION, type GlobeData } from "./data";
import { applyMatrix, clamp, easeInOutCubic, easeOutExpo, rotationMatrix, type LonLat, type Vec3 } from "./math";
import type { RegionView } from "./regions";

/** Colours are read from CSS custom properties on the canvas so the globe follows the design tokens. */
export interface GlobeColors {
  sea: string;
  seaLight: string;
  rim: string;
  graticule: string;
  landLine: string;
  dot: string;
  dotMarket: string;
  signal: string;
}

export const GLOBE_COLOR_TOKENS: Record<keyof GlobeColors, string> = {
  sea: "--globe-sea",
  seaLight: "--globe-sea-light",
  rim: "--globe-rim",
  graticule: "--globe-graticule",
  landLine: "--globe-land-line",
  dot: "--globe-dot",
  dotMarket: "--globe-dot-market",
  signal: "--globe-signal",
};

export interface RendererOptions {
  reducedMotion: boolean;
  /** Globe radius as a fraction of the shorter canvas side. */
  fill: number;
  /** Lowest vertical rotation (looking from the south) and highest (from the north), degrees. */
  tiltRange: [number, number];
}

interface Flight {
  from: { center: LonLat; scale: number };
  to: { center: LonLat; scale: number };
  start: number;
  duration: number;
  ease: (t: number) => number;
  interpolate: (t: number) => LonLat;
  onDone?: () => void;
}

const DEFAULTS: RendererOptions = { reducedMotion: false, fill: 0.46, tiltRange: [-55, 72] };
const GLOW_IN = 1 / 180; // full glow in 180 ms
const GLOW_OUT = 1 / 320; // fades out slower than it comes in
const INERTIA_DECAY = 1 / 160; // velocity halves about every 110 ms
const INERTIA_STOP = 0.015; // degrees per ms

/**
 * Draws and animates the dotted globe on a 2d canvas. Pure TypeScript, no
 * React: the component feeds it pointer events and props, the renderer owns
 * rotation, zoom, glow and animation state and only paints when something
 * changed.
 */
export class GlobeRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private readonly projection = geoOrthographic().clipAngle(90);
  private readonly path = geoPath(this.projection);
  private readonly graticule = geoGraticule().step([15, 15])();
  private data: GlobeData | null = null;
  private colors: GlobeColors | null = null;
  private width = 0;
  private height = 0;
  private baseScale = 1;
  private center: LonLat = [0, 0];
  private zoom = 1;
  private hover = -1;
  private selected = -1;
  private glow: number[] = [];
  private flight: Flight | null = null;
  private velocity: [number, number] | null = null;
  private frame = 0;
  private lastTick = 0;
  private options: RendererOptions;

  constructor(options: Partial<RendererOptions> = {}) {
    this.options = { ...DEFAULTS, ...options };
  }

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.path.context(this.context);
    this.readColors();
  }

  destroy() {
    cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.flight = null;
    this.velocity = null;
    this.canvas = null;
    this.context = null;
  }

  setOptions(options: Partial<RendererOptions>) {
    this.options = { ...this.options, ...options };
  }

  /** Re-read the colour tokens; call after a theme change. */
  readColors() {
    if (!this.canvas) return;
    const style = getComputedStyle(this.canvas);
    const read = (token: string) => style.getPropertyValue(token).trim();
    const entries = Object.entries(GLOBE_COLOR_TOKENS) as [keyof GlobeColors, string][];
    const colors = {} as GlobeColors;
    for (const [key, token] of entries) {
      const value = read(token);
      colors[key] = value === "" ? "rgb(128 128 128)" : value;
    }
    this.colors = colors;
    this.requestRender();
  }

  resize(width: number, height: number, dpr: number) {
    if (!this.canvas || !this.context) return;
    this.width = width;
    this.height = height;
    this.canvas.width = Math.round(width * dpr);
    this.canvas.height = Math.round(height * dpr);
    this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.baseScale = Math.min(width, height) * this.options.fill;
    this.projection.translate([width / 2, height / 2]);
    this.applyView();
    this.render();
  }

  setData(data: GlobeData) {
    this.data = data;
    this.glow = data.regions.map(() => 0);
    this.requestRender();
  }

  get ready(): boolean {
    return this.data !== null;
  }

  /** Current view, so the component can position HTML labels. */
  get view(): { center: LonLat; zoom: number } {
    return { center: [...this.center] as LonLat, zoom: this.zoom };
  }

  setView(view: RegionView) {
    this.center = [...view.center];
    this.zoom = view.zoom;
    this.applyView();
    this.requestRender();
  }

  setHover(index: number) {
    if (this.hover === index) return;
    this.hover = index;
    this.startLoop();
  }

  setSelected(index: number) {
    if (this.selected === index) return;
    this.selected = index;
    this.startLoop();
  }

  /** Rotate by screen-space deltas; a pixel at the centre is about 1/scale radians. */
  rotateBy(dx: number, dy: number) {
    this.flight = null;
    const degreesPerPixel = (180 / Math.PI) / (this.baseScale * this.zoom);
    const [lonMin, lonMax] = this.options.tiltRange;
    this.center = [
      normalizeLon(this.center[0] - dx * degreesPerPixel),
      clamp(this.center[1] + dy * degreesPerPixel, lonMin, lonMax),
    ];
    this.applyView();
    this.requestRender();
  }

  /** Let the globe coast after a drag; velocity in degrees per millisecond. */
  coast(velocity: [number, number]) {
    if (this.options.reducedMotion) return;
    const speed = Math.hypot(velocity[0], velocity[1]);
    if (speed < INERTIA_STOP) return;
    this.velocity = velocity;
    this.startLoop();
  }

  stopCoasting() {
    this.velocity = null;
  }

  /** Coast from a pointer velocity in pixels per millisecond. */
  coastFromPixels(vx: number, vy: number) {
    const degreesPerPixel = (180 / Math.PI) / (this.baseScale * this.zoom);
    this.coast([-vx * degreesPerPixel, vy * degreesPerPixel]);
  }

  /** Fly the camera to a view; instant under reduced motion. */
  flyTo(view: RegionView, duration = 1100, ease: (t: number) => number = easeInOutCubic, onDone?: () => void) {
    this.velocity = null;
    if (this.options.reducedMotion || duration <= 0) {
      this.setView(view);
      onDone?.();
      return;
    }
    const from = { center: [...this.center] as LonLat, scale: this.zoom };
    const to = { center: [...view.center] as LonLat, scale: view.zoom };
    this.flight = {
      from,
      to,
      start: performance.now(),
      duration,
      ease,
      interpolate: geoInterpolate(from.center, to.center),
      onDone,
    };
    this.startLoop();
  }

  /** One-time settle from slightly off the resting view; it is the entrance, not a loop. */
  enter(view: RegionView) {
    if (this.options.reducedMotion) {
      this.setView(view);
      return;
    }
    this.setView({ center: [view.center[0] - 26, view.center[1] - 10], zoom: view.zoom * 0.96 });
    this.flyTo(view, 1500, easeOutExpo);
  }

  /** Which region (index) lies under a canvas point, -1 for none. */
  pick(x: number, y: number): number {
    if (!this.data) return -1;
    const inverted = this.projection.invert?.([x, y]);
    if (!inverted || Number.isNaN(inverted[0]) || Number.isNaN(inverted[1])) return -1;
    const kind = this.data.classify(inverted[0], inverted[1]);
    return kind >= DOT_REGION ? kind - DOT_REGION : -1;
  }

  /** Whether a canvas point is on the globe disc at all. */
  onDisc(x: number, y: number): boolean {
    const dx = x - this.width / 2;
    const dy = y - this.height / 2;
    return Math.hypot(dx, dy) <= this.baseScale * this.zoom;
  }

  requestRender() {
    if (this.frame !== 0) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.render();
    });
  }

  private startLoop() {
    if (this.frame !== 0) return;
    this.lastTick = performance.now();
    const loop = (now: number) => {
      this.frame = 0;
      const dt = Math.min(50, now - this.lastTick);
      this.lastTick = now;
      const animating = this.step(now, dt);
      this.render();
      if (animating) this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  /** Advance animations; returns true while anything still moves. */
  private step(now: number, dt: number): boolean {
    let busy = false;

    if (this.flight) {
      const { start, duration, ease, interpolate, from, to, onDone } = this.flight;
      const t = clamp((now - start) / duration, 0, 1);
      const e = ease(t);
      this.center = interpolate(e);
      this.zoom = from.scale + (to.scale - from.scale) * e;
      this.applyView();
      if (t >= 1) {
        this.flight = null;
        onDone?.();
      } else busy = true;
    }

    if (this.velocity) {
      const [vx, vy] = this.velocity;
      const [lonMin, lonMax] = this.options.tiltRange;
      this.center = [normalizeLon(this.center[0] + vx * dt), clamp(this.center[1] + vy * dt, lonMin, lonMax)];
      this.applyView();
      const decay = Math.exp(-dt * INERTIA_DECAY);
      this.velocity = [vx * decay, vy * decay];
      if (Math.hypot(this.velocity[0], this.velocity[1]) < INERTIA_STOP) this.velocity = null;
      else busy = true;
    }

    const instant = this.options.reducedMotion;
    this.glow = this.glow.map((value, index) => {
      const target = index === this.hover || index === this.selected ? 1 : 0;
      if (instant) return target;
      const speed = target > value ? GLOW_IN : GLOW_OUT;
      const next = value + Math.sign(target - value) * Math.min(Math.abs(target - value), dt * speed);
      if (next !== target) busy = true;
      return next;
    });

    return busy;
  }

  private applyView() {
    this.projection.rotate([-this.center[0], -this.center[1], 0]).scale(this.baseScale * this.zoom);
  }

  render() {
    const ctx = this.context;
    const colors = this.colors;
    if (!ctx || !colors || this.width === 0) return;
    const { width, height } = this;
    const cx = width / 2;
    const cy = height / 2;
    const scale = this.baseScale * this.zoom;

    ctx.clearRect(0, 0, width, height);

    // Sphere: a quiet radial gradient gives volume without a glow.
    const gradient = ctx.createRadialGradient(cx - scale * 0.38, cy - scale * 0.42, scale * 0.05, cx, cy, scale);
    gradient.addColorStop(0, colors.seaLight);
    gradient.addColorStop(1, colors.sea);
    ctx.beginPath();
    ctx.arc(cx, cy, scale, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = colors.rim;
    ctx.stroke();

    if (!this.data) return;
    const { land, regions } = this.data;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    this.strokePath(this.graticule, colors.graticule, 1, 1);
    this.strokePath(land, colors.landLine, 1, 1);

    // Resting outlines mark the three markets as the places to go.
    regions.forEach((region, index) => {
      const g = this.glow[index];
      if (g < 1) this.strokePath(region.feature, colors.signal, 1, 0.3 * (1 - g));
    });

    this.drawDots(scale);

    // Hovered or selected market: soft fill, a wide faint stroke and a crisp edge.
    regions.forEach((region, index) => {
      const g = this.glow[index];
      if (g <= 0) return;
      ctx.beginPath();
      this.path(region.feature);
      ctx.globalAlpha = 0.1 * g;
      ctx.fillStyle = colors.signal;
      ctx.fill();
      ctx.globalAlpha = 0.16 * g;
      ctx.strokeStyle = colors.signal;
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.globalAlpha = 0.3 + 0.7 * g;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  private strokePath(object: GeoPermissibleObjects, color: string, lineWidth: number, alpha: number) {
    const ctx = this.context;
    if (!ctx) return;
    ctx.beginPath();
    this.path(object);
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  /**
   * Dots are unit vectors rotated by a matrix equivalent to d3's rotation,
   * so projecting one is nine multiplications. Batched by colour and depth
   * bucket into a handful of fills per frame.
   */
  private drawDots(scale: number) {
    const ctx = this.context;
    const colors = this.colors;
    if (!ctx || !colors || !this.data) return;
    const { dots } = this.data;
    const m = rotationMatrix(this.projection.rotate());
    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = 1.2 * Math.pow(this.zoom, 0.35);
    const buckets = 4;
    const groups: { color: string; alpha: number; size: number; points: number[] }[] = [];
    const groupIndex = new Map<string, number>();

    const push = (key: string, color: string, alpha: number, size: number, x: number, y: number) => {
      let gi = groupIndex.get(key);
      if (gi === undefined) {
        gi = groups.length;
        groupIndex.set(key, gi);
        groups.push({ color, alpha, size, points: [] });
      }
      groups[gi].points.push(x, y);
    };

    for (let i = 0; i < dots.count; i++) {
      const v: Vec3 = [dots.xyz[i * 3], dots.xyz[i * 3 + 1], dots.xyz[i * 3 + 2]];
      const r = applyMatrix(m, v);
      if (r[0] <= 0) continue; // back of the globe
      const x = cx + scale * r[1];
      const y = cy - scale * r[2];
      if (x < -4 || y < -4 || x > this.width + 4 || y > this.height + 4) continue;
      const depth = Math.min(buckets - 1, Math.floor(r[0] * buckets));
      const depthAlpha = 0.4 + (0.6 * (depth + 1)) / buckets;
      const kind = dots.kind[i];
      if (kind >= DOT_REGION) {
        const g = this.glow[kind - DOT_REGION] ?? 0;
        if (g > 0) {
          push(`s${String(depth)}`, colors.signal, depthAlpha * (0.55 + 0.45 * g), radius * (1 + 0.35 * g), x, y);
          continue;
        }
        push(`m${String(depth)}`, colors.dotMarket, depthAlpha, radius, x, y);
      } else {
        push(`d${String(depth)}`, colors.dot, depthAlpha, radius, x, y);
      }
    }

    for (const group of groups) {
      ctx.beginPath();
      const { points, size } = group;
      for (let p = 0; p < points.length; p += 2) {
        ctx.moveTo(points[p] + size, points[p + 1]);
        ctx.arc(points[p], points[p + 1], size, 0, Math.PI * 2);
      }
      ctx.globalAlpha = group.alpha;
      ctx.fillStyle = group.color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function normalizeLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}
