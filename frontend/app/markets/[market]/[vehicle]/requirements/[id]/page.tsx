import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RequirementPage } from "@/components/workspace/requirement-page";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import { marketByCode, vehicleIn } from "@/lib/content/markets";
import { workspaceScopes, workspaceSnapshot } from "@/lib/data/workspace";
import { stageFigures } from "@/lib/workspace/figures";
import { requirementBySlug } from "@/lib/workspace/requirements";

/*
 * Stage 3: one requirement of the scope, the D2 record on screen. A static
 * route per requirement of every snapshot (57 today), rendered on the
 * server from the committed snapshot.
 */
export function generateStaticParams() {
  return workspaceScopes().flatMap((s) => s.requirements.map((r) => ({ market: s.market.toLowerCase(), vehicle: s.vehicle.toLowerCase(), id: r.id.toLowerCase() })));
}

type Props = PageProps<"/markets/[market]/[vehicle]/requirements/[id]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market, vehicle, id } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  const snapshot = m && v ? workspaceSnapshot(v.code, m.code) : undefined;
  const record = snapshot ? requirementBySlug(snapshot, id) : undefined;
  if (!m || !v || !record) return {};
  return { title: `${record.requirement.id} · ${v.name} in ${m.name}` };
}

export default async function RequirementRoute({ params }: Props) {
  const { market, vehicle, id } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  const snapshot = m && v ? workspaceSnapshot(v.code, m.code) : undefined;
  const view = m && v ? cpmView(v.code, m.code) : undefined;
  const record = snapshot ? requirementBySlug(snapshot, id) : undefined;
  if (!m || !v || !snapshot || !view || !record) notFound();
  return (
    <RequirementPage
      market={m}
      vehicle={v}
      snapshot={snapshot}
      record={record}
      catalogue={cpmCatalogue()}
      view={view}
      figures={stageFigures(v, m.code, snapshot)}
    />
  );
}
