import Link from "next/link";
import { full, weight } from "@/lib/content/format";
import type { CpmCatalogue, CpmView } from "@/lib/content/cpm-types";
import type { MarketCode } from "@/lib/content/types";
import type { EffortScenario, EstimateResponse } from "@/lib/content/workspace-types";
import { site } from "@/lib/site";
import { type H1Note, type PackageSubsystemRow, packageRows } from "@/lib/workspace/priorities";
import { requirementHref } from "@/lib/workspace/requirements";
import { requirementArea } from "@/lib/workspace/requirement-name";

/*
 * Stage 4: the engine's packages as one hairline table (one row per
 * variation, the combined figure against the plain sum, the class with its
 * stability) with the subsystems carrying most of each beneath, and the
 * same rendering for the estimate the package builder asks the API for.
 * Every figure is the engine's; the rows reuse the footprint of stage 3.
 */
export function PackagesTable({ scenarios, catalogue, view }: { scenarios: EffortScenario[]; catalogue: CpmCatalogue; view: CpmView }) {
  const copy = site.priorities;
  return (
    <>
      <div className="table-scroll">
        <table className="candidate-table package-table">
          <thead>
            <tr>
              <th scope="col">{copy.packageColumns.scenario}</th>
              <th scope="col" className="num">
                {copy.packageColumns.requirements}
              </th>
              <th scope="col" className="num">
                {copy.packageColumns.effort}
              </th>
              <th scope="col">{copy.packageColumns.range}</th>
              <th scope="col">{copy.packageColumns.decision}</th>
              <th scope="col" className="num">
                {copy.packageColumns.sum}
              </th>
              <th scope="col">{copy.packageColumns.certification}</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map((s) => (
              <tr key={s.scenario} className="candidate">
                <td>
                  <b>{s.scenario}</b> <span className="cpm-muted">{s.label}</span>
                </td>
                <td className="num">{full(s.requirements)}</td>
                <td className="num">{s.requirements > 0 ? `${s.effort_pct.toFixed(1)} %` : ""}</td>
                <td className="num-left">{s.requirements > 0 ? `${s.p5.toFixed(1)} to ${s.p95.toFixed(1)}` : ""}</td>
                <td>{s.requirements > 0 ? <ClassCell decision={s.decision} stable={s.decision_stable_pct} /> : <span className="cpm-muted">{copy.emptyPackage}</span>}</td>
                <td className="num">{s.requirements > 0 ? `${s.sum_of_single_pct.toFixed(1)} %` : ""}</td>
                <td>{s.requirements > 0 ? (s.certification_add_on ? site.requirements.effort.yes : site.requirements.effort.no) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="package-footprints">
        {scenarios
          .filter((s) => s.requirements > 0)
          .map((s) => (
            <div key={s.scenario} className="package-footprint">
              <p className="package-footprint-h">
                <b>{s.scenario}</b> · {copy.largestHeading}
              </p>
              <FootprintRows rows={packageRows(s.subsystems, catalogue, view)} />
            </div>
          ))}
      </div>
    </>
  );
}

export function ClassCell({ decision, stable }: { decision: string; stable: number }) {
  const copy = site.priorities;
  return (
    <>
      <b>{decision}</b>, {copy.packageColumns.stable} {stable.toFixed(0)} {copy.ofRuns}
      {stable < 90 ? <span className="cpm-muted"> ({copy.borderline})</span> : null}
    </>
  );
}

export function FootprintRows({ rows }: { rows: PackageSubsystemRow[] }) {
  const copy = site.requirements.effort;
  return (
    <ol className="footprint">
      {rows.map((row) => (
        <li key={row.key} className="footprint-row" data-reached="true">
          <span className="footprint-name">{row.name}</span>
          <span className="footprint-figure">
            <b>{row.effortPct.toFixed(1)} %</b> · {Math.round(row.risk * 100)}% {copy.ofWeight} {weight(row.weight)}
          </span>
          <span className="footprint-bar" aria-hidden="true" style={{ width: `${String(row.weight)}%` }}>
            <span style={{ width: `${String(Math.min(100, row.risk * 100))}%` }} />
          </span>
          <span className="footprint-path cpm-muted">{row.path && row.path.length > 1 ? `${copy.via} ${row.path.slice(0, -1).join(" → ")}` : copy.startsHere}</span>
        </li>
      ))}
    </ol>
  );
}

/** The derived sentence about the H1 package (template text from the figures, as the CPM dialog's narration). */
export function H1Sentence({ note, market, vehicle }: { note: H1Note; market: MarketCode; vehicle: string }) {
  const copy = site.priorities.h1Note;
  const c = note.combined;
  return (
    <p className="package-note">
      {note.singleClass ? `${copy.every} ${note.singleClass} ${copy.alone} ` : ""}
      <b>{c.effort_pct.toFixed(1)} %</b> {copy.ofVehicle} <b>{c.decision}</b>
      {c.decision_stable_pct < 90 ? ` (${site.priorities.borderline})` : ""}. {copy.largest}{" "}
      {note.largest.map((e, i) => (
        <span key={e.id}>
          {i > 0 ? ", " : ""}
          <Link href={requirementHref(market, vehicle, e.id)} className="cpm-citing-link">
            {e.title}
          </Link>{" "}
          {e.effort_pct.toFixed(1)} %
        </span>
      ))}
      . {!note.beyondAdapt ? copy.fits : ""}
    </p>
  );
}

export function EstimateView({ response, catalogue, view, market, vehicle }: { response: EstimateResponse; catalogue: CpmCatalogue; view: CpmView; market: MarketCode; vehicle: string }) {
  const copy = site.priorities;
  const c = response.combined;
  return (
    <div className="estimate">
      <p className="effort-lead">
        <b>{c.effort_pct.toFixed(1)} %</b> {site.requirements.effort.ofVehicle} · {site.requirements.effort.range} {c.p5.toFixed(1)} to {c.p95.toFixed(1)} ·{" "}
        <ClassCell decision={c.decision} stable={c.decision_stable_pct} /> · {site.requirements.effort.size} {c.size} · {site.requirements.effort.layer} {c.layer} ·{" "}
        {site.requirements.effort.certification} {c.certification_add_on ? site.requirements.effort.yes : site.requirements.effort.no} · {full(response.items.length)} {copy.resultCount},{" "}
        {copy.resultSum} {response.sum_of_single_pct.toFixed(1)} %
      </p>
      <p className="package-footprint-h">{copy.largestHeading}</p>
      <FootprintRows rows={packageRows(c.subsystems.slice(0, 6), catalogue, view)} />
      <p className="package-footprint-h">{copy.resultItems}</p>
      <div className="table-scroll">
        <table className="candidate-table">
          <thead>
            <tr>
              <th scope="col">{copy.columns.id}</th>
              <th scope="col">{copy.columns.title}</th>
              <th scope="col">{copy.columns.horizon}</th>
              <th scope="col" className="num">
                {copy.columns.effort}
              </th>
              <th scope="col">{copy.columns.range}</th>
              <th scope="col">{copy.columns.decision}</th>
            </tr>
          </thead>
          <tbody>
            {response.items.map((item, i) => (
              <tr key={item.requirement ?? String(i)} className="candidate">
                <td className="req-area">{item.requirement ? requirementArea(item.requirement) : ""}</td>
                <td>
                  {item.requirement ? (
                    <Link href={requirementHref(market, vehicle, item.requirement)} className="title-link">
                      {item.title ?? item.requirement}
                    </Link>
                  ) : (
                    (item.title ?? "")
                  )}
                </td>
                <td>{item.horizon ?? ""}</td>
                <td className="num">{item.effort_pct.toFixed(1)} %</td>
                <td className="num-left">
                  {item.p5.toFixed(1)} to {item.p95.toFixed(1)}
                </td>
                <td>{item.decision}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="stage-source">
        {site.requirements.effort.model} {response.model_hash}, {response.basis}.
      </p>
    </div>
  );
}
