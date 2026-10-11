import { exportResponse } from "../export";

/*
 * The D2 list of a scope as CSV (plan 08 section 4.4), as the backend's
 * exporter writes it: one row per requirement with its fields, its effort
 * and its latest decision (GET /requirements/export, step 19), from the
 * snapshot or, in the live mode, the API. The file name carries the scope
 * and the date of the read.
 */
export async function GET(_request: Request, context: RouteContext<"/markets/[market]/[vehicle]/log/requirements.csv">): Promise<Response> {
  const { market, vehicle } = await context.params;
  return exportResponse(market, vehicle, "csv");
}
