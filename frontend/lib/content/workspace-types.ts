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

export type FindingKind = "recurring_complaint" | "unmet_need" | "strength" | "metric_gap" | "metric_strength" | "equipment_gap" | "competitor_advantage" | "trend";
export type FindingLayer = "voice_of_customer" | "quantitative_metrics" | "portfolio_offering" | "regional_context" | "competition" | "market_trends";
export type EvidenceRole = "example" | "quantifies" | "compares" | "supports";

/**
 * One evidence reference of a finding (D-026). `vclass:G60-0876#1` is a
 * classification row of verbatim G60-0876, `metric:MET-…` a study attribute,
 * `equipment:EQ-…` a catalogue item, `aggregate:…` a count, `finding:FND-…`
 * another finding; the snapshot resolves the first three into `verbatims`,
 * `metrics` and `equipment`.
 */
export interface EvidenceRow {
  evidence_ref: string;
  role: EvidenceRole;
  weight: number | null;
  note: string | null;
}

export interface FindingLink {
  kind: string;
  rationale: string | null;
}

export interface FindingLinkOut extends FindingLink {
  to_finding_id: string;
}

export interface FindingLinkIn extends FindingLink {
  from_finding_id: string;
}

/** A linked finding as GET /requirements/{id} returns it (D-036). */
export interface FindingDetail {
  role: FindingRole;
  id: string;
  vehicle_code: string;
  market_code: string;
  powertrain: string | null;
  layer: FindingLayer;
  kind: FindingKind;
  domain_key: DomainKey;
  theme_level2_id: string | null;
  attribute_key: string | null;
  title: string;
  statement: string;
  /** Counts per kind of finding; the keys differ by kind and are shown as given. */
  quantification: Record<string, unknown>;
  severity_score: number | null;
  evidence_level: EvidenceLevel;
  evidence_count: number;
  status: string;
  version: number;
  created_by: string;
  created_run_id: string | null;
  updated_run_id: string | null;
  evidence: EvidenceRow[];
  links_out: FindingLinkOut[];
  links_in: FindingLinkIn[];
  events: AuditEvent[];
}

/** GET /requirements/{id}: the requirement with its findings, its estimate and its events. */
export interface RequirementDetail {
  id: string;
  vehicle_code: string;
  market_code: string;
  domain_key: DomainKey;
  title: string;
  statement: string;
  recommend: boolean;
  recommend_rationale: string;
  horizon: Horizon;
  horizon_rationale: string;
  markets: string[];
  criteria: Criterion[];
  assumptions: string[];
  uncertainties: string[];
  evidence_level: EvidenceLevel;
  priority_score: number | null;
  status: RequirementStatus;
  version: number;
  findings: FindingDetail[];
  effort: RequirementEffort | null;
  events: AuditEvent[];
}

export interface VerbatimClassification {
  id: string;
  feedback_type: string | null;
  level2_id: string | null;
  level2_raw: string | null;
  level3_id: string | null;
  level3_raw: string | null;
  origin: string;
  status: string;
  confidence: number | null;
}

/** GET /verbatims/{id}: one customer verbatim as written, with its classification rows and its place in the workbook. */
export interface Verbatim {
  id: string;
  vehicle_code: string;
  source_label: string;
  country_code: string;
  market_code: string;
  powertrain: string | null;
  text: string;
  char_len: number;
  source_id: string;
  locator: { id: string; row: number; file: string; sheet: string };
  evidence_ref: string;
  classifications: VerbatimClassification[];
}

/** One study attribute of GET /studies. */
export interface StudyMetric {
  id: string;
  vehicle_code: string;
  market_code: string;
  study: string;
  attribute_raw: string;
  attribute_key: string;
  domain_key: DomainKey | null;
  stat_kind: string;
  mean: number | null;
  distribution: { top2: number | null; bottom3: number | null; scale: string; shares: Record<string, number>; mean_1_7?: number } | null;
  scale_note: string | null;
  locator: Record<string, unknown>;
  evidence_ref: string;
}

/** One catalogue item of GET /equipment (D-024). */
export interface EquipmentItem {
  id: string;
  sa_code: string | null;
  name_de: string;
  name_en: string | null;
  section: string | null;
  group_key: string | null;
  domain_key: DomainKey | null;
  description_de: string | null;
  price_eur: string | null;
  price_note: string | null;
  locator: Record<string, unknown>;
  evidence_ref: string;
  availability: Record<string, string>;
  dependencies: unknown[];
}

/** One row of GET /effort/backtest: a documented BMW decision re-estimated by the engine (D-062). */
export interface BacktestRow {
  id: string;
  name: string;
  /** False for the proposals the anchor file carries beside the eight anchors. */
  anchor: boolean;
  independent: boolean;
  effort_pct: number;
  layer: EffortLayer;
  decision: EffortDecision;
  size: EffortSize;
  certification_add_on: boolean;
  platform_change: boolean;
  subsystems: EffortSubsystem[];
  p5: number;
  p95: number;
  decision_stable_pct: number;
  score_stable_pct: number;
  /** BMW's own decision; null for a proposal. */
  actual: EffortDecision | null;
  ok: boolean | null;
  k3_rule: boolean;
}

export interface Backtest {
  rows: BacktestRow[];
  hits: number;
  anchors: number;
  independent_hits: number;
  independent_anchors: number;
  runs: number;
  spread: number;
  scope: string;
  seed: number;
  model_hash: string;
}

/** POST /effort/estimate: each requirement or change on its own and all of them combined (rule 45). */
export interface EstimateItem {
  requirement: string | null;
  title: string | null;
  horizon: Horizon | null;
  effort_pct: number;
  p5: number;
  p95: number;
  decision: EffortDecision;
  decision_stable_pct: number;
  layer: EffortLayer;
  size: EffortSize;
  certification_add_on: boolean;
  subsystems: EffortSubsystem[];
  changes: EffortChange[];
}

export interface EstimateCombined {
  effort_pct: number;
  layer: EffortLayer;
  decision: EffortDecision;
  size: EffortSize;
  certification_add_on: boolean;
  platform_change: boolean;
  subsystems: EffortSubsystem[];
  p5: number;
  p95: number;
  decision_stable_pct: number;
  score_stable_pct: number;
  kind: EffortKind;
}

export interface EstimateResponse {
  vehicle: string;
  market: string | null;
  items: EstimateItem[];
  sum_of_single_pct: number;
  combined: EstimateCombined;
  model_hash: string;
  basis: string;
}

export interface SnapshotMeta {
  /** When the API was read. */
  takenAt: string;
  api: string;
  /** The backend's code version at its latest run. */
  codeVersion: string | null;
  /** The effort model the estimates were computed with (config/effort/model.yaml). */
  modelHash: string | null;
  endpoints: Record<"requirements" | "efforts" | "scenarios" | "excluded" | "events" | "details" | "verbatims" | "metrics" | "equipment", string>;
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
  /** GET /requirements/{id} per requirement of the scope, keyed by id (step 15). */
  details: Record<string, RequirementDetail>;
  /** The evidence the findings reference, keyed by id: resolved once per scope. */
  verbatims: Record<string, Verbatim>;
  metrics: Record<string, StudyMetric>;
  equipment: Record<string, EquipmentItem>;
}
