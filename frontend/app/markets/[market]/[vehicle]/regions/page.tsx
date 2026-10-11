import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Reveal } from "@/components/workspace/reveal";
import { SeriesView } from "@/components/workspace/series-view";
import { StageWait } from "@/components/workspace/source-line";
import { dateTime } from "@/lib/content/format";
import { allVehicleParams, marketByCode, vehicleHref, vehicleIn } from "@/lib/content/markets";
import { analysesFor, analysesIndex, readBriefs } from "@/lib/data/analyses";
import { site } from "@/lib/site";

/*
 * The series across its regions, a page of stage 1 (step 19): where a
 * series analysis covers the scope, the regions side by side and the
 * analyst's decisions per topic (SeriesView). The body reads the brief at
 * request time (the stored brief, or the API in the live mode) behind the
 * Suspense boundary, under the scope layout's header; the route exists only
 * for the scopes a series covers.
 */
export function generateStaticParams() {
  return allVehicleParams().filter(({ market, vehicle }) => analysesFor(vehicle, market).series !== null);
}

type Props = PageProps<"/markets/[market]/[vehicle]/regions">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) return {};
  return { title: `${v.series} ${site.workspace.regionsLink}` };
}

export default function RegionsPage({ params }: Props) {
  return (
    <Suspense fallback={<StageWait />}>
      <RegionsBody params={params} />
    </Suspense>
  );
}

async function RegionsBody({ params }: { params: Props["params"] }) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v || analysesFor(v.code, m.code).series === null) notFound();
  const briefs = await readBriefs(v.code, m.code);
  if (!briefs.series) notFound();
  const copy = site.regions;
  const series = briefs.series;
  const stored = analysesIndex().snapshot.takenAt;
  return (
    <Reveal className="stage-body" aria-labelledby="regions-heading">
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href={vehicleHref(m.code, v.code)} className="crumb-link">
              {site.stages.names.situation}
            </Link>
          </li>
          <li aria-current="page">{copy.crumb}</li>
        </ol>
      </nav>
      <h2 id="regions-heading" className="stage-h">
        {series.brief.title}
      </h2>
      <p className="workspace-hint stage-hint">{copy.hint}</p>
      <SeriesView read={series} market={m.code} vehicle={v.code} />
      <p className="stage-source">
        {series.live && series.readAt
          ? `${site.structure.sourceLiveBefore} ${dateTime(series.readAt)}`
          : series.reason
            ? `${site.structure.sourceFallback} ${dateTime(stored)}`
            : `${site.structure.sourceBefore} ${dateTime(stored)}`}
        ; {site.structure.sourceModel} {series.brief.modelHash}, {site.structure.sourceModelNote}.
      </p>
    </Reveal>
  );
}
