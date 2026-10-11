import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NoRequirements } from "@/components/workspace/no-requirements";
import { WorkspaceHeader } from "@/components/workspace/workspace-header";
import { dateTime, full } from "@/lib/content/format";
import { allVehicleParams, content, domainName, marketByCode, vehicleIn } from "@/lib/content/markets";
import type { DomainKey } from "@/lib/content/types";
import { workspaceSnapshot } from "@/lib/data/workspace";
import { site } from "@/lib/site";
import { groupByDomain } from "@/lib/workspace/candidates";
import { stageFigures } from "@/lib/workspace/figures";
import { requirementHref } from "@/lib/workspace/requirements";

/*
 * Stage 3, Requirements definition: the index of the scope's requirements
 * grouped by customer domain, the criteria count of each and how many rest
 * on evidence. Every row links to the requirement page. Static per scope.
 */
export function generateStaticParams() {
  return allVehicleParams();
}

type Props = PageProps<"/markets/[market]/[vehicle]/requirements">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) return {};
  return { title: `${site.requirements.heading} · ${v.name} in ${m.name}` };
}

export default async function RequirementsIndex({ params }: Props) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  const snapshot = m && v ? workspaceSnapshot(v.code, m.code) : undefined;
  if (!m || !v || !snapshot) notFound();
  const copy = site.requirements;
  const groups = groupByDomain(
    snapshot.requirements.map((requirement) => ({ requirement })),
    content.domains.map((d) => d.key),
  );
  return (
    <div className="workspace">
      <WorkspaceHeader market={m} vehicle={v} current="requirements" figures={stageFigures(v, m.code, snapshot)} />
      <section className="stage-body" aria-labelledby="requirements-heading">
        <h2 id="requirements-heading" className="stage-h">
          {copy.heading}
        </h2>
        <p className="workspace-hint stage-hint">{copy.indexHint}</p>
        {snapshot.requirements.length === 0 ? (
          <NoRequirements market={m} vehicle={v} />
        ) : (
          <div className="table-scroll">
            <table className="candidate-table">
              <thead>
                <tr>
                  <th scope="col">{copy.columns.id}</th>
                  <th scope="col">{copy.columns.title}</th>
                  <th scope="col">{copy.columns.criteria}</th>
                  <th scope="col">{copy.columns.horizon}</th>
                  <th scope="col">{copy.columns.evidence}</th>
                  <th scope="col">{copy.columns.status}</th>
                </tr>
              </thead>
              {groups.map((group) => (
                <tbody key={group.domain}>
                  <tr className="candidate-group">
                    <th scope="rowgroup" colSpan={6}>
                      {domainName(group.domain as DomainKey)}
                      <span>{String(group.items.length)}</span>
                    </th>
                  </tr>
                  {group.items.map(({ requirement: r }) => {
                    const onEvidence = r.criteria.filter((c) => c.basis === "evidence").length;
                    return (
                      <tr key={r.id} className="candidate">
                        <td className="candidate-id">
                          <Link href={requirementHref(m.code, v.code, r.id)} className="id-link">
                            {r.id}
                          </Link>
                        </td>
                        <td>
                          <Link href={requirementHref(m.code, v.code, r.id)} className="title-link">
                            {r.title}
                          </Link>
                        </td>
                        <td className="num">
                          {full(r.criteria.length)} <span className="cpm-muted">· {full(onEvidence)} {copy.columns.onEvidence}</span>
                        </td>
                        <td>{r.horizon}</td>
                        <td>{r.evidence_level}</td>
                        <td>{r.status}</td>
                      </tr>
                    );
                  })}
                </tbody>
              ))}
            </table>
          </div>
        )}
        <p className="stage-source">
          {site.structure.sourceBefore} {dateTime(snapshot.snapshot.takenAt)}
          {snapshot.snapshot.codeVersion ? `; ${site.structure.sourceCode} ${snapshot.snapshot.codeVersion}` : ""}.
        </p>
      </section>
    </div>
  );
}
