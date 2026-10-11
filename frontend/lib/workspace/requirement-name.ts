import { domainName } from "@/lib/content/markets";
import type { DomainKey } from "@/lib/content/types";

/*
 * How a requirement is named on screen. The backend's id
 * (REQ-<vehicle>-<market>-<area>-<nn>) keys the decisions, the audit trail
 * and the exports, but it is a key, not a name: the screens show the
 * requirement's title and its customer area, and the id appears once, as
 * the reference on the requirement's own page.
 */
const AREA: Record<string, DomainKey> = {
  DA: "driver_assistance",
  DD: "driving_dynamics",
  EX: "exterior_design",
  GE: "general",
  IC: "interior_comfort",
  ID: "infotainment_digital",
  PR: "powertrain_range_charging",
  QN: "quality_nvh",
  SP: "space_practicality",
};

/** The customer area of a requirement, read from its id; the id itself where the code is unknown. */
export function requirementArea(id: string): string {
  const code = id.split("-")[3];
  const key = code ? AREA[code] : undefined;
  return key ? domainName(key) : id;
}
