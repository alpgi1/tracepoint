import { vehicleHref } from "@/lib/content/markets";
import type { MarketCode } from "@/lib/content/types";
import type { StageCounts } from "./candidates";

/*
 * The five stages of the scope workspace (plan 08 section 3.1): one route
 * each under /markets/[market]/[vehicle]. A stage without a page yet is
 * listed without a link; the bar never pretends a screen exists.
 */
export type StageKey = "situation" | "structure" | "requirements" | "priorities" | "documentation";

export const STAGES: StageKey[] = ["situation", "structure", "requirements", "priorities", "documentation"];

/** The route segment of a stage, or null while its page is not built. */
export const STAGE_SEGMENT: Record<StageKey, string | null> = {
  situation: "",
  structure: "structure",
  requirements: null,
  priorities: null,
  documentation: null,
};

export function stageHref(market: MarketCode, vehicle: string, stage: StageKey): string | null {
  const segment = STAGE_SEGMENT[stage];
  if (segment === null) return null;
  const base = vehicleHref(market, vehicle);
  return segment ? `${base}/${segment}` : base;
}

/** What the stage bar shows beside each stage: counts of rows the backend serves, or nothing. */
export interface StageFigures {
  /** Stage 1: subsystems on the vehicle and the verbatim count of the market. */
  subsystems: number;
  verbatims: number;
  /** Stages 2 to 5, null where the scope has no requirement set. */
  counts: StageCounts | null;
  /** The H1 package of the scope: effort and class, null without a requirement set. */
  h1Package: { effortPct: number; decision: string } | null;
}
