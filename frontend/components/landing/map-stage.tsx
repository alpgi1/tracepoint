"use client";

import { useCallback, useEffect, useState } from "react";
import { DottedWorldMap, type RegionPositions } from "@/components/ui/dotted-world-map";
import type { CpmIntro } from "@/lib/content/cpm-intro";
import { marketByCode } from "@/lib/content/markets";
import { REGIONS, type RegionId, regionById } from "@/lib/map/regions";
import { useReducedMotion } from "@/lib/motion/reduced-motion";
import { site } from "@/lib/site";
import { BrandMark } from "./brand-mark";
import { MarketCallout } from "./market-callout";
import { MarketPanel } from "./market-panel";

/*
 * The whole page is the map. At rest each market carries a callout card
 * (units, verbatims, weakest domain) joined to it by a connector, so the map
 * is the first layer of the analysis. The cards are the markets' buttons:
 * hover highlights, click magnifies; the canvas answers the pointer too. A
 * selected market is magnified and its vehicles appear in a panel below.
 * At the foot of the resting map the brand mark opens the CPM explainer
 * (step 20). State changes only on enter, leave, click and settle, never
 * per frame.
 */
export function MapStage({ intro }: { intro: CpmIntro }) {
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
  const calloutsHidden = moving || selected !== null;

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
      <svg className="callout-lines" aria-hidden="true" data-hidden={calloutsHidden ? "true" : undefined}>
        {REGIONS.map((region) => {
          const at = positions[region.id];
          if (!at) return null;
          const active = hovered === region.id;
          return (
            <g key={region.id} data-active={active ? "true" : undefined}>
              <path d={`M ${String(at.lineX)} ${String(at.card[1])} V ${String(at.edge[1])} H ${String(at.edge[0])}`} />
              <circle cx={at.edge[0]} cy={at.edge[1]} r={3.5} />
            </g>
          );
        })}
      </svg>
      <ul aria-label={site.map.marketsLabel} className="contents">
        {REGIONS.map((region) => {
          const market = marketByCode(region.id);
          if (!market) return null;
          return (
            <li key={region.id} className="contents">
              <MarketCallout
                region={region}
                market={market}
                at={positions[region.id]?.card}
                hidden={calloutsHidden}
                selected={selected === region.id}
                onHover={setHovered}
                onSelect={toggle}
              />
            </li>
          );
        })}
      </ul>
      <BrandMark intro={intro} hidden={calloutsHidden} />
      {selectedMarket && !moving ? <MarketPanel market={selectedMarket} onClose={() => setSelected(null)} /> : null}
      <p className="sr-only" aria-live="polite">
        {status}
      </p>
    </div>
  );
}
