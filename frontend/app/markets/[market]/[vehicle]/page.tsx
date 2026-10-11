import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VehicleWorkspace } from "@/components/workspace/vehicle-workspace";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import { allVehicleParams, marketByCode, vehicleIn } from "@/lib/content/markets";

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
  return <VehicleWorkspace market={m} vehicle={v} cpm={{ catalogue: cpmCatalogue(), view }} />;
}
