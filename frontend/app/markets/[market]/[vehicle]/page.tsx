import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VehicleWorkspace } from "@/components/workspace/vehicle-workspace";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import { allVehicleParams, marketByCode, vehicleIn } from "@/lib/content/markets";
import { workspaceSnapshot } from "@/lib/data/workspace";
import { stageFigures } from "@/lib/workspace/figures";
import { bridgesFor } from "@/lib/workspace/requirements";

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
  const snapshot = workspaceSnapshot(v.code, m.code);
  const figures = stageFigures(v, m.code, snapshot);
  const bridges = snapshot && snapshot.requirements.length > 0 ? bridgesFor(snapshot, view) : undefined;
  return <VehicleWorkspace market={m} vehicle={v} cpm={{ catalogue: cpmCatalogue(), view }} figures={figures} bridges={bridges} />;
}
