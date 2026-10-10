import { geoNaturalEarth1, geoPath } from "d3-geo";
import type { GeoPermissibleObjects } from "d3-geo";
import { KIND_LAND, KIND_REGION, KIND_SEA, type MapData } from "./data";
import type { RegionView } from "./regions";

/** Colours are read from CSS custom properties on the canvas so the map follows the tokens. */
export interface MapColors {
  dot: string;
  dotMarket: string;
  accent: string;
}

export const MAP_COLOR_TOKENS: Record<keyof MapColors, string> = {
  dot: "--map-dot",
  dotMarket: "--map-dot-market",
  accent: "--map-accent",
};

export interface RendererOptions {
  reducedMotion: boolean;
  /** Space between the map and the canvas edge, CSS pixels. */
  padding: number;
  /** Called after a resize or a finished flight, when screen positions have settled. */
  onSettle?: () => void;
}

interface Transform {
  k: number;
  tx: number;
  ty: number;
}

interface Flight {
  from: { center: [number, number]; k: number };
  to: { center: [number, number]; k: number };
  start: number;
  duration: number;
}

interface Mask {
  width: number;
  height: number;
  pixels: Uint8ClampedArray;
}

interface DotField {
  count: number;
  x: Float32Array;
  y: Float32Array;
  kind: Uint8Array;
}

const DEFAULTS: RendererOptions = { reducedMotion: false, padding: 48 };
const GLOW_IN = 1 / 180; // full highlight in 180 ms
const GLOW_OUT = 1 / 320; // fades out slower than it comes in
const FLIGHT_MS = 900;
const SPHERE: GeoPermissibleObjects = { type: "Sphere" };

/**
 * Mask colours. Land paints the blue channel, each market paints one
 * combination of the red and green channels, all composited additively.
 * Anti-aliased edge pixels then decode by a 50 % coverage threshold per
 * channel instead of blending into a neighbouring class. Three markets fit
 * in two channels; more would need a second mask.
 */
const MAX_REGIONS = 3;
const REGION_PAINT = ["rgb(255,0,0)", "rgb(0,255,0)", "rgb(255,255,0)"];
const LAND_PAINT = "rgb(0,0,255)";
const COVERED = 128;

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Draws the dotted world map on a 2d canvas. Pure TypeScript, no React: the
 * component feeds it pointer events and props; the renderer owns the fit,
 * the dot field, the zoom transform, the highlight and the animation, and
 * only paints when something changed.
 *
 * Geometry is projected once with a Natural Earth projection fitted to the
 * canvas (`base`). Dots sit on a square screen-space grid over the land of
 * that fit, like a printed halftone. Zooming is an affine transform applied
 * to the base coordinates, so the dot pattern simply magnifies; the market
 * outlines are drawn with a second projection (`view`) carrying the same
 * transform, so both always agree.
 */
