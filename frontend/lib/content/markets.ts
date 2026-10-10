import raw from "@/content/markets.json";
import type { DomainKey, MarketCode, MarketContent, MarketsContent, VehicleContent } from "./types";

export const content = raw as MarketsContent;

export function marketByCode(code: string): MarketContent | undefined {
  const upper = code.toUpperCase();
  return content.markets.find((m) => m.code === upper);
}

export function vehicleIn(market: MarketContent, code: string): VehicleContent | undefined {
  const upper = code.toUpperCase();
  return market.vehicles.find((v) => v.code === upper);
}

export function domainName(key: DomainKey): string {
  return content.domains.find((d) => d.key === key)?.name ?? key;
}

/** Route segments are lower case: /markets/eu/f70. */
export function vehicleHref(market: MarketCode, vehicle: string): string {
  return `/markets/${market.toLowerCase()}/${vehicle.toLowerCase()}`;
}

export function allVehicleParams(): { market: string; vehicle: string }[] {
  return content.markets.flatMap((m) => m.vehicles.map((v) => ({ market: m.code.toLowerCase(), vehicle: v.code.toLowerCase() })));
}
