"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { vehicleHref } from "@/lib/content/markets";
import { full, percent, score } from "@/lib/content/format";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { useReducedMotion } from "@/lib/motion/reduced-motion";
import { drawingFor, photoFor } from "@/lib/vehicles/drawings";
import { startHandoff } from "@/lib/vehicles/handoff";
import { photoTarget } from "@/lib/vehicles/layout";
import { site } from "@/lib/site";

/*
 * One vehicle sold in the magnified market: the configured car's side
 * profile from the BMW configurator, the name, 2025 units, verbatims and
 * the weakest domain. A click hands the photo to the hand-over layer, which
 * sets it moving at once towards the place the sketch has on the vehicle
 * screen and navigates once its veil covers the map. The link prefetches
 * its own vehicle screen (the header and the sketch), so that screen is
 * there the moment the layer asks for it (step 20). With reduced motion the
 * card only navigates.
 */
export interface VehicleCardProps {
  market: MarketContent;
  vehicle: VehicleContent;
}

export function VehicleCard({ market, vehicle }: VehicleCardProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const href = vehicleHref(market.code, vehicle.code);
  const drawing = drawingFor(vehicle.drawing, "side");
  const photo = photoFor(vehicle.drawing);
  const note = site.panel.drawingNotes[vehicle.code];

  const weakest = vehicle.weakestDomain
    ? `${site.readout.highestComplaintShare} ${vehicle.weakestDomain.name} ${percent(vehicle.weakestDomain.complaintShare)}`
    : vehicle.study && vehicle.study.weakest.length > 0
      ? `${site.readout.lowestStudyScore} ${vehicle.study.weakest[0].attribute} ${score(vehicle.study.weakest[0].score)}`
      : null;

  const onClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    const box = boxRef.current;
    if (reducedMotion || !box) {
      router.push(href);
      return;
    }
    const rect = box.getBoundingClientRect();
    startHandoff({
      code: vehicle.drawing,
      src: photo.src,
      from: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      to: photoTarget(window.innerWidth, drawing, photo),
      navigate: () => router.push(href),
    });
  };

  return (
    <Link href={href} prefetch className="vehicle-card" onClick={onClick}>
      <div className="vehicle-card-stage">
        <div ref={boxRef} className="vehicle-card-photo" style={{ aspectRatio: `${String(photo.width)} / ${String(photo.height)}` }}>
          <Image src={photo.src} alt="" width={photo.width} height={photo.height} unoptimized draggable={false} />
        </div>
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
