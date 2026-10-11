"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { VehicleDrawing } from "@/components/vehicles/vehicle-drawing";
import { full, scaleTop, score } from "@/lib/content/format";
import type { CpmCatalogue, CpmView } from "@/lib/content/cpm-types";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { drawingFor, photoFor } from "@/lib/vehicles/drawings";
import { arriveHandoff, useSketchPhase } from "@/lib/vehicles/handoff";
import { site } from "@/lib/site";
import { CpmList } from "./cpm-list";

/*
 * Screen 2: one vehicle in one market. The car as a sketch (side and top
 * view) beside the twelve CPM subsystems; a subsystem opens the dialog with
 * the customer and market evidence. Arriving from the map, the hand-over
 * layer brings the car's photo to the side view's silhouette box; this screen
 * reports that box once laid out, keeps the sketch hidden while the photo
 * fades, then reveals it. Decisions are not built yet.
 */
export interface VehicleWorkspaceProps {
  market: MarketContent;
  vehicle: VehicleContent;
  cpm: { catalogue: CpmCatalogue; view: CpmView };
}

export function VehicleWorkspace({ market, vehicle, cpm }: VehicleWorkspaceProps) {
  const hasVerbatims = vehicle.verbatims > 0;
  const side = drawingFor(vehicle.drawing, "side");
  const top = drawingFor(vehicle.drawing, "top");
  const photo = photoFor(vehicle.drawing);
  const note = site.panel.drawingNotes[vehicle.code];
  const { workspace } = site;

  // Where the photo must land: the side view's silhouette box, measured after layout.
  const slotRef = useRef<HTMLDivElement>(null);
  const sketchPhase = useSketchPhase(vehicle.drawing);
  useLayoutEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;
    const rect = slot.getBoundingClientRect();
    arriveHandoff(vehicle.drawing, { left: rect.left, top: rect.top, width: rect.width, height: rect.height });
  }, [vehicle.drawing]);

  const [x0, y0, x1] = side.bbox;
  const slotStyle: React.CSSProperties = {
    left: `${String((x0 / side.width) * 100)}%`,
    width: `${String(((x1 - x0) / side.width) * 100)}%`,
    top: `${String((y0 / side.height) * 100)}%`,
    aspectRatio: `${String(photo.width)} / ${String(photo.height)}`,
  };

  return (
    <div className="workspace">
      <header className="workspace-head">
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
      </header>
      <div className="workspace-body">
        <section className="workspace-stage" aria-label={workspace.stageLabel} data-sketch={sketchPhase}>
          <div className="workspace-view">
            <VehicleDrawing drawing={side} size="stage" />
            <div ref={slotRef} className="vehicle-photo-slot" style={slotStyle} aria-hidden="true" />
          </div>
          <div className="workspace-view workspace-view-top">
            <VehicleDrawing drawing={top} size="stage" />
          </div>
        </section>
        <aside className="workspace-domains">
          <CpmList catalogue={cpm.catalogue} view={cpm.view} market={market} vehicle={vehicle} />
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
        </aside>
      </div>
    </div>
  );
}
