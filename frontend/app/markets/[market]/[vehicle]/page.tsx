import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StagePending } from "@/components/workspace/source-line";
import { VehicleWorkspace } from "@/components/workspace/vehicle-workspace";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import type { CpmView } from "@/lib/content/cpm-types";
import { allVehicleParams, marketByCode, vehicleIn } from "@/lib/content/markets";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { readWorkspace } from "@/lib/data/workspace";
import { stageFigures } from "@/lib/workspace/figures";
import { bridgesFor } from "@/lib/workspace/requirements";

/*
 * Stage 1, the vehicle screen. The CPM view and the catalogue are build
 * content; the stage bar's figures and the three bridges come from the
 * workspace read at request time (the snapshot, or the API in the live
 * mode, D-085), behind the Suspense boundary.
 */
export function generateStaticParams() {
  return allVehicleParams();
}

export async function generateMetadata({ params }: PageProps<"/markets/[market]/[vehicle]">): Promise<Metadata> {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) return {};
  return { title: `${v.name} in ${m.name}` };
}

export default async function VehiclePage({ params }: PageProps<"/markets/[market]/[vehicle]">) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  const view = m && v ? cpmView(v.code, m.code) : undefined;
  if (!m || !v || !view) notFound();
  return (
    <Suspense fallback={<StagePending />}>
      <VehicleBody market={m} vehicle={v} view={view} />
    </Suspense>
  );
}

async function VehicleBody({ market, vehicle, view }: { market: MarketContent; vehicle: VehicleContent; view: CpmView }) {
  const read = await readWorkspace(vehicle.code, market.code);
  const snapshot = read?.snapshot;
  const figures = stageFigures(vehicle, market.code, snapshot);
  const bridges = snapshot && snapshot.requirements.length > 0 ? bridgesFor(snapshot, view) : undefined;
  return <VehicleWorkspace market={market} vehicle={vehicle} cpm={{ catalogue: cpmCatalogue(), view }} figures={figures} bridges={bridges} />;
}
