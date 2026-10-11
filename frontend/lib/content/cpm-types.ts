import type { DomainKey, MarketCode } from "./types";

/**
 * Shape of content/cpm.json: the backend's GET /effort/model (the catalogue
 * part: method, subsystems with weights and links, mapping, domains, the
 * vehicles' profiles and the engine's rules) and GET /cpm/{vehicle}?market=
 * per vehicle and market pair (one `CpmView` each), written unchanged by
 * scripts/snapshot.mjs (step 19, D-101). The backend's tests hold the two
 * equal for a fresh ingest.
 */
export type CpmSubsystemKey =
  | "body_structure"
  | "chassis"
  | "powertrain"
  | "hv_battery"
  | "thermal_hvac"
  | "ee_architecture"
  | "software_hmi"
  | "interior_console"
  | "seats"
  | "exterior_design"
  | "paint_color"
  | "charging";

/** A direct propagation link of the team's matrix (assumption, not calibrated). */
export interface CpmLink {
  to: CpmSubsystemKey;
  /** Probability that a change in the source forces a change in the target, 0 to 1. */
  likelihood: number;
  /** Share of the target's design work redone if it does, 0 to 1. */
  impact: number;
  /** The physical or functional interface behind the link, from the model file. */
  why: string;
}

export interface CpmSubsystem {
  key: CpmSubsystemKey;
  name: string;
  /** Share of a new vehicle's development effort; the twelve weights sum to 100. */
  weight: number;
  /** Where the weight comes from, from the model file. */
  basis: string;
  /** A change with own impact of 0.3 or more re-runs crash, emission or range tests. */
  certificationTrigger: boolean;
  links: CpmLink[];
}

export interface CpmMethod {
  name: string;
  reference: string;
  url: string;
  engine: string;
  modelSource: string;
  modelVersion: number;
  basis: string;
  thresholds: { adaptBelowPercent: number; newGenerationFromPercent: number };
  certificationAddOnPercent: number;
}

export interface CpmCatalogue {
  generatedAt: string;
  method: CpmMethod;
  subsystems: CpmSubsystem[];
  mapping: { source: string; themes: number; unassigned: string[] };
  marketContextSource: string;
  narrationSource: string;
  domains: Record<DomainKey, string>;
}

/** One customer verbatim, copied as written; `evidenceRef` resolves through GET /verbatims/{id}. */
export interface CpmQuote {
  id: string;
  evidenceRef: string;
  text: string;
  source: string;
  powertrain: string | null;
  country: string;
}

export interface CpmLikedTheme {
  theme: string;
  domain: DomainKey;
  rows: number;
  likes: number;
  quotes: CpmQuote[];
}

export interface CpmCriticisedTheme {
  theme: string;
  domain: DomainKey;
  rows: number;
  complaints: number;
  defects: number;
  difficultToUse: number;
  wants: number;
  quotes: CpmQuote[];
}

export type CpmEvidenceLevel = "strong" | "medium" | "weak";
export type CpmEvidenceKind = "market" | "competitor";
export type CpmSourceType = "primary" | "secondary";
export type CpmBasis = "evidence" | "assumption";

/** A market or competitor statement with its source (rules 31 to 36 of the team's rule set). */
export interface CpmMarketRow {
  kind: CpmEvidenceKind;
  statement: string;
  source: { title: string; url: string; date: string; type: CpmSourceType };
  level: CpmEvidenceLevel;
  basis: CpmBasis;
  note: string | null;
  /** Both sides of a contradiction, never averaged (rule 35). */
  contradiction: { for: string; against: string } | null;
}

/**
 * The one-sentence suggestion and the few-sentence summary of a block.
 * `derived`: template text from the counts and the finding rules (the content
 * build); `agent`: written by the backend's agent (same fields).
 */
export interface CpmNarration {
  suggestion: string;
  summary: string;
  basis: "derived" | "agent";
}

export interface CpmBlock<T> {
  /** Null where the market has no classified verbatims. */
  narration: CpmNarration | null;
  /** Up to six themes, ranked by likes or by complaints. */
  themes: T[];
}

export interface CpmSubsystemView {
  key: CpmSubsystemKey;
  /** The subsystem's weight on this vehicle: renormalised to 100 over the subsystems present. */
  weight: number;
  /** Classified verbatim rows whose theme maps to this subsystem. */
  rows: number;
  likes: number;
  complaints: number;
  /** Distinct themes with rows in this subsystem. */
  themes: number;
  liked: CpmBlock<CpmLikedTheme>;
  criticised: CpmBlock<CpmCriticisedTheme>;
  market: CpmMarketRow[];
}

/** A subsystem the model leaves off this vehicle, with the rows whose themes fall in it. */
export interface CpmAbsentSubsystem {
  key: CpmSubsystemKey;
  name: string;
  rows: number;
}

export interface CpmView {
  vehicle: string;
  market: MarketCode;
  verbatims: number;
  platform: string | null;
  absent: CpmAbsentSubsystem[];
  absentNote: string | null;
  rows: number;
  unassignedRows: number;
  rowsSource: string;
  /** The subsystems present on this vehicle, in the model's order. */
  subsystems: CpmSubsystemView[];
}

export interface CpmContent extends CpmCatalogue {
  views: Record<string, CpmView>;
}
