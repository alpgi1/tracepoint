import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RequirementPage } from "@/components/workspace/requirement-page";
import { StagePending } from "@/components/workspace/source-line";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import type { CpmView } from "@/lib/content/cpm-types";
import { marketByCode, vehicleIn } from "@/lib/content/markets";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { readWorkspace, workspaceScopes, workspaceSnapshot } from "@/lib/data/workspace";
import { stageFigures } from "@/lib/workspace/figures";
import { requirementBySlug, requirementHref } from "@/lib/workspace/requirements";

/*
 * Stage 3: one requirement of the scope, the D2 record on screen. One route
 * per requirement of every snapshot (57 today); the body reads the
 * workspace at request time (the snapshot, or the API in the live mode
 * with this requirement's detail, D-085) and the outcome of the last
 * decision from the URL.
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

export default async function RequirementRoute({ params, searchParams }: Props) {
  const { market, vehicle, id } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  const snapshot = m && v ? workspaceSnapshot(v.code, m.code) : undefined;
  const view = m && v ? cpmView(v.code, m.code) : undefined;
  const record = snapshot ? requirementBySlug(snapshot, id) : undefined;
  if (!m || !v || !snapshot || !view || !record) notFound();
  return (
    <Suspense fallback={<StagePending />}>
      <RequirementBody market={m} vehicle={v} view={view} id={record.requirement.id} searchParams={searchParams} />
    </Suspense>
  );
}

interface BodyProps {
  market: MarketContent;
  vehicle: VehicleContent;
  view: CpmView;
  id: string;
  searchParams: Props["searchParams"];
}

async function RequirementBody({ market: m, vehicle: v, view, id, searchParams }: BodyProps) {
  const [read, query] = await Promise.all([readWorkspace(v.code, m.code, { detailOf: id }), searchParams]);
  const record = read ? requirementBySlug(read.snapshot, id) : undefined;
  if (!read || !record) notFound();
  const one = (key: string) => (typeof query[key] === "string" ? query[key] : undefined);
  return (
    <RequirementPage
      market={m}
      vehicle={v}
      read={read}
      record={record}
      catalogue={cpmCatalogue()}
      view={view}
      figures={stageFigures(v, m.code, read.snapshot)}
      pathname={requirementHref(m.code, v.code, id)}
      notice={{ decision: one("decision"), reason: one("reason") }}
    />
  );
}
