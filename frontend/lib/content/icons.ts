import {
  Armchair,
  BatteryCharging,
  Car,
  CircleDot,
  Gauge,
  Layers,
  MonitorSmartphone,
  Package,
  Radar,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { DomainKey } from "./types";

/** One icon per requirement domain, from the one icon set (Lucide). */
export const DOMAIN_ICONS: Record<DomainKey, LucideIcon> = {
  exterior_design: Car,
  interior_comfort: Armchair,
  space_practicality: Package,
  infotainment_digital: MonitorSmartphone,
  driver_assistance: Radar,
  powertrain_range_charging: BatteryCharging,
  driving_dynamics: Gauge,
  quality_nvh: ShieldCheck,
  offering_variants: Layers,
  general: CircleDot,
};
