"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { VehicleDrawing } from "@/components/vehicles/vehicle-drawing";
import { vehicleHref } from "@/lib/content/markets";
import { full, percent, score } from "@/lib/content/format";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { useReducedMotion } from "@/lib/motion/reduced-motion";
import { drawingFor } from "@/lib/vehicles/drawings";
import { stageRect } from "@/lib/vehicles/layout";
import { site } from "@/lib/site";

/*
 * One vehicle sold in the magnified market: the side view as a layered
 * sketch, the name, 2025 units, verbatims and the weakest domain. A click
 * grows the drawing into the place it has on the vehicle screen, then
 * navigates there; with reduced motion it navigates at once.
 */
const GROW_MS = 480;

export interface VehicleCardProps {
  market: MarketContent;
  vehicle: VehicleContent;
}

export function VehicleCard({ market, vehicle }: VehicleCardProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const drawingRef = useRef<HTMLDivElement>(null);
  const href = vehicleHref(market.code, vehicle.code);
  const drawing = drawingFor(vehicle.drawing, "side");
  const note = site.panel.drawingNotes[vehicle.code];

  const weakest = vehicle.weakestDomain
    ? `${site.readout.highestComplaintShare} ${vehicle.weakestDomain.name} ${percent(vehicle.weakestDomain.complaintShare)}`
    : vehicle.study && vehicle.study.weakest.length > 0
      ? `${site.readout.lowestStudyScore} ${vehicle.study.weakest[0].attribute} ${score(vehicle.study.weakest[0].score)}`
      : null;

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const box = drawingRef.current;
    if (reducedMotion || !box) {
      router.push(href);
      return;
    }
    const from = box.getBoundingClientRect();
    const to = stageRect(window.innerWidth);
    const scale = to.width / from.width;
    box.style.transformOrigin = "0 0";
    box.style.transition = `transform ${String(GROW_MS)}ms var(--ease-in-out)`;
    box.style.zIndex = "30";
    box.style.transform = `translate(${String(to.left - from.left)}px, ${String(to.top - from.top)}px) scale(${String(scale)})`;
    window.setTimeout(() => router.push(href), GROW_MS);
  };

  return (
    <Link href={href} className="vehicle-card" onClick={onClick}>
      <div ref={drawingRef} className="vehicle-card-drawing">
        <VehicleDrawing drawing={drawing} />
      </div>
      <span className="vehicle-card-name">
        {vehicle.name} <span className="vehicle-card-code">{vehicle.code}</span>
      </span>
      <span className="vehicle-card-figures">
        {full(vehicle.sales.units)} {site.readout.units} {String(vehicle.sales.year)} ·{" "}
        {vehicle.verbatims > 0 ? `${full(vehicle.verbatims)} ${site.readout.verbatims}` : site.readout.noVerbatims}
      </span>
      {weakest ? <span className="vehicle-card-figures">{weakest}</span> : null}
      {note ? <span className="vehicle-card-note">{note}</span> : null}
    </Link>
  );
}
