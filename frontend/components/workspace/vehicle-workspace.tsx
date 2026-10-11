"use client";

import Link from "next/link";
import { ViewTransition, useLayoutEffect, useRef } from "react";
import { VehicleDrawing } from "@/components/vehicles/vehicle-drawing";
import { full, scaleTop, score } from "@/lib/content/format";
import type { CpmCatalogue, CpmSubsystemKey, CpmView } from "@/lib/content/cpm-types";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { VEHICLE_DOCK, vehicleTransitionName } from "@/lib/vehicles/dock";
import { type DrawingCode, drawingFor, photoFor } from "@/lib/vehicles/drawings";
import { arriveHandoff, useSketchPhase } from "@/lib/vehicles/handoff";
import { site } from "@/lib/site";
import type { SubsystemEvidence } from "@/lib/workspace/market";
import type { SubsystemBridge } from "@/lib/workspace/requirements";
import { CpmList } from "./cpm-list";
import { Reveal } from "./reveal";

/*
 * Screen 2: one vehicle in one market, stage 1 of the scope workspace. The
 * car as a sketch (side and top view) beside the twelve CPM subsystems; a
 * subsystem opens the dialog with the customer and market evidence.
 *
 * The stage (VehicleStage) depends on the vehicle only, so it is part of
 * the screen's prefetched frame; the subsystems (VehicleAside) need the
 * workspace read at request time and arrive after it. Arriving from the
 * map, the hand-over layer brings the car's photo to the side view's
 * silhouette box; the stage reports that box once laid out, keeps the
 * sketch hidden while the photo fades, then reveals it. Arriving from
 * another stage, the side view grows out of the header's corner (step 20,
 * VehicleDock): the two carry one view transition name.
 */
const TOP_VIEW_DELAY_MS = 160;

export function VehicleStage({ code }: { code: DrawingCode }) {
  const side = drawingFor(code, "side");
  const top = drawingFor(code, "top");
  const photo = photoFor(code);

  // Where the photo must land: the side view's silhouette box, measured after layout.
  const slotRef = useRef<HTMLDivElement>(null);
  const sketchPhase = useSketchPhase(code);
  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const rect = slot.getBoundingClientRect();
    arriveHandoff(code, { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
  }, [code]);

  const [x0, y0, x1] = side.bbox;
  const slotStyle: React.CSSProperties = {
    left: `${String((x0 / side.width) * 100)}%`,
    width: `${String(((x1 - x0) / side.width) * 100)}%`,
    top: `${String((y0 / side.height) * 100)}%`,
    aspectRatio: `${String(photo.width)} / ${String(photo.height)}`,
  };

  return (
    <section className="workspace-stage" aria-label={site.workspace.stageLabel} data-sketch={sketchPhase}>
      <ViewTransition name={vehicleTransitionName(code)} share={VEHICLE_DOCK} default="none">
        <div className="workspace-view">
          <VehicleDrawing drawing={side} size="stage" />
          <div ref={slotRef} className="vehicle-photo-slot" style={slotStyle} aria-hidden="true" />
        </div>
      </ViewTransition>
      {/* The top view follows the side view when the car grows back out of the header's corner. */}
      <Reveal as="div" delay={TOP_VIEW_DELAY_MS}>
        <div className="workspace-view workspace-view-top">
          <VehicleDrawing drawing={top} size="stage" />
        </div>
      </Reveal>
    </section>
  );
}

export interface VehicleAsideProps {
  market: MarketContent;
  vehicle: VehicleContent;
  cpm: { catalogue: CpmCatalogue; view: CpmView };
  bridges: Partial<Record<CpmSubsystemKey, SubsystemBridge>> | undefined;
  /** The external statements per subsystem, for the rows and the dialog (step 19). */
  evidence: Partial<Record<CpmSubsystemKey, SubsystemEvidence>>;
  /** The market evidence page and the series page of the scope, where they exist. */
  links: { market: { href: string; statements: number } | null; regions: { href: string; series: string } | null };
}

export function VehicleAside({ market, vehicle, cpm, bridges, evidence, links }: VehicleAsideProps) {
  const hasVerbatims = vehicle.verbatims > 0;
  const { workspace } = site;
  return (
    <Reveal as="aside" className="workspace-domains" selector=".panel-card > :not(ol), .cpm-list > li">
      <CpmList catalogue={cpm.catalogue} view={cpm.view} market={market} vehicle={vehicle} bridges={bridges} evidence={evidence} marketHref={links.market?.href ?? null} />
      {links.market || links.regions ? (
        <nav className="panel-card workspace-links" aria-label={workspace.moreLabel}>
          {links.market ? (
            <Link href={links.market.href} className="tap cpm-market-link">
              {site.market.heading} {market.name}, {full(links.market.statements)} {site.market.statements}
            </Link>
          ) : null}
          {links.regions ? (
            <Link href={links.regions.href} className="tap cpm-market-link">
              {links.regions.series} {workspace.regionsLink}
            </Link>
          ) : null}
        </nav>
      ) : null}
      {!hasVerbatims ? (
        <section className="panel-card">
          <h2 className="workspace-h2">{workspace.noVerbatimsHeading}</h2>
          <p className="workspace-hint">{workspace.noVerbatimsBody}</p>
          {vehicle.study ? (
            <>
              <h3 className="workspace-h3">
                {workspace.studyHeading} · {vehicle.study.sheet}
              </h3>
              <ol className="theme-list">
                {vehicle.study.weakest.map((item) => (
                  <li key={item.attribute} className="theme">
                    <span className="theme-name">{item.attribute}</span>
                    <span className="theme-figures">
                      {score(item.score)} {site.readout.of} {scaleTop(vehicle.study?.scale ?? "")}
                    </span>
                  </li>
                ))}
              </ol>
              {vehicle.study.overall !== null ? (
                <p className="workspace-hint">
                  {workspace.overall} {score(vehicle.study.overall)}
                </p>
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}
    </Reveal>
  );
}
