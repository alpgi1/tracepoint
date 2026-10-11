import Link from "next/link";
import { dateTime } from "@/lib/content/format";
import type { CpmCatalogue, CpmView } from "@/lib/content/cpm-types";
import { domainName } from "@/lib/content/markets";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import type { AuditEvent, WorkspaceSnapshot } from "@/lib/content/workspace-types";
import { site } from "@/lib/site";
import type { RequirementRecord } from "@/lib/workspace/requirements";
import { requirementsHref } from "@/lib/workspace/requirements";
import type { StageFigures } from "@/lib/workspace/stages";
import { EffortBlock } from "./effort-block";
import { EvidenceList } from "./evidence-list";
import { WorkspaceHeader } from "./workspace-header";

/*
 * Stage 3: one requirement, the D2 record on screen (plan 08 section 4.2).
 * The breadcrumb leads back to the index; the title is the h2; the facts
 * (proposal, domain, horizon, markets, evidence level, status) are a
 * hairline definition list after the vertical table of the 21st.dev survey;
 * then the statement, the acceptance criteria as a table, the evidence,
 * assumptions and uncertainties, the CPM effort block, the gate G2
 * decision (disabled while the page reads a snapshot) and the history as a
 * hairline timeline. A server component: nothing of the snapshot reaches
 * the browser beyond the rendered page.
 */
export interface RequirementPageProps {
  market: MarketContent;
  vehicle: VehicleContent;
  snapshot: WorkspaceSnapshot;
  record: RequirementRecord;
  catalogue: CpmCatalogue;
  view: CpmView;
  figures: StageFigures;
}

