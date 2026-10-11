import { notFound } from "next/navigation";
import { Suspense } from "react";
import { WorkspaceHeader, WorkspaceHeaderFrame } from "@/components/workspace/workspace-header";
import { marketByCode, vehicleIn } from "@/lib/content/markets";
import { readScope, workspaceSnapshot } from "@/lib/data/workspace";
import { scopeContent, stageFigures } from "@/lib/workspace/figures";

/*
 * The scope workspace (step 20): one vehicle in one market. The header (the
 * Map chip, the vehicle, the car in the corner, the stage bar) belongs to
 * this layout, so it stays on screen while the product manager moves
 * between the stages and their pages; only the screen below it changes.
 * The route's parameters are read behind the Suspense boundary, so a link
 * into any scope can prefetch the same frame (Partial Prefetching), and a
 * link that prefetches its own URL (the vehicle cards on the map) carries
 * the whole header. The stage figures show the stored workspace at once and
 * the live one when it is read (the snapshot mode reads the same).
 */
export default function ScopeLayout({ children, params }: LayoutProps<"/markets/[market]/[vehicle]">) {
  return (
    <div className="workspace">
      <Suspense fallback={<WorkspaceHeaderFrame />}>
        <ScopeHeader params={params} />
      </Suspense>
      {children}
    </div>
  );
}

async function ScopeHeader({ params }: { params: LayoutProps<"/markets/[market]/[vehicle]">["params"] }) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) notFound();
  const stored = workspaceSnapshot(v.code, m.code);
  const live = readScope(v.code, m.code).then((read) => stageFigures(v, m.code, read?.snapshot));
  return <WorkspaceHeader market={m} vehicle={v} scope={scopeContent(v.code, m.code, stored)} stored={stageFigures(v, m.code, stored)} live={live} />;
}
