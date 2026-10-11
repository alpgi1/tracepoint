import { exportResponse } from "../export";

/* The D2 list of a scope as Markdown, for reading: the same exporter and the same read as the CSV. */
export async function GET(_request: Request, context: RouteContext<"/markets/[market]/[vehicle]/log/requirements.md">): Promise<Response> {
  const { market, vehicle } = await context.params;
  return exportResponse(market, vehicle, "md");
}
