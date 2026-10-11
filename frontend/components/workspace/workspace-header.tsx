import Link from "next/link";
import { full } from "@/lib/content/format";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { site } from "@/lib/site";
import type { StageFigures, StageKey } from "@/lib/workspace/stages";
import { StageBar } from "./stage-bar";

/*
 * The header every stage of the scope workspace shares: the Map chip, the
 * vehicle name and code as the page's h1, the market line, and the stage
 * bar beneath. Its height is written in lib/vehicles/layout.ts (STAGE_TOP),
 * because the hand-over from the map lands the car's photo under it.
 */
export interface WorkspaceHeaderProps {
  market: MarketContent;
  vehicle: VehicleContent;
  current: StageKey;
  figures: StageFigures;
}

export function WorkspaceHeader({ market, vehicle, current, figures }: WorkspaceHeaderProps) {
  const hasVerbatims = vehicle.verbatims > 0;
  const note = site.panel.drawingNotes[vehicle.code];
  const { workspace } = site;
  return (
    <header className="workspace-head">
      <div className="workspace-head-row">
        <Link href="/" className="tap workspace-back">
          {workspace.back}
        </Link>
        <div>
          <h1 className="workspace-title">
            {vehicle.name} <span className="workspace-code">{vehicle.code}</span>
          </h1>
          <p className="workspace-meta">
            {market.name} · {full(vehicle.sales.units)} {site.readout.units} {String(vehicle.sales.year)} ·{" "}
            {hasVerbatims ? `${full(vehicle.verbatims)} ${site.readout.verbatims}` : site.readout.noVerbatims}
            {note ? ` · ${note}` : ""}
          </p>
        </div>
      </div>
      <StageBar market={market.code} vehicle={vehicle.code} current={current} figures={figures} />
    </header>
  );
}
