import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { StagePending } from "@/components/workspace/source-line";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { dateTime, full } from "@/lib/content/format";
import { allVehicleParams, marketByCode, vehicleHref, vehicleIn } from "@/lib/content/markets";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { effortContent } from "@/lib/data/effort";
import { readWorkspace } from "@/lib/data/workspace";
import { site } from "@/lib/site";
import { stageFigures } from "@/lib/workspace/figures";

/*
 * The CPM method sheet (plan 08 section 4.5): the model as the engine runs
 * it, from content/effort.json (GET /effort/model and GET /effort/backtest).
 * The weights with their basis, the links as a 12 by 12 matrix with the
 * interface named on hover and listed beneath, the parameters the API
 * serves, what this vehicle leaves off, and the back-test. Method after
 * the comparison table with upright column heads and the table with
 * vertical lines of the 21st.dev survey (research notes 6.5), as a plain
 * table with the tokens; the fill of a cell follows the likelihood in the
 * one blue, with the figures as text. The sheet is build content; only the
 * stage bar's figures come from the workspace read at request time.
 */
export function generateStaticParams() {
  return allVehicleParams();
}

type Props = PageProps<"/markets/[market]/[vehicle]/priorities/method">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) return {};
  return { title: `${site.method.heading} · ${v.name} in ${m.name}` };
}

export default async function MethodPage({ params }: Props) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) notFound();
  return (
    <Suspense fallback={<StagePending />}>
      <MethodBody market={m} vehicle={v} />
    </Suspense>
  );
}

