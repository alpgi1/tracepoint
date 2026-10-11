import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CandidateFilters } from "@/components/workspace/candidate-filters";
import { CandidateTable, ExcludedTable } from "@/components/workspace/candidate-table";
import { NoRequirements } from "@/components/workspace/no-requirements";
import { SourceLine, StagePending } from "@/components/workspace/source-line";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { cpmCatalogue, cpmView } from "@/lib/content/cpm";
import { allVehicleParams, content, domainName, marketByCode, vehicleHref, vehicleIn } from "@/lib/content/markets";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import type { WorkspaceSnapshot } from "@/lib/content/workspace-types";
import { readWorkspace, workspaceSnapshot } from "@/lib/data/workspace";
import { site } from "@/lib/site";
import {
  type Candidate,
  type CandidateFilter,
  type CandidateView,
  candidatesOf,
  filterCandidates,
  groupByDomain,
  viewCandidates,
} from "@/lib/workspace/candidates";
import { stageFigures } from "@/lib/workspace/figures";

/*
 * Stage 2 of the scope workspace, Structure & context: all potential
 * requirements of the vehicle in the market with the agent's 0/1 proposal
 * (plan 08 section 4.1). The body reads the workspace at request time (the
 * snapshot, or the API in the live mode, D-085) and the view and the
 * filters from the URL, behind the Suspense boundary (Cache Components).
 */
export function generateStaticParams() {
  return allVehicleParams();
}

type Props = PageProps<"/markets/[market]/[vehicle]/structure">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) return {};
  return { title: `${site.structure.heading} · ${v.name} in ${m.name}` };
}

export default async function StructurePage({ params, searchParams }: Props) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v || !workspaceSnapshot(v.code, m.code)) notFound();
  return (
    <Suspense fallback={<StagePending />}>
      <StructureBody market={m} vehicle={v} searchParams={searchParams} />
    </Suspense>
  );
}

async function StructureBody({ market: m, vehicle: v, searchParams }: { market: MarketContent; vehicle: VehicleContent; searchParams: Props["searchParams"] }) {
  const [read, query] = await Promise.all([readWorkspace(v.code, m.code), searchParams]);
  if (!read) notFound();
  const { snapshot } = read;
  const copy = site.structure;
  const figures = stageFigures(v, m.code, snapshot);
  return (
    <div className="workspace">
      <WorkspaceHeader market={m} vehicle={v} current="structure" figures={figures} />
      <section className="stage-body" aria-labelledby="structure-heading">
        <h2 id="structure-heading" className="stage-h">
          {copy.heading}
        </h2>
        <p className="workspace-hint stage-hint">{copy.hint}</p>
        {snapshot.requirements.length === 0 ? <NoRequirements market={m} vehicle={v} /> : <Candidates snapshot={snapshot} market={m} vehicle={v} query={query} />}
        <SourceLine read={read} />
      </section>
    </div>
  );
}

interface CandidatesProps {
  snapshot: WorkspaceSnapshot;
  market: MarketContent;
  vehicle: VehicleContent;
  query: Awaited<Props["searchParams"]>;
}

const VIEWS: CandidateView[] = ["inbox", "all", "excluded"];

function Candidates({ snapshot, market, vehicle, query }: CandidatesProps) {
  const copy = site.structure;
  const one = (key: string) => {
    const value = query[key];
    return typeof value === "string" && value !== "" ? value : undefined;
  };
  const requested = one("view");
  const view: CandidateView = VIEWS.includes(requested as CandidateView) ? (requested as CandidateView) : "inbox";
  const filter: CandidateFilter = { domain: one("domain"), subsystem: one("subsystem"), horizon: one("horizon"), status: one("status") };
  const pathname = `${vehicleHref(market.code, vehicle.code)}/structure`;

  const all = candidatesOf(snapshot, cpmView(vehicle.code, market.code));
  const filtered = filterCandidates(all, filter);
  const shown = viewCandidates(filtered, view);
  const domainOrder = content.domains.map((d) => d.key);
  const groups = groupByDomain(shown, domainOrder);
  const counts = { inbox: viewCandidates(filtered, "inbox").length, all: filtered.length, excluded: snapshot.excluded.length };
  return (
    <>
      <CandidateFilters pathname={pathname} view={view} filter={filter} counts={counts} options={filterOptions(all, domainOrder)} />
      <p className="workspace-hint stage-view-hint">{view === "inbox" ? copy.inboxHint : view === "all" ? copy.allHint : copy.excludedHint}</p>
      {view === "excluded" ? (
        snapshot.excluded.length > 0 ? (
          <ExcludedTable excluded={snapshot.excluded} />
        ) : (
          <p className="stage-empty">{copy.noExcluded}</p>
        )
      ) : shown.length > 0 ? (
        <CandidateTable groups={groups} view={view} market={market.code} vehicle={vehicle.code} />
      ) : (
        <p className="stage-empty">{filtered.length === 0 ? copy.noMatch : copy.noInbox}</p>
      )}
    </>
  );
}

/** The filter options are the values that occur among the scope's candidates, in the catalogue's order. */
function filterOptions(all: Candidate[], domainOrder: string[]) {
  const domains = new Set(all.map((c) => c.requirement.domain));
  const touched = new Set(all.flatMap((c) => [...c.starts, ...c.reaches]));
  const horizons = new Set(all.map((c) => c.requirement.horizon));
  const statuses = new Set(all.map((c) => c.requirement.status));
  return {
    domain: domainOrder.filter((d) => domains.has(d as Candidate["requirement"]["domain"])).map((d) => ({ value: d, label: domainName(d as Candidate["requirement"]["domain"]) })),
    subsystem: cpmCatalogue()
      .subsystems.filter((s) => touched.has(s.key))
      .map((s) => ({ value: s.key, label: s.name })),
    horizon: ["H1", "H2"].filter((h) => horizons.has(h as "H1" | "H2")).map((h) => ({ value: h, label: h })),
    status: ["proposed", "approved", "rejected", "deferred"].filter((s) => statuses.has(s as Candidate["requirement"]["status"])).map((s) => ({ value: s, label: s })),
  };
}
