import { marketByCode, vehicleIn } from "@/lib/content/markets";
import { EXPORT_TYPES, type ExportFormat, readExport } from "@/lib/data/exports";
import { readWorkspace } from "@/lib/data/workspace";

/** One download of the D2 list of a scope (CSV or Markdown); 404 where the scope has no requirement set. */
export async function exportResponse(market: string, vehicle: string, format: ExportFormat): Promise<Response> {
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  const read = m && v ? await readWorkspace(v.code, m.code) : undefined;
  const body = read && read.snapshot.requirements.length > 0 ? await readExport(read, format) : null;
  if (!m || !v || !read || body === null) return new Response("Not found", { status: 404 });
  const day = (read.readAt ?? read.snapshot.snapshot.takenAt).slice(0, 10);
  return new Response(body, {
    headers: {
      "content-type": EXPORT_TYPES[format],
      "content-disposition": `attachment; filename="requirements-${v.code}-${m.code}-${day}.${format}"`,
      "cache-control": "no-store",
    },
  });
}