async function MethodBody({ market: m, vehicle: v }: { market: MarketContent; vehicle: VehicleContent }) {
  const read = await readWorkspace(v.code, m.code);
  const copy = site.method;
  const { model, backtest, snapshot } = effortContent();
  const names = new Map<string, string>(model.subsystems.map((s) => [s.key, s.name]));
  const own = model.vehicles[v.code];
  const absent = new Set(own?.absent ?? []);
  const links = model.subsystems.flatMap((s) => s.links.map((l) => ({ from: s.key, fromName: s.name, ...l })));
  const cell = (from: string, to: string) => links.find((l) => l.from === from && l.to === to);
  const triggers = model.subsystems.filter((s) => s.certificationTrigger).map((s) => s.name);
  return (
    <div className="workspace">
      <WorkspaceHeader market={m} vehicle={v} current="priorities" figures={stageFigures(v, m.code, read?.snapshot)} />
      <section className="stage-body" aria-labelledby="method-heading">
        <nav className="crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href={`${vehicleHref(m.code, v.code)}/priorities`} className="crumb-link">
                {site.priorities.heading}
              </Link>
            </li>
            <li aria-current="page">{copy.heading}</li>
          </ol>
        </nav>
        <h2 id="method-heading" className="stage-h">
          {model.method.name}
        </h2>
        <p className="workspace-hint stage-hint">{copy.hint}</p>
        <dl className="facts">
          <div>
            <dt>{copy.reference}</dt>
            <dd>
              {model.method.reference}{" "}
              <a href={model.method.url} className="cpm-citing-link" target="_blank" rel="noreferrer">
                {model.method.url}
              </a>
            </dd>
          </div>
          <div>
            <dt>{copy.engine}</dt>
            <dd>
              {model.method.engine}, {copy.modelSource.toLowerCase()} {model.method.modelSource}
            </dd>
          </div>
          <div>
            <dt>{copy.hash}</dt>
            <dd>
              {model.modelHash} <span className="cpm-muted">({model.method.basis})</span>
            </dd>
          </div>
          <div>
            <dt>{copy.thresholds}</dt>
            <dd>
              {copy.thresholdsText} {String(model.method.thresholds.adaptBelowPercent)} {copy.thresholdsMiddle} {String(model.method.thresholds.newGenerationFromPercent)}{" "}
              {copy.thresholdsEnd}.
            </dd>
          </div>
          <div>
            <dt>{copy.certification}</dt>
            <dd>
              {String(model.method.certificationAddOnPercent)} {copy.certificationText} {triggers.join(", ")}.
            </dd>
          </div>
          <div>
            <dt>{copy.vehicleHeading}</dt>
            <dd>
              {own?.platform ? `${copy.platform} ${own.platform}. ` : ""}
              {absent.size > 0 ? `${copy.absentBefore} ${[...absent].map((k) => names.get(k) ?? k).join(", ")} ${copy.absentAfter}` : copy.absentNone}
              {own?.note ? ` ${own.note}` : ""}
            </dd>
          </div>
        </dl>
        <p className="workspace-hint">{copy.notServed}</p>

        <h3 className="stage-h3">{copy.weightsHeading}</h3>
        <p className="workspace-hint stage-hint">{copy.weightsHint}</p>
        <div className="table-scroll">
          <table className="candidate-table">
            <thead>
              <tr>
                <th scope="col">{copy.weightColumns.subsystem}</th>
                <th scope="col" className="num">
                  {copy.weightColumns.weight}
                </th>
                <th scope="col">{copy.weightColumns.basis}</th>
                <th scope="col">{copy.weightColumns.trigger}</th>
              </tr>
            </thead>
            <tbody>
              {model.subsystems.map((s) => (
                <tr key={s.key} className="candidate" data-absent={absent.has(s.key) ? "true" : undefined}>
                  <td>
                    {s.name}
                    {absent.has(s.key) ? <span className="cpm-muted"> ({site.cpm.absentBefore.toLowerCase()} off {v.code})</span> : null}
                  </td>
                  <td className="num">{String(s.weight)}</td>
                  <td className="candidate-reason">{s.basis}</td>
                  <td>{s.certificationTrigger ? copy.triggerYes : copy.triggerNo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="stage-h3">{copy.dsmHeading}</h3>
        <p className="workspace-hint stage-hint">{copy.dsmHint}</p>
        <div className="table-scroll">
          <table className="dsm">
            <thead>
              <tr>
                <th scope="col" className="dsm-corner">
                  <span className="cpm-muted">
                    {copy.dsmFrom} / {copy.dsmTo}
                  </span>
                </th>
                {model.subsystems.map((s) => (
                  <th key={s.key} scope="col" className="dsm-head">
                    <span>{s.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.subsystems.map((from) => (
                <tr key={from.key}>
                  <th scope="row" className="dsm-row">
                    {from.name}
                  </th>
                  {model.subsystems.map((to) => {
                    const link = from.key === to.key ? undefined : cell(from.key, to.key);
                    return (
                      <td
                        key={to.key}
                        className="dsm-cell"
                        data-self={from.key === to.key ? "true" : undefined}
                        style={link ? ({ "--l": String(link.likelihood) } as React.CSSProperties) : undefined}
                        title={link ? `${from.name} → ${to.name}: ${copy.likelihood} ${String(link.likelihood)}, ${copy.impact} ${String(link.impact)}. ${link.why}` : undefined}
                      >
                        {link ? (
                          <>
                            {String(link.likelihood)} <span className="cpm-muted">/ {String(link.impact)}</span>
                          </>
                        ) : null}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h4 className="stage-h4">{copy.linksHeading}</h4>
        <ul className="changes">
          {links.map((l) => (
            <li key={`${l.from}-${l.to}`} className="change">
              <span className="change-head">
                <b>
                  {l.fromName} → {names.get(l.to) ?? l.to}
                </b>{" "}
                · {copy.likelihood} {String(l.likelihood)}, {copy.impact} {String(l.impact)}
              </span>
              <span className="change-why">{l.why}</span>
            </li>
          ))}
        </ul>

        <h3 className="stage-h3">{copy.backtestHeading}</h3>
        <p className="workspace-hint stage-hint">{copy.backtestHint}</p>
        <p className="effort-lead">
          <b>
            {full(backtest.hits)} of {full(backtest.anchors)}
          </b>{" "}
          {copy.backtestSummaryBefore} ({full(backtest.independent_hits)} of {full(backtest.independent_anchors)} {copy.backtestSummaryMiddle}) · {full(backtest.runs)} {copy.runs},{" "}
          {copy.spread} {Math.round(backtest.spread * 100)} %, {copy.scope} {backtest.scope} · {site.requirements.effort.model} {backtest.model_hash}
        </p>
        <div className="table-scroll">
          <table className="candidate-table">
            <thead>
              <tr>
                <th scope="col">{copy.backtestColumns.name}</th>
                <th scope="col" className="num">
                  {copy.backtestColumns.effort}
                </th>
                <th scope="col">{copy.backtestColumns.range}</th>
                <th scope="col">{copy.backtestColumns.decision}</th>
                <th scope="col">{copy.backtestColumns.actual}</th>
                <th scope="col">{copy.backtestColumns.hit}</th>
                <th scope="col">{copy.backtestColumns.independent}</th>
              </tr>
            </thead>
            <tbody>
              {backtest.rows.map((r) => (
                <tr key={r.id} className="candidate">
                  <td>
                    {r.name}
                    {!r.anchor ? <span className="cpm-muted"> ({copy.proposal})</span> : null}
                  </td>
                  <td className="num">{r.effort_pct.toFixed(1)} %</td>
                  <td className="num-left">
                    {r.p5.toFixed(1)} to {r.p95.toFixed(1)}
                  </td>
                  <td>
                    {r.decision}
                    {r.k3_rule ? <span className="cpm-muted"> (K3 rule)</span> : null}
                  </td>
                  <td>{r.actual ?? ""}</td>
                  <td>{r.ok === null ? "" : r.ok ? copy.hit : copy.miss}</td>
                  <td>{r.anchor ? (r.independent ? copy.hit : copy.miss) : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="stage-source">
          {site.structure.sourceBefore} {dateTime(snapshot.takenAt)}
          {snapshot.codeVersion ? `; ${site.structure.sourceCode} ${snapshot.codeVersion}` : ""}.
        </p>
      </section>
    </div>
  );
}
