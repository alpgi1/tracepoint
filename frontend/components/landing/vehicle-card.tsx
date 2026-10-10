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
import { setHandoff } from "@/lib/vehicles/handoff";
import { fullScreenTarget, photoTarget, type Box } from "@/lib/vehicles/layout";
import { site } from "@/lib/site";

/*
 * One vehicle sold in the magnified market: the configured car's side
 * profile from the BMW configurator, the name, 2025 units, verbatims and
 * the weakest domain. A click grows the photo to full screen over a paper
 * veil, holds, moves it to the place the drawing has on the vehicle screen,
 * then navigates; that screen starts with the same photo and fades to the
 * sketch. With reduced motion it navigates at once.
 */
const GROW_MS = 520;
const HOLD_MS = 420;
const MOVE_MS = 560;

export interface VehicleCardProps {
  market: MarketContent;
  vehicle: VehicleContent;
}

function transformBetween(from: DOMRect, to: Box): string {
  const scale = to.width / from.width;
  return `translate(${String(to.left - from.left)}px, ${String(to.top - from.top)}px) scale(${String(scale)})`;
}

export function VehicleCard({ market, vehicle }: VehicleCardProps) {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const boxRef = useRef<HTMLDivElement>(null);
  const veilRef = useRef<HTMLSpanElement>(null);
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
    const veil = veilRef.current;
    if (reducedMotion || !box || !veil) {
      router.push(href);
      return;
    }
    const from = box.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    box.style.transformOrigin = "0 0";
    box.style.position = "relative";
    box.style.zIndex = "30";
    box.style.transition = `transform ${String(GROW_MS)}ms var(--ease-in-out)`;
    box.style.transform = transformBetween(from, fullScreenTarget(vw, vh, photo));
    veil.dataset.on = "true";
    window.setTimeout(() => {
      box.style.transition = `transform ${String(MOVE_MS)}ms var(--ease-in-out)`;
      box.style.transform = transformBetween(from, photoTarget(vw, drawing, photo));
      window.setTimeout(() => {
        setHandoff(vehicle.drawing);
        router.push(href);
      }, MOVE_MS + 40);
    }, GROW_MS + HOLD_MS);
  };

  return (
    <Link href={href} className="vehicle-card" onClick={onClick}>
      <span ref={veilRef} className="veil" aria-hidden="true" />
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
