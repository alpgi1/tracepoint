import type { CpmSubsystemKey } from "./cpm-types";
import type { DomainKey, MarketCode } from "./types";

/**
 * Shape of content/workspace/<VEHICLE>_<MARKET>.json, written by
 * scripts/snapshot-workspace.mjs from the backend API's own responses, field
 * for field (plan 08 section 6). The same types describe the live reads of
 * the workspace: GET /requirements, GET /effort/requirements,
 * GET /effort/scenarios and GET /events. The backend's field names are kept
 * (snake_case) so a snapshot and a live response are the same object.
 */
export type RequirementStatus = "proposed" | "approved" | "rejected" | "deferred" | "withdrawn";
export type Horizon = "H1" | "H2";
export type EvidenceLevel = "A" | "B" | "C" | "D";
export type CriterionBasis = "evidence" | "assumption";
export type FindingRole = "primary" | "supporting" | "context";

/** One acceptance criterion, per market where expectations differ (D-013). */
export interface Criterion {
  market: string;
  metric: string;
  target: string;
  method: string;
  /** A measured study value or the agent's proposal for the PM (D-060). */
  basis: CriterionBasis;
}

export interface LinkedFinding {
  id: string;
  role: FindingRole;
  title: string | null;
}

/** One row of GET /requirements (deliverable D2 fields; D-060). */
export interface Requirement {
  id: string;
  vehicle: string;
  market: string;
  domain: DomainKey;
  title: string;
  statement: string;
  /** The agent's 0/1 proposal: implement or not. Not-recommended candidates stay visible. */
  recommend: boolean;
  recommend_rationale: string;
  horizon: Horizon;
  horizon_rationale: string;
  markets: string[];
  criteria: Criterion[];
  assumptions: string[];
  uncertainties: string[];
  /** The best level of the primary and supporting findings (D-037). */
  evidence_level: EvidenceLevel;
  /** Phase 5 score; null until it is built. */
  priority_score: number | null;
  /** Gate G2 state of this version (D-061). */
  status: RequirementStatus;
  version: number;
  findings: LinkedFinding[];
}

/** `change`: a change profile; `preserve`: protects a strength, nothing changes; `no_vehicle_change`: no change on the vehicle. */
export type EffortKind = "change" | "preserve" | "no_vehicle_change";
export type EffortDecision = "adapt" | "major revision" | "new generation" | "no change";
export type EffortLayer = "K0" | "K1" | "K2" | "K3";
export type EffortSize = "XS" | "S" | "M" | "L" | "XL" | "-";
export type FlagLevel = "info" | "warning" | "conflict";

/** One change of a requirement's profile (config/effort/requirements/*.yaml, D-063). */
export interface EffortChange {
  subsystem: CpmSubsystemKey;
  /** Share of the subsystem's design redone, 0 to 1. */
  own_impact: number;
  layer: EffortLayer;
  carryover: boolean;
  why: string;
  /** Terms searched in the option-list catalogues (rule 43). */
  portfolio_terms: string[];
}

/** A subsystem the change reaches, with the strongest propagation path (rule 52). */
export interface EffortSubsystem {
  subsystem: CpmSubsystemKey;
  name: string;
  /** Probability that the subsystem is touched, 0 to 1. */
  risk: number;
  /** Its share of the effort in % of a new vehicle. */
  effort_pct: number;
  /** Subsystem names from the change's source to this one; null where the change starts here. */
  path: string[] | null;
}

export interface PortfolioScan {
  subsystem: CpmSubsystemKey;
  /** 0 standard on this vehicle, 1 optional, 2 elsewhere in the portfolio, 3 nowhere (rule 22 of the rule set v0.2). */
  level: number;
  terms: string[];
  vehicles: Record<string, { item: string; status: string }>;
  own_variants: { total: number; optional: number; standard: number };
}

/** A rule of the effort model that fired (rules 43, 47, 48, 51). */
export interface EffortFlag {
  level: FlagLevel;
  rule: string;
  text: string;
}

/** One row of GET /effort/requirements: the CPM estimate of a requirement (D-062). */
export interface RequirementEffort {
  id: string;
  vehicle: string;
  market: string;
  title: string;
  horizon: Horizon;
  recommend: boolean;
  status: RequirementStatus;
  requirement_version: number;
  kind: EffortKind;
  /** Share of a new vehicle generation's development effort, in %. Never money (rule 49). */
  effort_pct: number;
  p5: number;
  p95: number;
  decision: EffortDecision;
  /** Share of the sensitivity runs that keep the decision; under 90 is borderline (rule 51). */
  decision_stable_pct: number;
  layer: EffortLayer;
  size: EffortSize;
  /** Whether the certification add-on applies (rule 46). */
  certification: boolean;
  changes: EffortChange[];
  subsystems: EffortSubsystem[];
  portfolio: PortfolioScan[];
  flags: EffortFlag[];
  note: string | null;
  model_hash: string;
  /** The estimate was made on an older requirement version. */
  stale: boolean;
}

export type ScenarioKey = "H1" | "H2" | "ALL";

/** One row of GET /effort/scenarios: the requirements of a horizon combined per subsystem (rule 45). */
export interface EffortScenario {
  scenario: ScenarioKey;
  label: string;
  requirements: number;
  with_changes: number;
  /** The plain sum of the single estimates, for comparison with the combined figure. */
  sum_of_single_pct: number;
  effort_pct: number;
  layer: EffortLayer;
  decision: EffortDecision;
  size: EffortSize;
  certification_add_on: boolean;
  platform_change: boolean;
  /** The six subsystems carrying most of the package. */
  subsystems: EffortSubsystem[];
  p5: number;
  p95: number;
  decision_stable_pct: number;
  score_stable_pct: number;
  kind: EffortKind;
}

/** A finding the requirement agent left out of the scope, with its reason (D-060). */
export interface ExcludedCandidate {
  finding: string;
  reason: string;
}

export type ActorType = "human" | "agent" | "system";

/** One row of GET /events (D-026). */
export interface AuditEvent {
  id: number;
  ts: string;
  run_id: string | null;
  actor_type: ActorType;
  actor_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  rationale: string | null;
  model_id: string | null;
  prompt_version: string | null;
  parent_event_id: number | null;
}

export interface SnapshotMeta {
  /** When the API was read. */
  takenAt: string;
  api: string;
  /** The backend's code version at its latest run. */
  codeVersion: string | null;
  /** The effort model the estimates were computed with (config/effort/model.yaml). */
  modelHash: string | null;
  endpoints: Record<"requirements" | "efforts" | "scenarios" | "excluded" | "events", string>;
}

export interface WorkspaceSnapshot {
  vehicle: string;
  market: MarketCode;
  snapshot: SnapshotMeta;
  requirements: Requirement[];
  efforts: RequirementEffort[];
  scenarios: EffortScenario[];
  excluded: ExcludedCandidate[];
  events: AuditEvent[];
}
