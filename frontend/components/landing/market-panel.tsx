import type { CSSProperties } from "react";
import { full, scaleTop, score } from "@/lib/content/format";
import type { MarketContent } from "@/lib/content/types";
import { site } from "@/lib/site";
import { VehicleCard } from "./vehicle-card";

/*
 * The magnified market's panel: its figures once more, then the vehicles
 * sold there as cards. Sits on the lower part of the viewport; the map
 * keeps the market in the upper part (renderer focus anchor).
 */
export interface MarketPanelProps {
  market: MarketContent;
  onClose: () => void;
}

export function MarketPanel({ market, onClose }: MarketPanelProps) {
  const { readout } = site;
  const weakest = market.weakestDomain
    ? `${readout.highestComplaintShare} ${market.weakestDomain.name}`
    : market.study
      ? `${readout.lowestStudyScore} ${market.study.attribute} ${score(market.study.score)} ${readout.of} ${scaleTop(market.study.scale)}`
      : null;
  return (
    <section className="market-panel" aria-labelledby="market-panel-title">
      <div className="market-panel-head">
        <div>
          <h2 id="market-panel-title" className="market-panel-title">
            {market.name}
          </h2>
          <p className="market-panel-figures">
            {full(market.sales.units)} {readout.units} {String(market.sales.year)} ·{" "}
            {market.verbatims.count > 0 ? `${full(market.verbatims.count)} ${readout.verbatims}` : readout.noVerbatims}
            {weakest ? ` · ${weakest}` : ""}
          </p>
        </div>
        <button type="button" className="tap market-panel-close" onClick={onClose}>
          {site.panel.close}
        </button>
      </div>
      <ul className="market-panel-cards" aria-label={site.panel.vehiclesLabel} style={{ "--cards": market.vehicles.length } as CSSProperties}>
        {market.vehicles.map((vehicle) => (
          <li key={vehicle.code}>
            <VehicleCard market={market} vehicle={vehicle} />
          </li>
        ))}
      </ul>
    </section>
  );
}
