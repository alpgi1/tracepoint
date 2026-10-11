import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StageWait } from "@/components/workspace/source-line";
import { VehicleAside, VehicleStage } from "@/components/workspace/vehicle-workspace";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import type { CpmView } from "@/lib/content/cpm-types";
import { allVehicleParams, marketByCode, vehicleHref, vehicleIn } from "@/lib/content/markets";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { readScope } from "@/lib/data/workspace";
import { scopeContent } from "@/lib/workspace/figures";
import { marketEvidenceBySubsystem } from "@/lib/workspace/market";
import { bridgesFor } from "@/lib/workspace/requirements";

/*
 * Stage 1, the vehicle screen. The header is the scope layout's. The stage
 * (the side and top view) depends on the vehicle only and renders as soon
 * as the route's parameters are known, so a prefetching link carries it and
 * the car can move between the stage and the header's corner (step 20). The
 * subsystems with the three bridges and the market evidence per subsystem
 * come from the workspace read at request time (the snapshot, or the API in
 * the live mode, D-085), behind their own Suspense boundary.
 */
export function generateStaticParams() {
  return allVehicleParams();
}

type Props = PageProps<"/markets/[market]/[vehicle]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) return {};
  return { title: `${v.name} in ${m.name}` };
}

export default function VehiclePage({ params }: Props) {
  return (
    <Suspense fallback={<StageWait />}>
      <VehicleScreen params={params} />
    </Suspense>
  );
}

async function VehicleScreen({ params }: { params: Props["params"] }) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  const view = m && v ? cpmView(v.code, m.code) : undefined;
  if (!m || !v || !view) notFound();
  return (
    <div className="workspace-body">
      <VehicleStage code={v.drawing} />
      <Suspense fallback={<aside className="workspace-domains" aria-busy="true" />}>
        <VehicleEvidence market={m} vehicle={v} view={view} />
      </Suspense>
    </div>
  );
}

async function VehicleEvidence({ market, vehicle, view }: { market: MarketContent; vehicle: VehicleContent; view: CpmView }) {
  const read = await readScope(vehicle.code, market.code);
  const snapshot = read?.snapshot;
  const scope = scopeContent(vehicle.code, market.code, snapshot);
  const bridges = snapshot && snapshot.requirements.length > 0 ? bridgesFor(snapshot, view) : undefined;
  const base = vehicleHref(market.code, vehicle.code);
  const links = {
    market: snapshot && snapshot.external.total > 0 ? { href: `${base}/market`, statements: snapshot.external.total } : null,
    regions: scope.series ? { href: `${base}/regions`, series: scope.series.series } : null,
  };
  return (
    <VehicleAside
      market={market}
      vehicle={vehicle}
      cpm={{ catalogue: cpmCatalogue(), view }}
      bridges={bridges}
      evidence={snapshot ? marketEvidenceBySubsystem(snapshot.external, view) : {}}
      links={links}
    />
  );
}
