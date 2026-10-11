"use client";

import Link from "next/link";
import { useSelectedLayoutSegment } from "next/navigation";
import { ViewTransition } from "react";
import { VehicleDrawing } from "@/components/vehicles/vehicle-drawing";
import { VEHICLE_DOCK, vehicleTransitionName } from "@/lib/vehicles/dock";
import { type DrawingCode, drawingFor } from "@/lib/vehicles/drawings";

/*
 * The car in the header's corner (step 20, forbidden list exemption E7).
 * On the vehicle screen the sketch is the stage; on every other screen of
 * the scope it sits small at the right of the header row. Leaving the
 * vehicle screen, the browser moves the sketch from the stage into this
 * corner (the two carry one view transition name, React pairs them); coming
 * back, it grows from here into the stage. The corner car is a link to the
 * vehicle screen, prefetched with its sketch so the way back can pair too.
 */
export interface VehicleDockProps {
  code: DrawingCode;
  href: string;
  label: string;
}

export function VehicleDock({ code, href, label }: VehicleDockProps) {
  // Null on the vehicle screen itself: the sketch is on the stage there.
  const segment = useSelectedLayoutSegment();
  if (segment === null) return null;
  return (
    <ViewTransition name={vehicleTransitionName(code)} share={VEHICLE_DOCK} default="none">
      <Link href={href} prefetch className="workspace-dock" aria-label={label}>
        <VehicleDrawing drawing={drawingFor(code, "side")} size="card" />
      </Link>
    </ViewTransition>
  );
}
