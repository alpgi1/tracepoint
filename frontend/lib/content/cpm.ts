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
  const { generatedAt, method, subsystems, mapping, marketContextSource, narrationSource, domains } = content;
  return { generatedAt, method, subsystems, mapping, marketContextSource, narrationSource, domains };
}

export function cpmView(vehicle: string, market: string): CpmView | undefined {
  return content.views[`${vehicle.toUpperCase()}_${market.toUpperCase()}`];
}

export interface CpmRow {
  subsystem: CpmSubsystem;
  entry: CpmSubsystemView;
}

/** The subsystems present on the vehicle by their weight on it, heaviest first; ties by name. */
export function subsystemsByWeight(catalogue: CpmCatalogue, view: CpmView): CpmRow[] {
  const rows: CpmRow[] = [];
  for (const entry of view.subsystems) {
    const subsystem = catalogue.subsystems.find((s) => s.key === entry.key);
    if (subsystem) rows.push({ subsystem, entry });
  }
  return rows.sort((a, b) => b.entry.weight - a.entry.weight || a.subsystem.name.localeCompare(b.subsystem.name));
}

export function subsystemView(view: CpmView, key: CpmSubsystem["key"]): CpmSubsystemView | undefined {
  return view.subsystems.find((s) => s.key === key);
}

export function subsystemName(catalogue: CpmCatalogue, key: CpmSubsystem["key"]): string {
  return catalogue.subsystems.find((s) => s.key === key)?.name ?? key;
}
