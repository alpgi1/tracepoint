import { marketByCode, vehicleIn } from "@/lib/content/markets";
import { readWorkspace } from "@/lib/data/workspace";
import { requirementsCsv } from "@/lib/workspace/log";

/*
 * The D2 list of a scope as CSV (plan 08 section 4.4): one row per
 * requirement with the API's fields and the latest decision beside them,
 * from the same workspace read as the pages (the snapshot, or the API in
 * the live mode). The file name carries the scope and the date of the read.
 */
export async function GET(_request: Request, context: RouteContext<"/markets/[market]/[vehicle]/log/requirements.csv">): Promise<Response> {
  const { market, vehicle } = await context.params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  const read = m && v ? await readWorkspace(v.code, m.code) : undefined;
  if (!m || !v || !read) return new Response("Not found", { status: 404 });
  const day = (read.readAt ?? read.snapshot.snapshot.takenAt).slice(0, 10);
  return new Response(requirementsCsv(read.snapshot), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="requirements-${v.code}-${m.code}-${day}.csv"`,
      "cache-control": "no-store",
    },
  });
}
