import raw from "@/content/cpm.json";
import type { CpmCatalogue, CpmContent, CpmSubsystem, CpmSubsystemView, CpmView } from "./cpm-types";

/*
 * Loader for the CPM content. Imported by the vehicle page (a server
 * component) only: the page hands the catalogue and the one view it needs to
 * the workspace, so the browser never receives the other views. When the
 * backend's CPM endpoints exist this module is the one place to swap.
 */
// The JSON's string fields are wider than the literal unions of the contract (kind, level, basis); the build script validates them.
const content = raw as unknown as CpmContent;

export function cpmCatalogue(): CpmCatalogue {
  const { generatedAt, method, subsystems, mapping, marketContextSource, domains } = content;
  return { generatedAt, method, subsystems, mapping, marketContextSource, domains };
}

export function cpmView(vehicle: string, market: string): CpmView | undefined {
  return content.views[`${vehicle.toUpperCase()}_${market.toUpperCase()}`];
}

/** The twelve subsystems by weight, heaviest first; ties by name. */
export function subsystemsByWeight(catalogue: CpmCatalogue): CpmSubsystem[] {
  return [...catalogue.subsystems].sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name));
}

export function subsystemView(view: CpmView, key: CpmSubsystem["key"]): CpmSubsystemView | undefined {
  return view.subsystems.find((s) => s.key === key);
}

export function subsystemName(catalogue: CpmCatalogue, key: CpmSubsystem["key"]): string {
  return catalogue.subsystems.find((s) => s.key === key)?.name ?? key;
}
