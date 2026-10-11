import type { ExternalRow, ExternalView } from "@/lib/content/brief-types";
import type { CpmSubsystemKey, CpmView } from "@/lib/content/cpm-types";

/** What the subsystem dialog shows of the external evidence: the count and the first rows, in the backend's order. */
export interface SubsystemEvidence {
  count: number;
  verified: number;
  rows: ExternalRow[];
}

/** Rows the dialog lists before it links to the market evidence page. */
export const DIALOG_ROWS = 3;

/** The external statements of a scope per subsystem of the vehicle; a statement counts for every subsystem it names (step 19). */
export function marketEvidenceBySubsystem(external: ExternalView, view: CpmView): Partial<Record<CpmSubsystemKey, SubsystemEvidence>> {
  const out: Partial<Record<CpmSubsystemKey, SubsystemEvidence>> = {};
  for (const { key } of view.subsystems) {
    const rows = external.items.filter((r) => r.subsystems.includes(key));
    if (rows.length > 0) out[key] = { count: rows.length, verified: rows.filter((r) => r.verified).length, rows: rows.slice(0, DIALOG_ROWS) };
  }
  return out;
}
