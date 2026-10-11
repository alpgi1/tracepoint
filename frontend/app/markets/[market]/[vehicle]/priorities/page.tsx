import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { NoRequirements } from "@/components/workspace/no-requirements";
import { EstimateView, H1Sentence, PackagesTable } from "@/components/workspace/package-table";
import { PriorityMatrix } from "@/components/workspace/priority-matrix";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import { dateTime, full } from "@/lib/content/format";
import { allVehicleParams, marketByCode, vehicleHref, vehicleIn } from "@/lib/content/markets";
import type { CpmCatalogue, CpmView } from "@/lib/content/cpm-types";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import type { WorkspaceSnapshot } from "@/lib/content/workspace-types";
import { effortContent, estimatePackage } from "@/lib/data/effort";
import { workspaceSnapshot } from "@/lib/data/workspace";
import { site } from "@/lib/site";
import { stageFigures } from "@/lib/workspace/figures";
import { type MatrixPoint, byEvidence, chosenIds, h1Note, matrixPoints, presetIds } from "@/lib/workspace/priorities";
import { requirementHref } from "@/lib/workspace/requirements";

/*
 * Stage 4, Prioritization (plan 08 section 4.3): the matrix of effort
 * against customer evidence with its table twin, the engine's packages,
 * and the package builder. The shell is prerendered; the builder reads the
 * chosen set from the URL and asks the backend API for the estimate at
 * request time (the one live read so far), behind a Suspense boundary.
 */
export function generateStaticParams() {
  return allVehicleParams();
}

type Props = PageProps<"/markets/[market]/[vehicle]/priorities">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) return {};
  return { title: `${site.priorities.heading} · ${v.name} in ${m.name}` };
}

export default async function PrioritiesPage({ params, searchParams }: Props) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  const snapshot = m && v ? workspaceSnapshot(v.code, m.code) : undefined;
  const view = m && v ? cpmView(v.code, m.code) : undefined;
  if (!m || !v || !snapshot || !view) notFound();
  const copy = site.priorities;
  const catalogue = cpmCatalogue();
  const methodHref = `${vehicleHref(m.code, v.code)}/priorities/method`;
  const points = matrixPoints(snapshot);
  const note = h1Note(snapshot);
  const atZero = points.filter((p) => p.complaintRows === 0);
  return (
    <div className="workspace">
      <WorkspaceHeader market={m} vehicle={v} current="priorities" figures={stageFigures(v, m.code, snapshot)} />
      <section className="stage-body" aria-labelledby="priorities-heading">
        <h2 id="priorities-heading" className="stage-h">
          {copy.heading}
        </h2>
        <p className="workspace-hint stage-hint">
          {copy.hint} {copy.method}{" "}
          <Link href={methodHref} className="cpm-citing-link">
            {snapshot.snapshot.modelHash ?? effortContent().model.modelHash}
          </Link>
          .
        </p>
        {snapshot.requirements.length === 0 ? (
          <NoRequirements market={m} vehicle={v} />
        ) : (
          <>
            <h3 className="stage-h3">{copy.matrixHeading}</h3>
            <p className="workspace-hint stage-hint">{copy.matrixHint}</p>
            <PriorityMatrix points={points} />
            {atZero.length > 0 ? (
              <p className="workspace-hint">
                {copy.zeroNote}:{" "}
                {atZero.map((p, i) => (
                  <span key={p.id}>
                    {i > 0 ? "; " : ""}
                    <Link href={requirementHref(m.code, v.code, p.id)} className="cpm-citing-link">
                      {p.id}
                    </Link>{" "}
                    ({p.primaryKinds.map((k) => site.requirements.kinds[k] ?? k).join(", ")})
                  </span>
                ))}
                .
              </p>
            ) : null}
            <p className="workspace-hint">{copy.tableHint}</p>
            <MatrixTable points={byEvidence(points)} market={m} vehicle={v} />

            <h3 className="stage-h3">{copy.packagesHeading}</h3>
            <p className="workspace-hint stage-hint">{copy.packagesHint}</p>
            <PackagesTable scenarios={snapshot.scenarios} catalogue={catalogue} view={view} />
            {note ? <H1Sentence note={note} market={m.code} vehicle={v.code} /> : null}

            <h3 className="stage-h3">{copy.builderHeading}</h3>
            <p className="workspace-hint stage-hint">{copy.builderHint}</p>
            <Suspense fallback={<div className="stage-pending" aria-busy="true" />}>
              <Builder snapshot={snapshot} market={m} vehicle={v} catalogue={catalogue} view={view} searchParams={searchParams} />
            </Suspense>
          </>
        )}
        <p className="stage-source">
          {site.structure.sourceBefore} {dateTime(snapshot.snapshot.takenAt)}
          {snapshot.snapshot.modelHash ? `; ${site.structure.sourceModel} ${snapshot.snapshot.modelHash}, ${site.structure.sourceModelNote}` : ""}
          {snapshot.snapshot.codeVersion ? `; ${site.structure.sourceCode} ${snapshot.snapshot.codeVersion}` : ""}.
        </p>
      </section>
    </div>
  );
}

