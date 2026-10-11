import type { EffortContent } from "@/lib/data/effort";
import type { BacktestRow, EffortDecision } from "./workspace-types";

/*
 * The CPM explainer behind the brand mark on the map (step 20, D-112): what
 * the Change Prediction Method does, told with the engine's own model and
 * one documented BMW decision per effort class from its back-test. Built on
 * the server from content/effort.json; the client receives only these few
 * fields. Nothing is computed here that the engine did not compute: the
 * nodes are the subsystems the back-test row reports with their effort and
 * risk, the links are the most likely paths the engine reports for each.
 */
export type EffortClass = Exclude<EffortDecision, "no change">;

/** The three classes in the order of the scale. */
export const EFFORT_CLASSES: readonly EffortClass[] = ["adapt", "major revision", "new generation"];

export interface IntroNode {
  key: string;
  name: string;
  /** Links from the subsystem where the change starts: 0 for that subsystem. */
  depth: number;
  /** Position in its column, from the top. */
  row: number;
  /** The subsystem the most likely path arrives from; null where the change starts. */
  parent: string | null;
  /** Probability that the change reaches the subsystem, 0 to 1. */
  risk: number;
  /** Its share of the effort, % of a new vehicle generation. */
  effortPct: number;
}

export interface IntroExample {
  id: string;
  name: string;
  decision: EffortClass;
  /** BMW's own decision. */
  actual: EffortClass;
  effortPct: number;
  p5: number;
  p95: number;
  certificationAddOn: boolean;
  /** A K3 change without carryover: a new generation regardless of the score. */
  platformRule: boolean;
  nodes: IntroNode[];
  /** Subsystems of the model the change does not reach, in the model's order. */
  notReached: string[];
}

export interface CpmIntro {
  method: { name: string; reference: string };
  subsystems: number;
  thresholds: { adaptBelowPercent: number; newGenerationFromPercent: number };
  certificationAddOnPercent: number;
  maxPathLength: number;
  backtest: { hits: number; anchors: number };
  modelHash: string;
  takenAt: string;
  /** One example per class, in the order of EFFORT_CLASSES; a class without a matching anchor has none. */
  examples: IntroExample[];
  /** The most nodes any example puts in one column, so the drawing keeps its height across examples. */
  rows: number;
}

/**
 * The example of a class: among the anchors the engine reproduced that are
 * independent of the model's calibration, the one whose change reaches the
 * most subsystems; ties go to the larger effort, then to the id.
 */
export function pickExample(rows: BacktestRow[], decision: EffortClass): BacktestRow | undefined {
  return rows
    .filter((r) => r.anchor && r.independent && r.ok === true && r.decision === decision && r.actual === decision)
    .sort((a, b) => b.subsystems.length - a.subsystems.length || b.effort_pct - a.effort_pct || a.id.localeCompare(b.id))[0];
}

/**
 * The reached subsystems as columns by their distance from the start. Within
 * a column the nodes follow their parent's row, so links cross as little as
 * possible, then the larger effort first.
 */
export function introNodes(row: BacktestRow): IntroNode[] {
  const byName = new Map(row.subsystems.map((s) => [s.name, s]));
  const placed = new Map<string, IntroNode>();
  const columns = new Map<number, IntroNode[]>();
  const depthOf = (path: string[] | null) => (path ? path.length - 1 : 0);
  const ordered = [...row.subsystems].sort((a, b) => depthOf(a.path) - depthOf(b.path));
  for (let depth = 0; ordered.some((s) => depthOf(s.path) === depth); depth++) {
    const column = ordered
      .filter((s) => depthOf(s.path) === depth)
      .map((s) => {
        const parentName = s.path && s.path.length > 1 ? s.path[s.path.length - 2] : null;
        const parent = parentName ? byName.get(parentName) : undefined;
        return { s, parent: parent ? placed.get(parent.subsystem) : undefined };
      })
      .sort((a, b) => (a.parent?.row ?? 0) - (b.parent?.row ?? 0) || b.s.effort_pct - a.s.effort_pct || a.s.name.localeCompare(b.s.name));
    const nodes = column.map(({ s, parent }, index) => ({
      key: s.subsystem,
      name: s.name,
      depth,
      row: index,
      parent: parent?.key ?? null,
      risk: s.risk,
      effortPct: s.effort_pct,
    }));
    for (const node of nodes) placed.set(node.key, node);
    columns.set(depth, nodes);
  }
  return [...columns.values()].flat();
}

export function cpmIntro(content: EffortContent): CpmIntro {
  const { model, backtest, snapshot } = content;
  const examples: IntroExample[] = [];
  for (const decision of EFFORT_CLASSES) {
    const row = pickExample(backtest.rows, decision);
    if (!row) continue;
    const nodes = introNodes(row);
    const reached = new Set(nodes.map((n) => n.key));
    examples.push({
      id: row.id,
      name: row.name,
      decision,
      actual: decision,
      effortPct: row.effort_pct,
      p5: row.p5,
      p95: row.p95,
      certificationAddOn: row.certification_add_on,
      platformRule: row.k3_rule,
      nodes,
      notReached: model.subsystems.filter((s) => !reached.has(s.key)).map((s) => s.name),
    });
  }
  const rows = Math.max(1, ...examples.flatMap((e) => e.nodes.map((n) => n.row + 1)));
  return {
    method: { name: model.method.name, reference: model.method.reference },
    subsystems: model.subsystems.length,
    thresholds: model.method.thresholds,
    certificationAddOnPercent: model.method.certificationAddOnPercent,
    maxPathLength: model.parameters.maxPathLength,
    backtest: { hits: backtest.hits, anchors: backtest.anchors },
    modelHash: model.modelHash,
    takenAt: snapshot.takenAt,
    examples,
    rows,
  };
}
