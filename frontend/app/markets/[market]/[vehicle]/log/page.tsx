import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Reveal } from "@/components/workspace/reveal";
import { SourceLine, StageWait } from "@/components/workspace/source-line";
import { Timeline } from "@/components/workspace/timeline";
import { dateTime, full } from "@/lib/content/format";
import { marketByCode, vehicleHref, vehicleIn } from "@/lib/content/markets";
import { readScope } from "@/lib/data/workspace";
import { site } from "@/lib/site";
import { hasStage, stageParams } from "@/lib/workspace/figures";
import { decisionRecord, timelineOf } from "@/lib/workspace/log";
import { requirementHref } from "@/lib/workspace/requirements";

/*
 * Stage 5, Documentation (plan 08 section 4.4, D-085): the decision record
 * of the scope (every requirement with its gate status and the latest
 * decision), the export of the D2 list as CSV, and the audit trail newest
 * first. Nothing is computed beyond joins; the body reads the workspace at
 * request time (the snapshot, or the API in the live mode) under the scope
 * layout's header; the heading shows at once (step 20).
 */
export function generateStaticParams() {
  return stageParams("documentation");
}

type Props = PageProps<"/markets/[market]/[vehicle]/log">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v) return {};
  return { title: `${site.log.heading} · ${v.name} in ${m.name}` };
}

export default function LogPage({ params }: Props) {
  const copy = site.log;
  return (
    <Reveal className="stage-body" aria-labelledby="log-heading">
      <h2 id="log-heading" className="stage-h">
        {copy.heading}
      </h2>
      <p className="workspace-hint stage-hint">{copy.hint}</p>
      <Suspense fallback={<StageWait />}>
        <LogBody params={params} />
      </Suspense>
    </Reveal>
  );
}

async function LogBody({ params }: { params: Props["params"] }) {
  const { market, vehicle } = await params;
  const m = marketByCode(market);
  const v = m ? vehicleIn(m, vehicle) : undefined;
  if (!m || !v || !hasStage("documentation", v.code, m.code)) notFound();
  const read = await readScope(v.code, m.code);
  if (!read) notFound();
  const { snapshot } = read;
  const copy = site.log;
  const rows = decisionRecord(snapshot);
  const decided = rows.filter((row) => row.requirement.status !== "proposed").length;
  const events = timelineOf(snapshot);
  const csvHref = `${vehicleHref(m.code, v.code)}/log/requirements.csv`;
  const mdHref = `${vehicleHref(m.code, v.code)}/log/requirements.md`;
  return (
    <Reveal as="div" className="stage-content">
      <h3 className="stage-h3">{copy.recordHeading}</h3>
      <p className="effort-lead">
        <b>
          {full(decided)} {copy.decidedBefore} {full(rows.length)}
        </b>{" "}
        {copy.recordLead}
      </p>
      <div className="table-scroll">
        <table className="candidate-table record-table">
          <thead>
            <tr>
              <th scope="col">{copy.columns.id}</th>
              <th scope="col">{copy.columns.title}</th>
              <th scope="col">{copy.columns.status}</th>
              <th scope="col" className="num">
                {copy.columns.version}
              </th>
              <th scope="col">{copy.columns.decision}</th>
              <th scope="col">{copy.columns.by}</th>
              <th scope="col">{copy.columns.when}</th>
              <th scope="col">{copy.columns.note}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ requirement: r, decision: d }) => (
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
                <td>{r.status}</td>
                <td className="num">{String(r.version)}</td>
                <td>{d && typeof d.after?.status === "string" ? d.after.status : <span className="cpm-muted">{copy.noDecision}</span>}</td>
                <td>{d ? d.actor_id : ""}</td>
                <td className="record-when">{d ? dateTime(d.ts) : ""}</td>
                <td className="record-note">{d?.rationale ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="stage-h3">{copy.exportHeading}</h3>
      <p className="workspace-hint stage-hint">{copy.exportHint}</p>
      <p className="export-row">
        <a href={csvHref} className="filter-apply export-link" download>
          {copy.exportCsv}
        </a>
        <a href={mdHref} className="filter-apply export-link" download>
          {copy.exportMd}
        </a>
      </p>

      <h3 className="stage-h3">{copy.timelineHeading}</h3>
      <p className="workspace-hint stage-hint">{copy.timelineHint}</p>
      <p className="effort-lead">
        <b>
          {full(events.length)} {copy.events}
        </b>
      </p>
      <Timeline events={events} linkTo={(id) => requirementHref(m.code, v.code, id)} />
      <SourceLine read={read} />
    </Reveal>
  );
}
