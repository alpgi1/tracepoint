import type { DrawingCode } from "./drawings";

/**
 * The view transition name the car's side view carries on the vehicle
 * screen and in the header's corner (step 20): React pairs the two, so the
 * browser moves one car between the places instead of removing one and
 * showing the other.
 */
export function vehicleTransitionName(code: DrawingCode): string {
  return `vehicle-${code.toLowerCase()}`;
}

/** The view transition class of that move; globals.css times it. */
export const VEHICLE_DOCK = "vehicle-dock";
