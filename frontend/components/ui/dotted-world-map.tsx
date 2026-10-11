"use client";

import { useEffect, useRef, useState } from "react";
import { buildMapData, type MapData, type WorldTopology } from "@/lib/map/data";
import { MapRenderer } from "@/lib/map/renderer";
import { asset } from "@/lib/static";
import type { RegionId, RegionSpec } from "@/lib/map/regions";
import { cn } from "@/lib/utils";

/*
 * Dotted world map on a canvas: land as a halftone grid of dots, three
 * selectable markets. Hover brightens a market and draws its outline, click
 * magnifies it, Escape or a click on open sea returns. Rendering lives in
 * lib/map/renderer.ts. The topology is served from our origin (see
 * scripts/sync-map-data.mjs).
 */

export interface RegionPlacement {
  /** Screen position of the market's view centre. */
  center: [number, number];
  /** Screen position of the callout card's pinned corner. */
  card: [number, number];
  /** Where the connector leaves the card's top edge (x) and meets the market (edge). */
  lineX: number;
  edge: [number, number];
}

/** Distance from the card's pinned corner to the connector, CSS px. */
export const CALLOUT_INSET = 24;

export type RegionPositions = Partial<Record<RegionId, RegionPlacement>>;

export interface DottedWorldMapProps {
  regions: readonly RegionSpec[];
  hovered: RegionId | null;
  selected: RegionId | null;
  onHover: (id: RegionId | null) => void;
  onSelect: (id: RegionId | null) => void;
  /** Screen positions of the markets, after every resize or flight. */
  onLayout?: (positions: RegionPositions) => void;
  /** A flight started: positions are stale until the next onLayout. */
  onMoveStart?: () => void;
  reducedMotion: boolean;
  label: string;
  className?: string;
}

const DATA_URL = asset("/map/countries-110m.json");

let dataPromise: Promise<MapData> | null = null;

function loadMapData(regions: readonly RegionSpec[]): Promise<MapData> {
  if (!dataPromise) {
    dataPromise = fetch(DATA_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`map data ${String(response.status)}`);
        return response.json() as Promise<WorldTopology>;
      })
      .then((topology) => buildMapData(topology, regions))
      .catch((error: unknown) => {
        dataPromise = null;
        throw error;
      });
  }
  return dataPromise;
}

export function DottedWorldMap({
  regions,
  hovered,
  selected,
  onHover,
  onSelect,
  onLayout,
  onMoveStart,
  reducedMotion,
  label,
  className,
}: DottedWorldMapProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MapRenderer | null>(null);
  const hoverRef = useRef<RegionId | null>(null);
  const selectedRef = useRef<RegionId | null>(selected);
  const previousSelected = useRef<RegionId | null>(selected);
  const onLayoutRef = useRef(onLayout);
  const onMoveStartRef = useRef(onMoveStart);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    onLayoutRef.current = onLayout;
    onMoveStartRef.current = onMoveStart;
  }, [onLayout, onMoveStart]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) return;
    const renderer = new MapRenderer({
      reducedMotion,
      onMove: () => onMoveStartRef.current?.(),
      onSettle: () => {
        const positions: RegionPositions = {};
        regions.forEach((region, index) => {
          const center = renderer.locate(region.view.center);
          const card = renderer.locate(region.callout.card);
          const subject = renderer.locate(region.callout.subject);
          if (!center || !card || !subject) return;
          const lineX = region.callout.corner === "top-left" ? card[0] + CALLOUT_INSET : card[0] - CALLOUT_INSET;
          const edge = renderer.edgeTowards(index, [lineX, subject[1]], subject) ?? subject;
          positions[region.id] = { center, card, lineX, edge };
        });
        onLayoutRef.current?.(positions);
      },
    });
    rendererRef.current = renderer;
    renderer.attach(canvas);

    const observer = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      renderer.resize(width, height, Math.min(2, window.devicePixelRatio || 1));
    });
    observer.observe(wrapper);

    let cancelled = false;
    loadMapData(regions)
      .then((data) => {
        if (cancelled) return;
        renderer.setData(data);
        const current = selectedRef.current;
        renderer.setSelected(regions.findIndex((r) => r.id === current));
        renderer.flyTo(regions.find((r) => r.id === current)?.view ?? null);
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
    renderer.flyTo(regions.find((r) => r.id === selected)?.view ?? null);
  }, [selected, regions]);

  const setHover = (id: RegionId | null) => {
    if (hoverRef.current === id) return;
    hoverRef.current = id;
    onHover(id);
  };

  const pickAt = (event: React.MouseEvent<HTMLCanvasElement>): RegionId | null => {
    const renderer = rendererRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const index = renderer.pick(event.clientX - rect.left, event.clientY - rect.top);
    return index >= 0 ? regions[index].id : null;
  };

  return (
    <div ref={wrapperRef} className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className="map-canvas"
        data-ready={ready ? "true" : undefined}
        data-hover={hovered ? "true" : undefined}
        onMouseMove={(event) => setHover(pickAt(event))}
        onMouseLeave={() => setHover(null)}
        onClick={(event) => {
          const id = pickAt(event);
          if (id) onSelect(id);
          else if (selectedRef.current) onSelect(null);
        }}
      />
      {failed ? (
        <p role="status" className="absolute inset-x-0 bottom-6 text-center text-sm text-ink-2">
          The map could not be loaded.
        </p>
      ) : null}
    </div>
  );
}

export default DottedWorldMap;
