import { marketByCode, vehicleIn } from "@/lib/content/markets";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { scopesWithRequirements } from "@/lib/data/workspace";
import { site } from "@/lib/site";

/** The one sentence every stage shows for a scope without a requirement set: which scopes have one. */
export function NoRequirements({ market, vehicle }: { market: MarketContent; vehicle: VehicleContent }) {
  const copy = site.structure;
  const others = scopesWithRequirements()
    .map((s) => {
      const om = marketByCode(s.market);
      const ov = om ? vehicleIn(om, s.vehicle) : undefined;
      return om && ov ? `${ov.name} ${ov.code}, ${om.name}` : `${s.vehicle}, ${s.market}`;
    })
    .join("; ");
  return (
    <p className="stage-empty">
      {copy.noRequirementsBefore} {vehicle.name} {vehicle.code} in {market.name} {copy.noRequirementsMiddle} {others}
      {copy.noRequirementsAfter}
    </p>
  );
}
