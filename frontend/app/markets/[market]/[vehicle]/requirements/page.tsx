import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Reveal } from "@/components/workspace/reveal";
import { SourceLine, StageWait } from "@/components/workspace/source-line";
import { full } from "@/lib/content/format";
import { content, domainName, marketByCode, vehicleIn } from "@/lib/content/markets";
import type { DomainKey } from "@/lib/content/types";
import { readScope } from "@/lib/data/workspace";
import { site } from "@/lib/site";
import { groupByDomain } from "@/lib/workspace/candidates";
import { hasStage, stageParams } from "@/lib/workspace/figures";
import { requirementHref } from "@/lib/workspace/requirements";

/*
 * Stage 3, Requirements definition: the index of the scope's requirements
 * grouped by customer domain, the criteria count of each and how many rest
 * on evidence. Every row links to the requirement page. The body reads the
 * workspace at request time (the snapshot, or the API in the live mode);
 * the heading shows at once under the scope layout's header (step 20).
 */
export function generateStaticParams() {
  return stageParams("requirements");
}

type Props = PageProps<"/markets/[market]/[vehicle]/requirements">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) return {};
  return { title: `${site.requirements.heading} · ${v.name} in ${m.name}` };
}

export default function RequirementsIndex({ params }: Props) {
  const copy = site.requirements;
  return (
    <Reveal className="stage-body" aria-labelledby="requirements-heading">
      <h2 id="requirements-heading" className="stage-h">
        {copy.heading}
      </h2>
      <p className="workspace-hint stage-hint">{copy.indexHint}</p>
      <Suspense fallback={<StageWait />}>
        <IndexBody params={params} />
      </Suspense>
    </Reveal>
  );
}

async function IndexBody({ params }: { params: Props["params"] }) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v || !hasStage("requirements", v.code, m.code)) notFound();
  const read = await readScope(v.code, m.code);
  if (!read) notFound();
  const { snapshot } = read;
  const copy = site.requirements;
  const groups = groupByDomain(
    snapshot.requirements.map((requirement) => ({ requirement })),
    content.domains.map((d) => d.key),
  );
  return (
    <Reveal as="div" className="stage-content">
      <div className="table-scroll">
        <table className="candidate-table">
          <thead>
            <tr>
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
                <th scope="rowgroup" colSpan={5}>
                  {domainName(group.domain as DomainKey)}
                  <span>{String(group.items.length)}</span>
                </th>
              </tr>
              {group.items.map(({ requirement: r }) => {
                const onEvidence = r.criteria.filter((c) => c.basis === "evidence").length;
                return (
                  <tr key={r.id} className="candidate">
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
      <SourceLine read={read} />
    </Reveal>
  );
}
