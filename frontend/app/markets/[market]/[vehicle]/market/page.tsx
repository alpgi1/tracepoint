import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ExternalRows } from "@/components/workspace/external-rows";
import { SourceLine, StagePending } from "@/components/workspace/source-line";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { cpmCatalogue, cpmView, subsystemsByWeight } from "@/lib/content/cpm";
import { full } from "@/lib/content/format";
import { allVehicleParams, marketByCode, vehicleHref, vehicleIn } from "@/lib/content/markets";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { readWorkspace, workspaceSnapshot } from "@/lib/data/workspace";
import { site } from "@/lib/site";
import { stageFigures } from "@/lib/workspace/figures";

/*
 * The market evidence of a scope, a page of stage 1 (step 19, D-102): every
 * statement of the team's external sources that bears on the market (and
 * worldwide ones), grouped by the subsystem it bears on in the vehicle's
 * order of weight, a statement under each subsystem it names, the rest
 * under "not tied to one subsystem". The subsystem dialog shows the first
 * few of a subsystem and links here. Read at request time from the
 * workspace (the snapshot holds GET /external of the scope).
 */
export function generateStaticParams() {
  return allVehicleParams().filter(({ market, vehicle }) => (workspaceSnapshot(vehicle, market)?.external.total ?? 0) > 0);
}

type Props = PageProps<"/markets/[market]/[vehicle]/market">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) return {};
  return { title: `${site.market.heading} ${m.name} · ${v.name}` };
}

export default async function MarketPage({ params }: Props) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v || (workspaceSnapshot(v.code, m.code)?.external.total ?? 0) === 0) notFound();
  return (
    <Suspense fallback={<StagePending />}>
      <MarketBody market={m} vehicle={v} />
    </Suspense>
  );
}

async function MarketBody({ market: m, vehicle: v }: { market: MarketContent; vehicle: VehicleContent }) {
  const read = await readWorkspace(v.code, m.code);
  const view = cpmView(v.code, m.code);
  if (!read || !view) notFound();
  const copy = site.market;
  const { external } = read.snapshot;
  const groups = subsystemsByWeight(cpmCatalogue(), view)
    .map(({ subsystem }) => ({ key: subsystem.key, name: subsystem.name, rows: external.items.filter((r) => r.subsystems.includes(subsystem.key)) }))
    .filter((g) => g.rows.length > 0);
  const loose = external.items.filter((r) => r.subsystems.length === 0);
  return (
    <div className="workspace">
      <WorkspaceHeader market={m} vehicle={v} current="situation" figures={stageFigures(v, m.code, read.snapshot)} />
      <section className="stage-body" aria-labelledby="market-heading">
        <nav className="crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href={vehicleHref(m.code, v.code)} className="crumb-link">
                {site.stages.names.situation}
              </Link>
            </li>
            <li aria-current="page">{site.workspace.marketLink}</li>
          </ol>
        </nav>
        <h2 id="market-heading" className="stage-h">
          {copy.heading} {m.name}
        </h2>
        <p className="workspace-hint stage-hint">{copy.hint}</p>
        <p className="effort-lead">
          <b>
            {full(external.total)} {copy.statements}
          </b>
          , {full(external.verified)} {copy.verified}, {full(external.aboutVehicle)} {copy.about} {v.name} {v.code}.
        </p>
        {groups.map((g) => (
          <section key={g.key} id={g.key} className="market-group" aria-labelledby={`market-${g.key}`}>
            <h3 id={`market-${g.key}`} className="stage-h3">
              {g.name} <span className="cpm-muted">{full(g.rows.length)}</span>
            </h3>
            <ExternalRows rows={g.rows} vehicle={v.code} />
          </section>
        ))}
        {loose.length > 0 ? (
          <section id="unassigned" className="market-group" aria-labelledby="market-unassigned">
            <h3 id="market-unassigned" className="stage-h3">
              {copy.unassigned} <span className="cpm-muted">{full(loose.length)}</span>
            </h3>
            <ExternalRows rows={loose} vehicle={v.code} />
          </section>
        ) : null}
        <SourceLine read={read} />
      </section>
    </div>
  );
}
