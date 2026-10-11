import Link from "next/link";
import { full } from "@/lib/content/format";
import { vehicleHref } from "@/lib/content/markets";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { site } from "@/lib/site";
import type { ScopeContent, StageFigures } from "@/lib/workspace/stages";
import { StageBar } from "./stage-bar";
import { VehicleDock } from "./vehicle-dock";

/*
 * The header every screen of the scope workspace shares: the Map chip, the
 * vehicle name and code as the page's h1, the market line, the car in the
 * corner on every screen but the vehicle screen, and the stage bar beneath.
 * Since step 20 it is rendered by the scope layout and stays on screen
 * while the product manager moves between the stages; only the content
 * below it changes. Its height is written in lib/vehicles/layout.ts
 * (STAGE_TOP), because the hand-over from the map lands the car's photo
 * under it.
 */
export interface WorkspaceHeaderProps {
  market: MarketContent;
  vehicle: VehicleContent;
  scope: ScopeContent;
  stored: StageFigures;
  live: Promise<StageFigures>;
}

export function WorkspaceHeader({ market, vehicle, scope, stored, live }: WorkspaceHeaderProps) {
  const hasVerbatims = vehicle.verbatims > 0;
  const note = site.panel.drawingNotes[vehicle.code];
  const { workspace } = site;
  return (
    <header className="workspace-head">
      <div className="workspace-head-row">
        <Link href="/" className="tap workspace-back">
          {workspace.back}
        </Link>
        <div className="workspace-head-text">
          <h1 className="workspace-title">
            {vehicle.name} <span className="workspace-code">{vehicle.code}</span>
          </h1>
          <p className="workspace-meta">
            {market.name} · {full(vehicle.sales.units)} {site.readout.units} {String(vehicle.sales.year)} ·{" "}
            {hasVerbatims ? `${full(vehicle.verbatims)} ${site.readout.verbatims}` : site.readout.noVerbatims}
            {note ? ` · ${note}` : ""}
          </p>
        </div>
        <VehicleDock code={vehicle.drawing} href={vehicleHref(market.code, vehicle.code)} label={workspace.dockLabel} />
      </div>
      <StageBar market={market.code} vehicle={vehicle.code} scope={scope} stored={stored} live={live} />
    </header>
  );
}

/** The header's frame while the route's parameters are read: the same height, nothing in it yet. */
export function WorkspaceHeaderFrame() {
  return (
    <header className="workspace-head" aria-hidden="true">
      <div className="workspace-head-row" />
      <div className="stage-bar stage-bar-frame" />
    </header>
  );
}
