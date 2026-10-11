import { vehicleHref } from "@/lib/content/markets";
import type { MarketCode } from "@/lib/content/types";
import type { StageCounts } from "./candidates";

/*
 * The five stages of the scope workspace (plan 08 section 3.1): one route
 * each under /markets/[market]/[vehicle]. A stage the backend holds nothing
 * for in this scope is listed without a link and its route does not exist
 * (step 19): stages 3 to 5 need a requirement set, stage 2 a requirement set
 * or an analyst brief. The bar never pretends a screen exists.
 */
export type StageKey = "situation" | "structure" | "requirements" | "priorities" | "documentation";

export const STAGES: StageKey[] = ["situation", "structure", "requirements", "priorities", "documentation"];

/** The route segment of a stage. */
export const STAGE_SEGMENT: Record<StageKey, string> = {
  situation: "",
  structure: "structure",
  requirements: "requirements",
  priorities: "priorities",
  documentation: "log",
};

/** What the backend holds for one vehicle in one market, beyond the situation analysis every scope has. */
export interface ScopeContent {
  /** The scope carries a requirement set: the candidates of stage 2 and stages 3 to 5. */
  requirements: boolean;
  /** The situation analysis that speaks about the scope, with its number of proposals. */
  brief: { key: string; proposals: number; country: string | null } | null;
  /** The series analysis that covers the scope, with its number of topics. */
  series: { key: string; topics: number; series: string } | null;
}

/**
 * The stage a route segment under the scope layout belongs to (step 20): the
 * vehicle screen is the null segment, its pages (the series across the
 * regions, the market evidence) belong to stage 1, a requirement page to
 * stage 3, the method sheet to stage 4.
 */
export function stageOfSegment(segment: string | null): StageKey {
  switch (segment) {
    case "structure":
      return "structure";
    case "requirements":
      return "requirements";
    case "priorities":
      return "priorities";
    case "log":
      return "documentation";
    default:
      return "situation";
  }
}

export function stageAvailable(stage: StageKey, scope: ScopeContent): boolean {
  switch (stage) {
    case "situation":
      return true;
    case "structure":
      return scope.requirements || scope.brief !== null;
    default:
      return scope.requirements;
  }
}

export function stageHref(market: MarketCode, vehicle: string, stage: StageKey, scope?: ScopeContent): string | null {
  if (scope && !stageAvailable(stage, scope)) return null;
  const segment = STAGE_SEGMENT[stage];
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
  /** Which stages hold anything in this scope. */
  scope: ScopeContent;
}
