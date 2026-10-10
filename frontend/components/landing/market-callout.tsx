import { CarFront, ClipboardList, Gauge, TriangleAlert } from "lucide-react";
import { DOMAIN_ICONS } from "@/lib/content/icons";
import { scaleTop, score, short } from "@/lib/content/format";
import type { MarketContent } from "@/lib/content/types";
import type { RegionId, RegionSpec } from "@/lib/map/regions";
import { site } from "@/lib/site";

/*
 * A market's callout on the resting map: a card pinned in open water and
 * joined to the market by a connector (drawn by the stage). It carries the
 * market's name, 2025 units and verbatims, and the domain with the highest
 * complaint share, or the lowest study score where no verbatims are
 * classified. The card is the market's button: hover highlights the market,
 * click magnifies it. Method after the annotation pattern (subject,
 * connector, label) of visx on 21st.dev; written here with the tokens.
 */
export interface MarketCalloutProps {
  region: RegionSpec;
  market: MarketContent;
  at: [number, number] | undefined;
  hidden: boolean;
  selected: boolean;
  onHover: (id: RegionId | null) => void;
  onSelect: (id: RegionId) => void;
}

export function MarketCallout({ region, market, at, hidden, selected, onHover, onSelect }: MarketCalloutProps) {
  const { readout } = site;
  const DomainIcon = market.weakestDomain ? DOMAIN_ICONS[market.weakestDomain.key] : null;
  return (
    <button
      type="button"
      className="callout"
      data-region={region.id}
      data-corner={region.callout.corner}
      data-hidden={hidden || !at ? "true" : undefined}
      aria-pressed={selected}
      style={at ? { left: `${String(Math.round(at[0]))}px`, top: `${String(Math.round(at[1]))}px` } : undefined}
      onClick={() => onSelect(region.id)}
      onMouseEnter={() => onHover(region.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(region.id)}
      onBlur={() => onHover(null)}
    >
      <span className="callout-title">{market.name}</span>
      <span className="callout-row">
        <CarFront aria-hidden="true" />
        {short(market.sales.units)} {readout.units} {String(market.sales.year)} ·{" "}
        {market.verbatims.count > 0 ? `${short(market.verbatims.count)} ${readout.verbatims}` : readout.noVerbatims}
      </span>
      {market.weakestDomain && DomainIcon ? (
        <>
          <span className="callout-row">
            <TriangleAlert aria-hidden="true" />
            {readout.highestComplaintShare}
          </span>
          <span className="callout-row callout-row-value">
            <DomainIcon aria-hidden="true" />
            {market.weakestDomain.name}
          </span>
        </>
      ) : market.study ? (
        <>
          <span className="callout-row">
            <ClipboardList aria-hidden="true" />
            {readout.lowestStudyScore}
          </span>
          <span className="callout-row callout-row-value">
            <Gauge aria-hidden="true" />
            {market.study.attribute} {score(market.study.score)} {readout.of} {scaleTop(market.study.scale)}
          </span>
        </>
      ) : null}
    </button>
  );
}
