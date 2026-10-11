import Link from "next/link";
import { full } from "@/lib/content/format";
import type { MarketCode } from "@/lib/content/types";
import { site } from "@/lib/site";
import { type LinearAxis, type LogAxis, type MatrixPoint, effortAxis, horizonGroups, logPosition, rowsAxis } from "@/lib/workspace/priorities";
import { requirementHref } from "@/lib/workspace/requirements";
import { requirementArea } from "@/lib/workspace/requirement-name";

/*
 * Stage 4: customer evidence and effort side by side, one row per
 * requirement, as a hairline table whose two last columns are charts. It
 * replaces the scatter of step 16, where the one H2 change at 49 % set a
 * linear axis to 60 % and pushed the other nineteen requirements into the
 * first 50 px, anonymous and overlapping. Here every requirement is named
 * on its row, grouped by horizon (H1 first) and ordered by complaint rows.
 * Left chart: the complaint rows of the primary finding as a bar from 0.
 * Right chart: the effort as a dot with its P5 to P95 range as a line, on a
 * logarithmic scale up to 100 % (a whole new vehicle generation), over the
 * engine's three classes as bands: adapt unshaded, major revision and new
 * generation in two steps of grey. The figure stands as text beside each
 * chart; the row names the range and the class in a native title, and the
 * table twin beneath carries every value. Positions are the data and go in
 * as inline percentages; colours and sizes are tokens in globals.css.
 */
export interface PriorityChartProps {
  points: MatrixPoint[];
  thresholds: { adaptBelowPercent: number; newGenerationFromPercent: number };
  market: MarketCode;
  vehicle: string;
}

export function PriorityChart({ points, thresholds, market, vehicle }: PriorityChartProps) {
  const copy = site.priorities;
  const rows = rowsAxis(points);
  const effort = effortAxis(points);
  const groups = horizonGroups(points);
  return (
    <figure className="pchart">
      <div className="table-scroll">
        <table className="pchart-table">
          <thead>
            <tr>
              <th scope="col">{copy.columns.id}</th>
              <th scope="col">{copy.columns.title}</th>
              <th scope="col">{copy.columns.evidence}</th>
              <th scope="col" className="pchart-head">
                {copy.axisEvidence}
              </th>
              <th scope="col" className="pchart-head">
                {copy.axisEffort}
              </th>
            </tr>
            <tr className="pchart-scale" aria-hidden="true">
              <td colSpan={3} />
              <td className="pchart-cell">
                <span className="pchart-track">
                  {rows.ticks.map((t) => (
                    <span key={t} className="pchart-tick" style={{ left: share(rows, t) }}>
                      {full(t)}
                    </span>
                  ))}
                </span>
              </td>
              <td className="pchart-cell">
                <span className="pchart-track">
                  <Bands axis={effort} thresholds={thresholds} />
                  {effort.ticks.map((t) => (
                    <span key={t} className="pchart-tick" style={{ left: at(effort, t) }}>
                      {String(t)}
                    </span>
                  ))}
                </span>
              </td>
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.horizon}>
              <tr className="candidate-group">
                <th colSpan={5} scope="colgroup">
                  {g.horizon === "H1" ? copy.legendH1 : copy.legendH2}
                  <span>{g.points.length}</span>
                </th>
              </tr>
              {g.points.map((p) => (
                <ChartRow key={p.id} point={p} rows={rows} effort={effort} thresholds={thresholds} href={requirementHref(market, vehicle, p.id)} />
              ))}
            </tbody>
          ))}
        </table>
      </div>
      <figcaption className="pchart-legend">
        <span>
          <svg width="28" height="12" aria-hidden="true">
            <line x1="2" x2="26" y1="6" y2="6" className="pchart-legend-range" />
            <circle cx="14" cy="6" r="5" className="pchart-legend-dot" />
          </svg>
          {copy.legendEstimate}
        </span>
        <span>
          <i className="pchart-swatch" data-band="adapt" aria-hidden="true" />
          {copy.bandAdapt} {String(thresholds.adaptBelowPercent)} %
        </span>
        <span>
          <i className="pchart-swatch" data-band="major" aria-hidden="true" />
          {copy.bandMajor} {String(thresholds.adaptBelowPercent)} {copy.bandTo} {String(thresholds.newGenerationFromPercent)} %
        </span>
        <span>
          <i className="pchart-swatch" data-band="new" aria-hidden="true" />
          {copy.bandNew} {String(thresholds.newGenerationFromPercent)} %
        </span>
      </figcaption>
    </figure>
  );
}