export function RequirementPage({ market, vehicle, snapshot, record, catalogue, view, figures }: RequirementPageProps) {
  const copy = site.requirements;
  const { requirement: r, detail, effort } = record;
  const events = snapshot.events.filter((e) => e.entity_id === r.id);
  return (
    <div className="workspace">
      <WorkspaceHeader market={market} vehicle={vehicle} current="requirements" figures={figures} />
      <section className="stage-body requirement" aria-labelledby="requirement-heading">
        <nav className="crumbs" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link href={requirementsHref(market.code, vehicle.code)} className="crumb-link">
                {copy.all}
              </Link>
            </li>
            <li aria-current="page">
              <span className="candidate-id">{r.id}</span>
            </li>
          </ol>
        </nav>
        <h2 id="requirement-heading" className="requirement-title">
          {r.title}
        </h2>
        <dl className="facts">
          <div>
            <dt>{copy.facts.proposal}</dt>
            <dd>
              <b>{r.recommend ? copy.facts.recommendYes : copy.facts.recommendNo}</b>. {r.recommend_rationale}
            </dd>
          </div>
          <div>
            <dt>{copy.facts.horizon}</dt>
            <dd>
              <b>{r.horizon}</b>. {r.horizon_rationale}
            </dd>
          </div>
          <div>
            <dt>{copy.facts.domain}</dt>
            <dd>{domainName(r.domain)}</dd>
          </div>
          <div>
            <dt>{copy.facts.markets}</dt>
            <dd>{r.markets.join(", ")}</dd>
          </div>
          <div>
            <dt>{copy.facts.evidence}</dt>
            <dd>
              <b>{r.evidence_level}</b> <span className="cpm-muted">({copy.facts.evidenceNote})</span>
            </dd>
          </div>
          <div>
            <dt>{copy.facts.status}</dt>
            <dd>
              {r.status}, {copy.facts.version} {String(r.version)}
            </dd>
          </div>
        </dl>

        <h3 className="stage-h3">{copy.statement}</h3>
        <p className="requirement-statement">{r.statement}</p>

        <h3 className="stage-h3">{copy.criteriaHeading}</h3>
        <p className="workspace-hint">{copy.criteriaHint}</p>
        <div className="table-scroll">
          <table className="candidate-table criteria-table">
            <thead>
              <tr>
                <th scope="col">{copy.criteriaColumns.market}</th>
                <th scope="col">{copy.criteriaColumns.metric}</th>
                <th scope="col">{copy.criteriaColumns.target}</th>
                <th scope="col">{copy.criteriaColumns.method}</th>
                <th scope="col">{copy.criteriaColumns.basis}</th>
              </tr>
            </thead>
            <tbody>
              {r.criteria.map((c, i) => (
                <tr key={`${c.market}-${String(i)}`}>
                  <td>{c.market}</td>
                  <td>{c.metric}</td>
                  <td className="criteria-target">{c.target}</td>
                  <td>{c.method}</td>
                  <td>{c.basis}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="stage-h3">{copy.evidenceHeading}</h3>
        <p className="workspace-hint">{copy.evidenceHint}</p>
        <EvidenceList snapshot={snapshot} findings={detail.findings} />

        <h3 className="stage-h3">{copy.assumptionsHeading}</h3>
        <TextList items={r.assumptions} />
        <h3 className="stage-h3">{copy.uncertaintiesHeading}</h3>
        <TextList items={r.uncertainties} />

        <h3 className="stage-h3">{copy.effort.heading}</h3>
        <p className="workspace-hint">{copy.effort.hint}</p>
        <EffortBlock requirement={r} effort={effort} catalogue={catalogue} view={view} />

        <h3 className="stage-h3">{copy.decision.heading}</h3>
        <p className="decision-status">
          {copy.decision.current}: <b>{r.status}</b>, {copy.facts.version} {String(r.version)}.
        </p>
        <div className="button-row" role="group" aria-label={copy.decision.heading}>
          <button type="button" className="filter-apply" disabled>
            {copy.decision.approve}
          </button>
          <button type="button" className="filter-apply" disabled>
            {copy.decision.reject}
          </button>
          <button type="button" className="filter-apply" disabled>
            {copy.decision.defer}
          </button>
        </div>
        <p className="workspace-hint">
          {copy.decision.note} {dateTime(snapshot.snapshot.takenAt)}.
        </p>

        <h3 className="stage-h3">{copy.history.heading}</h3>
        <p className="workspace-hint">{copy.history.hint}</p>
        <History events={events} />

        <p className="stage-source">
          {site.structure.sourceBefore} {dateTime(snapshot.snapshot.takenAt)}
          {snapshot.snapshot.codeVersion ? `; ${site.structure.sourceCode} ${snapshot.snapshot.codeVersion}` : ""}.
        </p>
      </section>
    </div>
  );
}

function TextList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="stage-empty-line">{site.requirements.none}</p>;
  return (
    <ul className="text-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/*
 * The audit events of the requirement as a hairline timeline: a rail, one
 * mark per event, the time, the actor, the action and the rationale; a
 * status change names both states. Method after the timelines of the
 * 21st.dev survey (research notes 6.4) without their images and cards.
 */
function History({ events }: { events: AuditEvent[] }) {
  const copy = site.requirements.history;
  if (events.length === 0) return <p className="stage-empty-line">{site.requirements.none}</p>;
  return (
    <ol className="timeline">
      {events.map((e) => {
        const before = e.before && typeof e.before.status === "string" ? e.before.status : null;
        const after = e.after && typeof e.after.status === "string" ? e.after.status : null;
        return (
          <li key={e.id} className="timeline-item">
            <span className="timeline-time">{dateTime(e.ts)}</span>
            <span className="timeline-body">
              <span className="timeline-head">
                <b>{e.action}</b> · {copy.actors[e.actor_type] ?? e.actor_type} {e.actor_id}
                {before && after && before !== after ? ` · ${copy.statusChange} ${before} ${copy.to} ${after}` : ""}
              </span>
              {e.rationale ? <span className="timeline-text">{e.rationale}</span> : null}
              {e.run_id ? <span className="timeline-text cpm-muted">{e.run_id}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