function MatrixTable({ points, market, vehicle }: { points: MatrixPoint[]; market: MarketContent; vehicle: VehicleContent }) {
  const copy = site.priorities;
  return (
    <div className="table-scroll">
      <table className="candidate-table">
        <thead>
          <tr>
            <th scope="col">{copy.columns.id}</th>
            <th scope="col">{copy.columns.title}</th>
            <th scope="col">{copy.columns.horizon}</th>
            <th scope="col">{copy.columns.evidence}</th>
            <th scope="col" className="num">
              {copy.columns.rows}
            </th>
            <th scope="col" className="num">
              {copy.columns.effort}
            </th>
            <th scope="col">{copy.columns.range}</th>
            <th scope="col">{copy.columns.decision}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.id} className="candidate">
              <td className="candidate-id">
                <Link href={requirementHref(market.code, vehicle.code, p.id)} className="id-link">
                  {p.id}
                </Link>
              </td>
              <td>{p.title}</td>
              <td>{p.horizon}</td>
              <td>{p.evidence}</td>
              <td className="num">{full(p.complaintRows)}</td>
              <td className="num">{p.effort && p.effort.kind === "change" ? `${p.effort.effort_pct.toFixed(1)} %` : <span className="cpm-muted">{copy.noEstimate}</span>}</td>
              <td className="num-left">{p.effort && p.effort.kind === "change" ? `${p.effort.p5.toFixed(1)} to ${p.effort.p95.toFixed(1)}` : ""}</td>
              <td>{p.effort ? p.effort.decision : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface BuilderProps {
  snapshot: WorkspaceSnapshot;
  market: MarketContent;
  vehicle: VehicleContent;
  catalogue: CpmCatalogue;
  view: CpmView;
  searchParams: Props["searchParams"];
}

async function Builder({ snapshot, market, vehicle, catalogue, view, searchParams }: BuilderProps) {
  const copy = site.priorities;
  const query = await searchParams;
  const chosen = chosenIds(snapshot, query.pkg);
  const chosenSet = new Set(chosen);
  const pathname = `${vehicleHref(market.code, vehicle.code)}/priorities`;
  const preset = (ids: string[]) => (ids.length > 0 ? `${pathname}?${ids.map((id) => `pkg=${id}`).join("&")}#builder` : pathname);
  const efforts = new Map(snapshot.efforts.map((e) => [e.id, e]));
  const groups = (["H1", "H2"] as const).map((h) => ({ horizon: h, items: snapshot.requirements.filter((r) => r.horizon === h) }));
  const result = chosen.length > 0 ? await estimatePackage(vehicle.code, market.code, chosen) : null;
  return (
    <div id="builder" className="builder">
      <form method="get" action={pathname} aria-label={copy.builderLabel}>
        <p className="builder-presets">
          <Link href={preset(presetIds(snapshot, "H1"))} className="crumb-link">
            {copy.presetH1}
          </Link>
          <Link href={preset(presetIds(snapshot, "H2"))} className="crumb-link">
            {copy.presetH2}
          </Link>
          <Link href={preset(presetIds(snapshot, "ALL"))} className="crumb-link">
            {copy.presetAll}
          </Link>
          {chosen.length > 0 ? (
            <Link href={pathname} className="crumb-link">
              {copy.builderClear}
            </Link>
          ) : null}
        </p>
        <div className="builder-groups">
          {groups.map((g) => (
            <fieldset key={g.horizon} className="builder-group">
              <legend>{g.horizon}</legend>
              {g.items.map((r) => {
                const e = efforts.get(r.id);
                return (
                  <label key={r.id} className="pick">
                    <input type="checkbox" name="pkg" value={r.id} defaultChecked={chosenSet.has(r.id)} />
                    <span className="candidate-id">{r.id}</span>
                    <span className="pick-title">{r.title}</span>
                    <span className="pick-figure cpm-muted">{e && e.kind === "change" ? `${e.effort_pct.toFixed(1)} %, ${e.decision}` : (e?.decision ?? "")}</span>
                  </label>
                );
              })}
            </fieldset>
          ))}
        </div>
        <button type="submit" className="filter-apply">
          {copy.builderApply}
        </button>
      </form>
      {result === null ? (
        <p className="stage-empty-line">{copy.noneChosen}</p>
      ) : result.ok ? (
        <>
          <h4 className="stage-h4">{copy.resultHeading}</h4>
          <EstimateView response={result.response} catalogue={catalogue} view={view} market={market.code} vehicle={vehicle.code} />
          <p className="workspace-hint">
            {copy.apiBefore} {result.api} {copy.apiAfter}
          </p>
        </>
      ) : (
        <p className="stage-empty">
          {copy.apiMissing} ({result.api}: {result.reason})
        </p>
      )}
    </div>
  );
}
