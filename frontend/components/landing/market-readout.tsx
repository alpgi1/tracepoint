import type { MarketContent } from "@/lib/content/types";
import { scaleTop, score, short } from "@/lib/content/format";
import type { RegionSpec } from "@/lib/map/regions";
import { site } from "@/lib/site";

/*
 * A market's three figures at its place on the map: 2025 sales, verbatim
 * count, and the domain with the highest complaint share (or, where no
 * verbatims are classified yet, the lowest study score). Four short lines,
 * so the block stays inside the big markets and beside the small one.
 * Positioned by the renderer after every settle; hidden while the map flies.
 */
export interface MarketReadoutProps {
  region: RegionSpec;
  market: MarketContent;
  at: [number, number] | undefined;
  hidden: boolean;
}

export function MarketReadout({ region, market, at, hidden }: MarketReadoutProps) {
  const { readout } = site;
  const figures = `${short(market.sales.units)} ${readout.units} ${String(market.sales.year)} · ${
    market.verbatims.count > 0 ? `${short(market.verbatims.count)} ${readout.verbatims}` : readout.noVerbatims
  }`;
  const weakest = market.weakestDomain
    ? [readout.highestComplaintShare, market.weakestDomain.name]
    : market.study
      ? [readout.lowestStudyScore, `${market.study.attribute} ${score(market.study.score)} ${readout.of} ${scaleTop(market.study.scale)}`]
      : null;
  return (
    <div
      className="readout"
      data-align={region.readoutAlign}
      data-hidden={hidden || !at ? "true" : undefined}
      style={at ? { left: `${String(Math.round(at[0]))}px`, top: `${String(Math.round(at[1]))}px` } : undefined}
    >
      <span className="readout-name">{market.name}</span>
      <span className="readout-figures">{figures}</span>
      {weakest ? (
        <>
          <span className="readout-weak-label">{weakest[0]}</span>
          <span className="readout-weak">{weakest[1]}</span>
        </>
      ) : null}
    </div>
  );
}
