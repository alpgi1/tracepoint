import { nameRequirements } from "@/lib/data/requirement-titles";
import Link from "next/link";
import type { CpmCatalogue } from "@/lib/content/cpm-types";
import { domainName } from "@/lib/content/markets";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import type { WorkspaceRead } from "@/lib/data/workspace";
import { site } from "@/lib/site";
import type { RequirementRecord } from "@/lib/workspace/requirements";
import { requirementsHref } from "@/lib/workspace/requirements";
import { DecisionForm, type DecisionFormProps } from "./decision-form";
import { EffortBlock } from "./effort-block";
import { EvidenceList } from "./evidence-list";
import { Reveal } from "./reveal";
import { SourceLine } from "./source-line";
import { Timeline } from "./timeline";
import { requirementArea } from "@/lib/workspace/requirement-name";

/*
 * Stage 3: one requirement, the D2 record on screen (plan 08 section 4.2).
 * The breadcrumb leads back to the index; the title is the h2; the facts
 * (proposal, domain, horizon, markets, evidence level, status) are a
 * hairline definition list after the vertical table of the 21st.dev survey;
 * then the statement, the acceptance criteria as a table, the evidence,
 * assumptions and uncertainties, the CPM effort block, the gate G2
 * decision (a form in the live mode, disabled otherwise, D-085) and the
 * history as a hairline timeline. A server component: nothing of the
 * snapshot reaches the browser beyond the rendered page. The header is the
 * scope layout's (step 20).
 */
export interface RequirementPageProps {
  market: MarketContent;
  vehicle: VehicleContent;
  read: WorkspaceRead;
  record: RequirementRecord;
  catalogue: CpmCatalogue;
  /** The page's own route, the return address of the decision form. */
  pathname: string;
  notice: DecisionFormProps["notice"];
}

export function RequirementPage({ market, vehicle, read, record, catalogue, pathname, notice }: RequirementPageProps) {
  const copy = site.requirements;
  const { snapshot } = read;
  const { requirement: r, detail, effort } = record;
  const events = snapshot.events.filter((e) => e.entity_id === r.id);
  return (
    <Reveal className="stage-body requirement" aria-labelledby="requirement-heading">
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          <li>
            <Link href={requirementsHref(market.code, vehicle.code)} className="crumb-link">
              {copy.all}
            </Link>
          </li>
          <li aria-current="page">
            {requirementArea(r.id)}
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
            <b>{r.recommend ? copy.facts.recommendYes : copy.facts.recommendNo}</b>. {nameRequirements(r.recommend_rationale)}
          </dd>
        </div>
        <div>
          <dt>{copy.facts.horizon}</dt>
          <dd>
            <b>{r.horizon}</b>. {nameRequirements(r.horizon_rationale)}
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
        <div>
          <dt>{copy.facts.reference}</dt>
          <dd>
            <span className="candidate-id">{r.id}</span> <span className="cpm-muted">({copy.facts.referenceNote})</span>
          </dd>
        </div>
      </dl>

      <h3 className="stage-h3">{copy.statement}</h3>
      <p className="requirement-statement">{nameRequirements(r.statement)}</p>

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
      <EffortBlock requirement={r} effort={effort} catalogue={catalogue} />

      <h3 className="stage-h3">{copy.decision.heading}</h3>
      <DecisionForm requirement={r} read={read} pathname={pathname} notice={notice} />

      <h3 className="stage-h3">{copy.history.heading}</h3>
      <p className="workspace-hint">{copy.history.hint}</p>
      <Timeline events={events} />

      <SourceLine read={read} />
    </Reveal>
  );
}

function TextList({ items }: { items: string[] }) {
  if (items.length === 0) return <p className="stage-empty-line">{site.requirements.none}</p>;
  return (
    <ul className="text-list">
      {items.map((item) => (
        <li key={item}>{nameRequirements(item)}</li>
      ))}
    </ul>
  );
}
