import type { WorkspaceRead } from "./workspace";
import { API_URL } from "./workspace";

/*
 * The requirement list of a scope as the backend's D2 exporter writes it
 * (GET /requirements/export, step 19): CSV and Markdown, each requirement
 * with its effort and its latest gate G2 decision. The snapshot stores both
 * files; in the live mode the export is asked of the API, so a decision
 * shows in the next download, with the stored file as the fallback.
 */
export type ExportFormat = "csv" | "md";

const TIMEOUT_MS = 8000;

export async function readExport(read: WorkspaceRead, format: ExportFormat): Promise<string | null> {
  const stored = read.snapshot.exports?.[format] ?? null;
  if (!read.live) return stored;
  try {
    const q = `vehicle=${read.snapshot.vehicle}&market=${read.snapshot.market}&format=${format}`;
    const response = await fetch(`${API_URL}/requirements/export?${q}`, { cache: "no-store", signal: AbortSignal.timeout(TIMEOUT_MS) });
    return response.ok ? await response.text() : stored;
  } catch {
    return stored;
  }
}

export const EXPORT_TYPES: Record<ExportFormat, string> = { csv: "text/csv; charset=utf-8", md: "text/markdown; charset=utf-8" };