export class MapRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private readonly base = geoNaturalEarth1();
  private readonly view = geoNaturalEarth1();
  private readonly path = geoPath(this.view);
  private data: MapData | null = null;
  private colors: MapColors | null = null;
  private width = 0;
  private height = 0;
  private mask: Mask | null = null;
  private dots: DotField | null = null;
  private spacing = 6;
  private transform: Transform = { k: 1, tx: 0, ty: 0 };
  private hover = -1;
  private selected = -1;
  private glow: number[] = [];
  private flight: Flight | null = null;
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
    this.canvas = null;
    this.context = null;
  }

  setOptions(options: Partial<RendererOptions>) {
    this.options = { ...this.options, ...options };
  }

  get ready(): boolean {
    return this.data !== null && this.dots !== null;
  }

  readColors() {
    if (!this.canvas) return;
    const style = getComputedStyle(this.canvas);
    const entries = Object.entries(MAP_COLOR_TOKENS) as [keyof MapColors, string][];
    const colors = {} as MapColors;
    for (const [key, token] of entries) {
      const value = style.getPropertyValue(token).trim();
      colors[key] = value === "" ? "rgb(128,128,128)" : value;
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
    const pad = this.options.padding;
    this.base.fitExtent(
      [
        [pad, pad],
        [Math.max(pad + 1, width - pad), Math.max(pad + 1, height - pad)],
      ],
      SPHERE,
    );
    this.rebuild();
    this.render();
    this.options.onSettle?.();
  }

  setData(data: MapData) {
    this.data = data;
    this.glow = data.regions.map(() => 0);
    this.rebuild();
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

  /** Market (index) under a canvas point, -1 for sea, land outside the markets, or off the map. */
  pick(x: number, y: number): number {
    const { k, tx, ty } = this.transform;
    const kind = this.kindAt((x - tx) / k, (y - ty) / k);
    return kind >= KIND_REGION ? kind - KIND_REGION : -1;
  }

  /** Screen position of a view centre, for labels that must follow the map. */
  locate(view: RegionView): [number, number] | null {
    const projected = this.base(view.center);
    if (!projected) return null;
    const { k, tx, ty } = this.transform;
    return [projected[0] * k + tx, projected[1] * k + ty];
  }

  /** Fly to a market view, or home when `view` is null; instant under reduced motion. */
  flyTo(view: RegionView | null) {
    const target = this.targetFor(view);
    if (!target) return;
    if (this.options.reducedMotion) {
      this.apply(target.center, target.k);
      this.render();
      this.options.onSettle?.();
      return;
    }
    this.flight = {
      from: { center: this.currentCenter(), k: this.transform.k },
      to: target,
      start: performance.now(),
      duration: FLIGHT_MS,
    };
    this.startLoop();
  }

  requestRender() {
    if (this.frame !== 0) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = 0;
      this.render();
    });
  }

  /** The base-space point currently at the centre of the canvas. */
  private currentCenter(): [number, number] {
    const { k, tx, ty } = this.transform;
    return [(this.width / 2 - tx) / k, (this.height / 2 - ty) / k];
  }

  private targetFor(view: RegionView | null): { center: [number, number]; k: number } | null {
    if (!view) return { center: [this.width / 2, this.height / 2], k: 1 };
    const projected = this.base(view.center);
    if (!projected) return null;
    return { center: [projected[0], projected[1]], k: view.zoom };
  }

  /** Put a base-space point at the centre of the canvas at magnification k. */
  private apply(center: [number, number], k: number) {
    this.transform = { k, tx: this.width / 2 - k * center[0], ty: this.height / 2 - k * center[1] };
  }

  /** Paint the land and the markets into a lookup raster and lay the dot grid over the land. */
  private rebuild() {
    if (!this.data || this.width === 0 || this.height === 0) return;
    const width = Math.max(1, Math.round(this.width));
    const height = Math.max(1, Math.round(this.height));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return;
    const path = geoPath(this.base, context);

    if (this.data.regions.length > MAX_REGIONS) throw new Error(`the mask encodes at most ${String(MAX_REGIONS)} markets`);
    context.globalCompositeOperation = "lighter";
    context.fillStyle = LAND_PAINT;
    context.beginPath();
    path(this.data.land);
    context.fill();
    this.data.regions.forEach((region, index) => {
      context.fillStyle = REGION_PAINT[index];
      context.beginPath();
      path(region.feature);
      context.fill();
    });
    this.mask = { width, height, pixels: context.getImageData(0, 0, width, height).data };

    const [[x0, y0], [x1, y1]] = geoPath(this.base).bounds(SPHERE);
    const spacing = clamp((x1 - x0) / 230, 4, 9);
    this.spacing = spacing;
    const xs: number[] = [];
    const ys: number[] = [];
    const kinds: number[] = [];
    for (let y = y0 + spacing / 2; y < y1; y += spacing) {
      for (let x = x0 + spacing / 2; x < x1; x += spacing) {
        const kind = this.kindAt(x, y);
        if (kind === KIND_SEA) continue;
        xs.push(x);
        ys.push(y);
        kinds.push(kind);
      }
    }
    this.dots = { count: xs.length, x: Float32Array.from(xs), y: Float32Array.from(ys), kind: Uint8Array.from(kinds) };

    // Keep whatever is selected centred after a resize; otherwise rest.
    const selectedView = this.selected >= 0 ? this.data.regions[this.selected]?.spec.view : null;
    const target = this.targetFor(selectedView ?? null);
    if (target) this.apply(target.center, target.k);
    this.flight = null;
  }

  private kindAt(x: number, y: number): number {
    const mask = this.mask;
    const data = this.data;
    if (!mask || !data) return KIND_SEA;
    const px = Math.round(x);
    const py = Math.round(y);
    if (px < 0 || py < 0 || px >= mask.width || py >= mask.height) return KIND_SEA;
    const offset = (py * mask.width + px) * 4;
    const red = mask.pixels[offset] >= COVERED;
    const green = mask.pixels[offset + 1] >= COVERED;
    const index = red && green ? 2 : red ? 0 : green ? 1 : -1;
    if (index >= 0 && index < data.regions.length) return KIND_REGION + index;
    if (mask.pixels[offset + 2] >= COVERED || mask.pixels[offset + 3] >= COVERED) return KIND_LAND;
    return KIND_SEA;
  }

  private startLoop() {
    if (this.frame !== 0) return;
    this.lastTick = performance.now();
    const loop = (now: number) => {
      this.frame = 0;
      const dt = Math.min(50, now - this.lastTick);
      this.lastTick = now;
      const busy = this.step(now, dt);
      this.render();
      if (busy) this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  /** Advance the flight and the highlight; true while anything still moves. */
  private step(now: number, dt: number): boolean {
    let busy = false;

    if (this.flight) {
      const { from, to, start, duration } = this.flight;
      const t = clamp((now - start) / duration, 0, 1);
      const e = easeInOutCubic(t);
      const center: [number, number] = [
        from.center[0] + (to.center[0] - from.center[0]) * e,
        from.center[1] + (to.center[1] - from.center[1]) * e,
      ];
      const k = from.k * Math.pow(to.k / from.k, e);
      this.apply(center, k);
      if (t >= 1) {
        this.flight = null;
        this.options.onSettle?.();
      } else busy = true;
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

  render() {
    const ctx = this.context;
    const colors = this.colors;
    if (!ctx || !colors || this.width === 0) return;
    ctx.clearRect(0, 0, this.width, this.height);
    if (!this.data || !this.dots) return;

    const { k, tx, ty } = this.transform;
    this.view.scale(this.base.scale() * k).translate([this.base.translate()[0] * k + tx, this.base.translate()[1] * k + ty]);
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    this.drawDots();

    // Resting outline: faint, so the three markets read as the places to go.
    this.data.regions.forEach((region, index) => {
      const g = this.glow[index];
      if (g >= 1) return;
      ctx.beginPath();
      this.path(region.feature);
      ctx.globalAlpha = 0.18 * (1 - g);
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Active market: soft fill, a wide faint stroke, a crisp edge.
    this.data.regions.forEach((region, index) => {
      const g = this.glow[index];
      if (g <= 0) return;
      ctx.beginPath();
      this.path(region.feature);
      ctx.fillStyle = colors.accent;
      ctx.globalAlpha = 0.07 * g;
      ctx.fill();
      ctx.strokeStyle = colors.accent;
      ctx.globalAlpha = 0.12 * g;
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.globalAlpha = 0.95 * g;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });
  }

  private drawDots() {
    const ctx = this.context;
    const colors = this.colors;
    const dots = this.dots;
    if (!ctx || !colors || !dots) return;
    const { k, tx, ty } = this.transform;
    const radius = this.spacing * 0.3 * Math.pow(k, 0.5);
    const groups = new Map<string, { color: string; alpha: number; size: number; points: number[] }>();

    const push = (key: string, color: string, alpha: number, size: number, x: number, y: number) => {
      let group = groups.get(key);
      if (!group) {
        group = { color, alpha, size, points: [] };
        groups.set(key, group);
      }
      group.points.push(x, y);
    };

    for (let i = 0; i < dots.count; i++) {
      const x = dots.x[i] * k + tx;
      const y = dots.y[i] * k + ty;
      if (x < -radius || y < -radius || x > this.width + radius || y > this.height + radius) continue;
      const kind = dots.kind[i];
      if (kind >= KIND_REGION) {
        const g = this.glow[kind - KIND_REGION] ?? 0;
        if (g > 0) {
          push(`a${String(kind)}`, colors.accent, 0.35 + 0.65 * g, radius * (1 + 0.15 * g), x, y);
          continue;
        }
        push("m", colors.dotMarket, 1, radius, x, y);
      } else {
        push("d", colors.dot, 1, radius, x, y);
      }
    }

    for (const group of groups.values()) {
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
