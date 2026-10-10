"use client";

import { useCallback, useEffect, useState } from "react";
import { DottedWorldMap, type RegionPositions } from "@/components/ui/dotted-world-map";
import { REGIONS, type RegionId, regionById } from "@/lib/map/regions";
import { useReducedMotion } from "@/lib/motion/reduced-motion";
import { site } from "@/lib/site";

/*
 * The whole page is the map. Nothing else is on screen: no header, no copy,
 * no footer. The three markets are real buttons for keyboard and assistive
 * technology, visually hidden until focused; when focused, the market's
 * name appears at its place on the map. State changes only on enter, leave
 * and click, never per frame.
 */
export function MapStage() {
  const [hovered, setHovered] = useState<RegionId | null>(null);
  const [selected, setSelected] = useState<RegionId | null>(null);
  const [positions, setPositions] = useState<RegionPositions>({});
  const reducedMotion = useReducedMotion();

  const toggle = useCallback((id: RegionId | null) => {
    setSelected((current) => (current === id ? null : id));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const status = selected
    ? `${regionById(selected).name} selected`
    : hovered
      ? regionById(hovered).name
      : site.map.restingStatus;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-paper">
      <h1 className="sr-only">{site.name}</h1>
      <DottedWorldMap
        className="absolute inset-0"
        regions={REGIONS}
        hovered={hovered}
        selected={selected}
        onHover={setHovered}
        onSelect={toggle}
        onLayout={setPositions}
        reducedMotion={reducedMotion}
        label={site.map.label}
      />
      <ul aria-label={site.map.marketsLabel} className="contents">
        {REGIONS.map((region) => {
          const at = positions[region.id];
          return (
            <li key={region.id} className="contents">
              <button
                type="button"
                data-region={region.id}
                aria-pressed={selected === region.id}
                onClick={() => toggle(region.id)}
                onFocus={() => setHovered(region.id)}
                onBlur={() => setHovered(null)}
                className="market-key"
                style={at ? { left: `${String(Math.round(at[0]))}px`, top: `${String(Math.round(at[1]))}px` } : undefined}
              >
                {region.name}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
