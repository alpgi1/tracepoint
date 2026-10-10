"use client";

import { useEffect, useRef, useState } from "react";
import { buildGlobeData, type GlobeData, type WorldTopology } from "@/lib/globe/data";
import { createRasterClassifier } from "@/lib/globe/raster";
import { GlobeRenderer } from "@/lib/globe/renderer";
import { HOME_VIEW, type RegionId, type RegionSpec } from "@/lib/globe/regions";
import { cn } from "@/lib/utils";

/*
 * Wireframe dotted globe, adapted from the 21st.dev "wireframe-dotted-globe"
 * component (d3 orthographic projection on a 2d canvas). What changed:
 * no auto-rotation, drag to rotate with a short coast, three selectable
 * markets with hover glow and outline, click flies the camera in, data
 * served from our origin, colours from tokens, dots spread evenly with a
 * Fibonacci lattice, no wheel zoom (the page keeps scrolling), no console
 * output, reduced-motion aware. Rendering lives in lib/globe/renderer.ts.
 */

export interface WireframeDottedGlobeProps {
  regions: readonly RegionSpec[];
  hovered: RegionId | null;
  selected: RegionId | null;
  onHover: (id: RegionId | null) => void;
  onSelect: (id: RegionId | null) => void;
  reducedMotion: boolean;
  label: string;
  className?: string;
}

const DATA_URL = "/globe/countries-110m.json";
const DOT_SPACING = 1.35; // degrees of arc between dots
const CLICK_DISTANCE = 4;
const CLICK_TIME = 500;

let dataPromise: Promise<GlobeData> | null = null;

function loadGlobeData(regions: readonly RegionSpec[]): Promise<GlobeData> {
  if (!dataPromise) {
    dataPromise = fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`globe data ${String(response.status)}`);
        return response.json() as Promise<WorldTopology>;
      })
      .then((topology) =>
        buildGlobeData(topology, regions, {
          spacing: DOT_SPACING,
          classifier: (land, shapes) => createRasterClassifier(land, shapes),
        }),
      )
      .catch((error: unknown) => {
        dataPromise = null;
        throw error;
      });
  }
  return dataPromise;
}

interface Drag {
  pointerId: number;
  pointerType: string;
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
  moved: boolean;
  samples: { t: number; dx: number; dy: number }[];
}

export function WireframeDottedGlobe({
  regions,
  hovered,
  selected,
  onHover,
  onSelect,
  reducedMotion,
  label,
  className,
}: WireframeDottedGlobeProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GlobeRenderer | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const hoverRef = useRef<RegionId | null>(null);
  const selectedRef = useRef<RegionId | null>(selected);
  const previousSelected = useRef<RegionId | null>(selected);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const renderer = new GlobeRenderer({ reducedMotion });
    rendererRef.current = renderer;
    renderer.attach(canvas);
    renderer.setView(HOME_VIEW);

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      renderer.resize(width, height, Math.min(2, window.devicePixelRatio || 1));
    });
    observer.observe(wrapper);

    let cancelled = false;
    loadGlobeData(regions)
      .then((data) => {
        if (cancelled) return;
        renderer.setData(data);
        const current = selectedRef.current;
        if (current) {
          const spec = regions.find((r) => r.id === current);
          renderer.setSelected(regions.findIndex((r) => r.id === current));
          if (spec) renderer.setView(spec.view);
        } else {
          renderer.enter(HOME_VIEW);
        }
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
      observer.disconnect();
      renderer.destroy();
      rendererRef.current = null;
    };
    // The renderer is created once; option changes go through setOptions below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    rendererRef.current?.setOptions({ reducedMotion });
  }, [reducedMotion]);

  useEffect(() => {
    rendererRef.current?.setHover(regions.findIndex((r) => r.id === hovered));
  }, [hovered, regions]);

  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;
    renderer.setSelected(regions.findIndex((r) => r.id === selected));
    if (previousSelected.current === selected) return;
    previousSelected.current = selected;
    if (!renderer.ready) return;
    const spec = regions.find((r) => r.id === selected);
    renderer.flyTo(spec ? spec.view : HOME_VIEW);
  }, [selected, regions]);

  const setHover = (id: RegionId | null) => {
    if (hoverRef.current === id) return;
    hoverRef.current = id;
    onHover(id);
  };

  const pickAt = (event: React.PointerEvent<HTMLCanvasElement>): RegionId | null => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const index = renderer.pick(event.clientX - rect.left, event.clientY - rect.top);
    return index >= 0 ? regions[index].id : null;
  };

  const onPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !canvas || event.button !== 0) return;
    const rect = canvas.getBoundingClientRect();
    if (!renderer.onDisc(event.clientX - rect.left, event.clientY - rect.top)) return;
    renderer.stopCoasting();
    canvas.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      x: event.clientX,
      y: event.clientY,
      startX: event.clientX,
      startY: event.clientY,
      startTime: performance.now(),
      moved: false,
      samples: [],
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !canvas) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      setHover(pickAt(event));
      return;
    }
    const dx = event.clientX - drag.x;
    const dy = drag.pointerType === "touch" ? 0 : event.clientY - drag.y;
    drag.x = event.clientX;
    drag.y = event.clientY;
    if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > CLICK_DISTANCE) {
      drag.moved = true;
      canvas.dataset.dragging = "true";
      setHover(null);
    }
    if (!drag.moved) return;
    const now = performance.now();
    drag.samples.push({ t: now, dx, dy });
    if (drag.samples.length > 6) drag.samples.shift();
    renderer.rotateBy(dx, dy);
  };

  const endDrag = (event: React.PointerEvent<HTMLCanvasElement>, cancelled: boolean) => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    const drag = dragRef.current;
    if (!renderer || !canvas || !drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    delete canvas.dataset.dragging;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    if (cancelled) return;

    const elapsed = performance.now() - drag.startTime;
    if (!drag.moved && elapsed < CLICK_TIME) {
      const id = pickAt(event);
      if (id) onSelect(id);
      else if (selectedRef.current) onSelect(null);
      return;
    }

    const now = performance.now();
    const recent = drag.samples.filter((s) => now - s.t < 120);
    if (recent.length >= 2) {
      const span = Math.max(16, now - recent[0].t);
      const sumX = recent.reduce((acc, s) => acc + s.dx, 0);
      const sumY = recent.reduce((acc, s) => acc + s.dy, 0);
      renderer.coastFromPixels(sumX / span, sumY / span);
    }
    if (drag.pointerType === "mouse") setHover(pickAt(event));
  };

  const onPointerLeave = () => {
    if (!dragRef.current) setHover(null);
  };

  return (
    <div ref={wrapperRef} className={cn("relative aspect-square w-full", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className="globe-canvas"
        data-ready={ready ? "true" : undefined}
        data-hover={hovered ? "true" : undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => endDrag(event, false)}
        onPointerCancel={(event) => endDrag(event, true)}
        onPointerLeave={onPointerLeave}
        onContextMenu={(event) => event.preventDefault()}
      />
      {failed ? (
        <p role="status" className="eyebrow absolute inset-x-0 bottom-0 text-center text-chalk-3">
          Globe data could not be loaded.
        </p>
      ) : null}
    </div>
  );
}

export default WireframeDottedGlobe;
