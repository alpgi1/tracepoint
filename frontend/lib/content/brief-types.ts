import type { CpmSubsystemKey } from "./cpm-types";
import type { DomainKey } from "./types";

/**
 * The analyst briefs and the external evidence as the backend serves them for the product
 * manager (step 19, D-100 and D-102): GET /analyses, GET /analyses/{key}/brief and
 * GET /external, written unchanged into content/analyses/ and content/workspace/ by
 * scripts/snapshot.mjs. Every code arrives with its words (the backend's vocabulary,
 * GET /glossary); every sentence of an agent arrives in plain words and is rendered as text.
 */

/** One evidence reference read back from the store: what it is, in a line a PM can check. */
export interface ReferenceItem {
  ref: string;
  kind: "finding" | "verbatim" | "metric" | "equipment" | "sales" | "spec" | "external" | "document" | "market" | "requirement" | "aggregate" | "unknown";
  label: string;
  /** What it says where that is the point: a customer's words (as written), an external statement. */
  text: string | null;
  meta: string | null;
  /** A web address, only http or https. */
  url: string | null;
  /** External rows: whether the figures stood on the source page. */
  verified: boolean | null;
}

export interface Evidence {
  count: number;
  byKind: { kind: ReferenceItem["kind"]; count: number; label: string }[];
  items: ReferenceItem[];
  /** Series topics: references per region. */
  byRegion?: Record<string, number>;
}

export interface BriefCheck {
  level: "warning" | "conflict";
  levelLabel: string;
  rule: string;
  ruleLabel: string;
  text: string;
}

export interface BriefFootprint {
  key: CpmSubsystemKey;
  name: string;
  effortPct: number;
  risk: number;
  path: string[] | null;
}

interface BriefEstimate {
  effortPct: number;
  p5: number;
  p95: number;
  decision: string;
  decisionLabel: string;
  stablePct: number;
  borderline: boolean;
  layer: string;
  layerLabel: string;
  size: string;
  certification: boolean;
  subsystems: BriefFootprint[];
}

/** The effort engine's answer for one proposal or topic. */
export type BriefEffort = {
  status: "estimated" | "no_vehicle_change" | "missing" | "invalid";
  statusLabel: string;
  /** "from the change profile of REQ-…", "from the analyst's change profile", or null. */
  basis: string | null;
  analystProfile: boolean;
  checks: BriefCheck[];
} & Partial<BriefEstimate>;

export interface BriefPackage extends BriefEstimate {
  horizon: "H1" | "H2";
  label: string;
  proposals: number;
  sumOfSinglePct: number;
  notCounted: string[];
  checks: BriefCheck[];
}

export interface BriefRun {
  id: string;
  ranAt: string | null;
  model: string;
  promptVersion: string;
  steps: number | null;
  toolCalls: number;
  costUsd: number | null;
}

export interface BriefProposal {
  n: number;
  group: "now" | "next" | "keep";
  title: string;
  proposal: string;
  why: string;
  horizon: "H1" | "H2";
  horizonLabel: string;
  requirement: string | null;
  effort: BriefEffort;
  evidence: Evidence;
}

export interface BriefInsight {
  title: string;
  statement: string;
  /** A customer's words as written (E5), or null. */
  quote: string | null;
  domain: DomainKey;
  domainLabel: string;
  confidence: string;
  confidenceLabel: string;
  subsystems: { key: CpmSubsystemKey; name: string; references: number }[];
  evidence: Evidence;
}

interface BriefBase {
  key: string;
  title: string;
  vehicle: string;
  origin: string;
  file: string;
  headline: string;
  packages: BriefPackage[];
  openChecks: string[];
  effortMethod: string;
  modelHash: string;
}

export interface SituationBrief extends BriefBase {
  kind: "situation";
  market: string;
  country: string | null;
  run: BriefRun & { contextPack: string | null };
  summary: string;
  coverage: string;
  proposalGroups: { group: BriefProposal["group"]; label: string; proposals: number[] }[];
  proposals: BriefProposal[];
  customers: { group: string; label: string; items: BriefInsight[] }[];
  assumptions: string[];
  citations: { cited: number; unknown: string[]; quotesLeftOut: number };
}

export type SeriesDecision = "change_now_all_markets" | "change_now_regional" | "next_generation" | "keep" | "no_action";

export interface SeriesRegion {
  label: string;
  name: string;
  vehicle: string;
  market: string;
  verbatims: number;
  sales2025: number | null;
  sales2030: number | null;
  complaintRows: number | null;
  likeRows: number | null;
  findings: number | null;
  requirements: number | null;
  study: string | null;
  expects: string[];
}

export interface SeriesTopic {
  n: number;
  title: string;
  decision: SeriesDecision;
  decisionLabel: string;
  targetRegions: string[];
  everywhere: boolean;
  action: string;
  why: string;
  ourOffer: string | null;
  rivals: string | null;
  confidence: string;
  confidenceLabel: string;
  regions: { region: string; customers: string; market: string | null; weight: string; weightLabel: string }[];
  requirement: string | null;
  effort: BriefEffort;
  subsystems: { key: CpmSubsystemKey; name: string; references: number }[];
  evidence: Evidence;
}

export interface SeriesBrief extends BriefBase {
  kind: "series";
  series: string;
  run: BriefRun & { packVersion: string | null };
  answer: string;
  regions: SeriesRegion[];
  decisions: { decision: SeriesDecision; label: string; explain: string; topics: number[] }[];
  topics: SeriesTopic[];
  optimum: { everyMarket: string[]; regional: { region: string; items: string[] }[]; nextGeneration: string[]; keep: string[] };
  unknowns: string[];
  citations: { cited: number; unknown: string[] };
}

export type Brief = SituationBrief | SeriesBrief;

/** One line of GET /analyses. */
export interface AnalysisSummary {
  key: string;
  kind: "situation" | "series";
  title: string;
  vehicle: string;
  market: string | null;
  country: string | null;
  series: string | null;
  scopes: { vehicle: string; market: string; country: string | null }[];
  headline: string;
  items: number;
  runId: string;
  ranAt: string | null;
  model: string;
  promptVersion: string;
  origin: string;
  file: string;
}

export interface AnalysesIndex {
  snapshot: { takenAt: string; api: string; codeVersion: string | null; endpoints: Record<string, string> };
  items: AnalysisSummary[];
}

/** One row of GET /external: a statement of the team's external sources, with its words. */
export interface ExternalRow {
  id: string;
  evidence_ref: string;
  kind: string;
  kindLabel: string;
  statement: string;
  regions: string[];
  regionNames: string[];
  subsystems: CpmSubsystemKey[];
  subsystemNames: string[];
  vehicles: string[];
  topic: string | null;
  level: "strong" | "medium" | "weak";
  levelLabel: string;
  sources_agreeing: number;
  basis: "evidence" | "assumption";
  basisLabel: string;
  trust: number;
  trustLabel: string;
  verification: string;
  verificationLabel: string;
  verified: boolean;
  aboutVehicle: boolean;
  source: { title: string; origin: string; url: string | null; date: string | null; type: string };
  contradiction: { for: string; against: string } | null;
}

export interface ExternalView {
  market: string;
  marketName: string;
  vehicle: string | null;
  total: number;
  verified: number;
  aboutVehicle: number;
  bySubsystem: Partial<Record<CpmSubsystemKey, number>>;
  topics: string[];
  items: ExternalRow[];
}