interface ChartRowProps {
  point: MatrixPoint;
  rows: LinearAxis;
  effort: LogAxis;
  thresholds: PriorityChartProps["thresholds"];
  href: string;
}

function ChartRow({ point: p, rows, effort, thresholds, href }: ChartRowProps) {
  const copy = site.priorities;
  const e = p.effort;
  const change = e && e.kind === "change" ? e : null;
  return (
    <tr className="pchart-row" title={describe(p)}>
      <td className="req-area">{requirementArea(p.id)}</td>
      <td className="pchart-title">
        <Link href={href} className="title-link">
          {p.title}
        </Link>
      </td>
      <td className="pchart-level">{p.evidence}</td>
      <td className="pchart-cell">
        <span className="pchart-value">{full(p.complaintRows)}</span>
        <span className="pchart-track" aria-hidden={p.complaintRows > 0 ? true : undefined}>
          {rows.ticks.map((t) => (
            <span key={t} className="pchart-grid" style={{ left: share(rows, t) }} />
          ))}
          {p.complaintRows > 0 ? (
            <span className="pchart-bar" style={{ width: share(rows, p.complaintRows) }} />
          ) : (
            <span className="pchart-note">
              {copy.noRows} {[...new Set(p.primaryKinds)].map((k) => site.requirements.kinds[k] ?? k).join(", ")}
            </span>
          )}
        </span>
      </td>
      <td className="pchart-cell">
        <span className="pchart-value">{change ? `${change.effort_pct.toFixed(1)} %` : ""}</span>
        <span className="pchart-track" aria-hidden={change ? true : undefined}>
          <Bands axis={effort} thresholds={thresholds} />
          {effort.ticks.map((t) => (
            <span key={t} className="pchart-grid" style={{ left: at(effort, t) }} />
          ))}
          {change ? (
            <>
              <span className="pchart-range" style={{ left: at(effort, change.p5), width: span(effort, change.p5, change.p95) }} />
              <span className="pchart-dot" style={{ left: at(effort, change.effort_pct) }} />
            </>
          ) : (
            <span className="pchart-note">{e ? copy.noChange : copy.noEstimate}</span>
          )}
        </span>
      </td>
    </tr>
  );
}

/** The two shaded classes behind the effort chart; adapt stays unshaded. */
function Bands({ axis, thresholds }: { axis: LogAxis; thresholds: PriorityChartProps["thresholds"] }) {
  return (
    <>
      <span className="pchart-band" data-band="major" style={{ left: at(axis, thresholds.adaptBelowPercent), width: span(axis, thresholds.adaptBelowPercent, thresholds.newGenerationFromPercent) }} />
      <span className="pchart-band" data-band="new" style={{ left: at(axis, thresholds.newGenerationFromPercent), right: 0 }} />
    </>
  );
}

function share(axis: LinearAxis, value: number): string {
  return `${((value / axis.max) * 100).toFixed(2)}%`;
}

function at(axis: LogAxis, value: number): string {
  return `${(logPosition(axis, value) * 100).toFixed(2)}%`;
}

function span(axis: LogAxis, from: number, to: number): string {
  return `${((logPosition(axis, to) - logPosition(axis, from)) * 100).toFixed(2)}%`;
}

function describe(p: MatrixPoint): string {
  const copy = site.priorities;
  const e = p.effort;
  const effort = e && e.kind === "change" ? `${e.effort_pct.toFixed(1)} % (${e.p5.toFixed(1)} to ${e.p95.toFixed(1)}), ${e.decision}` : e ? copy.noChange : copy.noEstimate;
  return `${requirementArea(p.id)}: ${p.title}. ${full(p.complaintRows)} ${copy.columns.rows.toLowerCase()}; ${copy.columns.effort.toLowerCase()} ${effort}; ${copy.columns.evidence.toLowerCase()} ${p.evidence}; ${p.horizon}`;
}
