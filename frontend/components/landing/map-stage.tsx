"use client";

import { useCallback, useEffect, useState } from "react";
import { DottedWorldMap, type RegionPositions } from "@/components/ui/dotted-world-map";
import { marketByCode } from "@/lib/content/markets";
import { REGIONS, type RegionId, regionById } from "@/lib/map/regions";
import { useReducedMotion } from "@/lib/motion/reduced-motion";
import { site } from "@/lib/site";
import { MarketPanel } from "./market-panel";
import { MarketReadout } from "./market-readout";

/*
 * The whole page is the map. At rest each market carries its readout (units,
 * verbatims, weakest domain), so the map is the first layer of the analysis.
 * The three markets are real buttons for keyboard and assistive technology,
 * visually hidden until focused; when focused, the market's name appears at
 * its place on the map. A selected market is magnified and its vehicles
 * appear in a panel below. State changes only on enter, leave, click and
 * settle, never per frame.
 */
export function MapStage() {
  const [hovered, setHovered] = useState<RegionId | null>(null);
  const [selected, setSelected] = useState<RegionId | null>(null);
  const [positions, setPositions] = useState<RegionPositions>({});
  const [moving, setMoving] = useState(false);
  const reducedMotion = useReducedMotion();

  const toggle = useCallback((id: RegionId | null) => {
    setSelected((current) => (current === id ? null : id));
  }, []);

  const onLayout = useCallback((next: RegionPositions) => {
    setPositions(next);
    setMoving(false);
  }, []);

  const onMoveStart = useCallback(() => {
    setMoving(true);
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

  const selectedMarket = selected ? marketByCode(selected) : undefined;

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
        onLayout={onLayout}
        onMoveStart={onMoveStart}
        reducedMotion={reducedMotion}
        label={site.map.label}
      />
      {REGIONS.map((region) => {
        const market = marketByCode(region.id);
        if (!market) return null;
        return (
          <MarketReadout
            key={region.id}
            region={region}
            market={market}
            at={positions[region.id]?.readout}
            hidden={moving || selected !== null}
          />
        );
      })}
      <ul aria-label={site.map.marketsLabel} className="contents">
        {REGIONS.map((region) => {
          const at = positions[region.id]?.center;
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
      {selectedMarket && !moving ? <MarketPanel market={selectedMarket} onClose={() => setSelected(null)} /> : null}
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
