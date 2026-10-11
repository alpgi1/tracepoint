import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RequirementPage } from "@/components/workspace/requirement-page";
import { StageWait } from "@/components/workspace/source-line";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import { marketByCode, vehicleIn } from "@/lib/content/markets";
import { readWorkspace, workspaceScopes, workspaceSnapshot } from "@/lib/data/workspace";
import { pageQuery } from "@/lib/static";
import { requirementBySlug, requirementHref } from "@/lib/workspace/requirements";

/*
 * Stage 3: one requirement of the scope, the D2 record on screen. One route
 * per requirement of every snapshot (57 today); the body reads the
 * workspace at request time (the snapshot, or the API in the live mode
 * with this requirement's detail, D-085) and the outcome of the last
 * decision from the URL, under the scope layout's header.
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

export default function RequirementRoute({ params, searchParams }: Props) {
  return (
    <Suspense fallback={<StageWait />}>
      <RequirementBody params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function RequirementBody({ params, searchParams }: { params: Props["params"]; searchParams: Props["searchParams"] }) {
  const { market, vehicle, id: slug } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  const snapshot = m && v ? workspaceSnapshot(v.code, m.code) : undefined;
  const view = m && v ? cpmView(v.code, m.code) : undefined;
  const stored = snapshot ? requirementBySlug(snapshot, slug) : undefined;
  if (!m || !v || !view || !stored) notFound();
  const id = stored.requirement.id;
  const [read, query] = await Promise.all([readWorkspace(v.code, m.code, { detailOf: id }), pageQuery(searchParams)]);
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
      pathname={requirementHref(m.code, v.code, id)}
      notice={{ decision: one("decision"), reason: one("reason") }}
    />
  );
}
