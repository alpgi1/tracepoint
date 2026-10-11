import { full } from "@/lib/content/format";
import { site } from "@/lib/site";
import { type MatrixPoint, axisMax } from "@/lib/workspace/priorities";

/*
 * Stage 4: effort against customer evidence as one scatter, inline SVG.
 * Horizontal the effort in % of a new vehicle with the P5 to P95 range as
 * a line through the mark, vertical the complaint rows of the primary
 * finding. H1 marks are circles, H2 marks squares (identity by shape, not
 * by colour alone; the legend beneath names both); every mark is 10 px in
 * the one blue with a 2 px ring in the paper colour; the evidence level
 * sits beside the mark in muted text; the four extremes carry their id;
 * every mark names its requirement on hover (a native title); the table
 * beneath carries every value. Axes and gridlines are solid hairlines. No
 * registry chart was taken (research notes 6.5); the chart follows the
 * dataviz rules: thin marks, surface ring, legend for two series, selective
 * labels, text in ink, a table twin.
 */
const WIDTH = 760;
const HEIGHT = 420;
const LEFT = 60;
const RIGHT = 28;
const TOP = 20;
const BOTTOM = 56;
const MARK = 10;

export function PriorityMatrix({ points }: { points: MatrixPoint[] }) {
  const copy = site.priorities;
  const xMax = axisMax(Math.max(0, ...points.map((p) => p.effort?.p95 ?? 0)), 10);
  const yMax = axisMax(Math.max(0, ...points.map((p) => p.complaintRows)), 25);
  const plotW = WIDTH - LEFT - RIGHT;
  const plotH = HEIGHT - TOP - BOTTOM;
  const x = (v: number) => LEFT + (v / xMax) * plotW;
  const y = (v: number) => TOP + plotH - (v / yMax) * plotH;
  const xTicks = Array.from({ length: xMax / 10 + 1 }, (_, i) => i * 10);
  const yTicks = Array.from({ length: yMax / 25 + 1 }, (_, i) => i * 25);
  const labelled = new Set<string>();
  for (const p of [...points].sort((a, b) => (b.effort?.effort_pct ?? 0) - (a.effort?.effort_pct ?? 0)).slice(0, 2)) labelled.add(p.id);
  for (const p of [...points].sort((a, b) => b.complaintRows - a.complaintRows).slice(0, 2)) labelled.add(p.id);
  const describe = (p: MatrixPoint) =>
    `${p.id}: ${p.title}. ${p.effort && p.effort.kind === "change" ? `${p.effort.effort_pct.toFixed(1)} % (${p.effort.p5.toFixed(1)} to ${p.effort.p95.toFixed(1)}), ${p.effort.decision}` : copy.noEstimate}; ${full(p.complaintRows)} complaint rows; level ${p.evidence}; ${p.horizon}`;
  return (
    <figure className="matrix">
      <svg viewBox={`0 0 ${String(WIDTH)} ${String(HEIGHT)}`} className="matrix-svg" role="img" aria-label={copy.matrixHeading}>
        {yTicks.map((t) => (
          <g key={`y${String(t)}`}>
            <line x1={LEFT} x2={WIDTH - RIGHT} y1={y(t)} y2={y(t)} className="matrix-grid" />
            <text x={LEFT - 8} y={y(t) + 4} textAnchor="end" className="matrix-tick">
              {full(t)}
            </text>
          </g>
        ))}
        {xTicks.map((t) => (
          <g key={`x${String(t)}`}>
            <line x1={x(t)} x2={x(t)} y1={TOP + plotH} y2={TOP + plotH + 5} className="matrix-axis" />
            <text x={x(t)} y={TOP + plotH + 18} textAnchor="middle" className="matrix-tick">
              {full(t)}
            </text>
          </g>
        ))}
        <line x1={LEFT} x2={WIDTH - RIGHT} y1={TOP + plotH} y2={TOP + plotH} className="matrix-axis" />
        <line x1={LEFT} x2={LEFT} y1={TOP} y2={TOP + plotH} className="matrix-axis" />
        <text x={LEFT + plotW / 2} y={HEIGHT - 10} textAnchor="middle" className="matrix-title">
          {copy.axisEffort}
        </text>
        <text transform={`translate(14 ${String(TOP + plotH / 2)}) rotate(-90)`} textAnchor="middle" className="matrix-title">
          {copy.axisEvidence}
        </text>
        {points.map((p) => {
          const e = p.effort;
          const cx = x(e?.effort_pct ?? 0);
          const cy = y(p.complaintRows);
          return (
            <g key={p.id} className="matrix-mark">
              <title>{describe(p)}</title>
              {e && e.kind === "change" ? <line x1={x(e.p5)} x2={x(e.p95)} y1={cy} y2={cy} className="matrix-range" /> : null}
              {p.horizon === "H1" ? (
                <circle cx={cx} cy={cy} r={MARK / 2} className="matrix-dot" />
              ) : (
                <rect x={cx - MARK / 2} y={cy - MARK / 2} width={MARK} height={MARK} className="matrix-dot" />
              )}
              <text x={cx + 9} y={cy + 4} className="matrix-level">
                {p.evidence}
              </text>
              {labelled.has(p.id) ? (
                <text x={cx + 9} y={cy - 8} className="matrix-label">
                  {p.id}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>
      <figcaption className="matrix-legend">
        <span>
          <svg width="12" height="12" aria-hidden="true">
            <circle cx="6" cy="6" r="5" className="matrix-dot" />
          </svg>{" "}
          {copy.legendH1}
        </span>
        <span>
          <svg width="12" height="12" aria-hidden="true">
            <rect x="1" y="1" width="10" height="10" className="matrix-dot" />
          </svg>{" "}
          {copy.legendH2}
        </span>
        <span>
          <svg width="24" height="12" aria-hidden="true">
            <line x1="0" x2="24" y1="6" y2="6" className="matrix-range" />
          </svg>{" "}
          {copy.legendRange}
        </span>
      </figcaption>
    </figure>
  );
}
