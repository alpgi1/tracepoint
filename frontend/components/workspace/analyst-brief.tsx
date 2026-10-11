import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { BriefInsight, BriefProposal, ReferenceItem, SituationBrief } from "@/lib/content/brief-types";
import { dateTime } from "@/lib/content/format";
import type { MarketCode } from "@/lib/content/types";
import type { BriefRead } from "@/lib/data/analyses";
import { site } from "@/lib/site";
import { requirementHref } from "@/lib/workspace/requirements";
import { Checks, EffortCell, EffortLine, PackageLines, ReferenceList } from "./brief-parts";
import { requirementArea } from "@/lib/workspace/requirement-name";

/*
 * The analyst's brief at the top of stage 2 (plan 08 section 4.1, step 19):
 * the situation analysis the analyst agent wrote for the scope, as the
 * backend serves it for the product manager (GET /analyses/{key}/brief,
 * D-100). The answer first, then the proposals sorted by what they ask of
 * the vehicle (change now, with the next generation, keep) in one hairline
 * table whose rows open the reasoning, the effort and the evidence, then the
 * engine's packages per horizon, then what customers say by kind, then what
 * is open. A proposal's requirement links to stage 3 where the scope holds
 * it. Method after the candidate table of step 14 (the 21st.dev hairline
 * table with an expanding row); a server component, rendered as text.
 */
export interface AnalystBriefProps {
  read: BriefRead;
  market: MarketCode;
  vehicle: string;
  /** The requirement ids of the scope, so a proposal links only to a page that exists. */
  requirementIds: Set<string>;
  /** The series page of the scope, where a series analysis covers it. */
  regionsHref: string | null;
}

export function AnalystBrief({ read, market, vehicle, requirementIds, regionsHref }: AnalystBriefProps) {
  const copy = site.brief;
  const b = read.brief as SituationBrief;
  const byN = new Map(b.proposals.map((p) => [p.n, p]));
  const max = Math.max(0, ...b.proposals.map((p) => p.effort.effortPct ?? 0));
  const linkOf = (item: ReferenceItem) => (item.kind === "requirement" && requirementIds.has(item.ref) ? requirementHref(market, vehicle, item.ref) : null);
  return (
    <section className="brief" aria-labelledby="brief-heading">
      <h3 id="brief-heading" className="stage-h3">
        {copy.heading}
      </h3>
      <p className="workspace-hint stage-hint">{copy.hint}</p>
      <p className="workspace-hint">
        {b.country ? `${copy.analysedFor} ${b.title}. ` : ""}
        {b.run.ranAt ? `${copy.written} ${dateTime(b.run.ranAt)} ${copy.with} ${b.run.model}. ` : ""}
        {String(b.citations.cited)} {copy.cited}
        {b.citations.unknown.length > 0 ? `, ${String(b.citations.unknown.length)} ${copy.unknown}` : ""}
        {b.citations.quotesLeftOut > 0 ? `; ${String(b.citations.quotesLeftOut)} ${copy.quotesLeftOut}` : ""}.
      </p>
      <p className="brief-headline">{b.headline}</p>
      <p className="brief-summary">{b.summary}</p>
      {regionsHref ? (
        <p className="brief-summary">
          <Link href={regionsHref} className="cpm-citing-link">
            {copy.seriesLink}
          </Link>
        </p>
      ) : null}

      <h4 className="stage-h4">{copy.proposalsHeading}</h4>
      <div className="table-scroll">
        <table className="candidate-table brief-table">
          <thead>
            <tr>
              <th scope="col" className="num">
                {copy.columns.n}
              </th>
              <th scope="col">{copy.columns.proposal}</th>
              <th scope="col" className="effort-cell">
                {copy.columns.effort}
              </th>
              <th scope="col">{copy.columns.requirement}</th>
            </tr>
          </thead>
          {b.proposalGroups.map((group) => (
            <tbody key={group.group}>
              <tr className="candidate-group">
                <th scope="rowgroup" colSpan={4}>
                  {group.label}
                  <span>{String(group.proposals.length)}</span>
                </th>
              </tr>
              {group.proposals.map((n) => {
                const p = byN.get(n);
                return p ? <ProposalRow key={n} p={p} max={max} market={market} vehicle={vehicle} requirementIds={requirementIds} linkOf={linkOf} /> : null;
              })}
            </tbody>
          ))}
        </table>
      </div>
      <PackageLines packages={b.packages} />

      <h4 className="stage-h4">{copy.customersHeading}</h4>
      {b.customers.map((group) => (
        <div key={group.group} className="brief-group">
          <p className="brief-group-label">{group.label}</p>
          <ul className="brief-insights">
            {group.items.map((item) => (
              <Insight key={item.title} item={item} linkOf={linkOf} />
            ))}
          </ul>
        </div>
      ))}

      {b.assumptions.length > 0 || b.openChecks.length > 0 ? <h4 className="stage-h4">{copy.openHeading}</h4> : null}
      {b.assumptions.length > 0 ? (
        <>
          <p className="brief-group-label">{copy.assumptions}</p>
          <ul className="text-list">
            {b.assumptions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      ) : null}
      {b.openChecks.length > 0 ? (
        <>
          <p className="brief-group-label">{copy.openChecks}</p>
          <ul className="text-list">
            {b.openChecks.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

interface ProposalRowProps {
  p: BriefProposal;
  max: number;
  market: MarketCode;
  vehicle: string;
  requirementIds: Set<string>;
  linkOf: (item: ReferenceItem) => string | null;
}

function ProposalRow({ p, max, market, vehicle, requirementIds, linkOf }: ProposalRowProps) {
  const copy = site.brief;
  return (
    <tr className="candidate">
      <td className="num">{String(p.n)}</td>
      <td className="candidate-title">
        <details className="candidate-details">
          <summary className="candidate-summary">
            <ChevronDown className="candidate-chevron" aria-hidden="true" size={16} strokeWidth={1.75} />
            {p.title}
          </summary>
          <div className="candidate-more">
            <p>{p.proposal}</p>
            <p>
              <span className="cpm-muted">{copy.why}.</span> {p.why}
            </p>
            <EffortLine effort={p.effort} />
            <Checks checks={p.effort.checks} />
            <ReferenceList evidence={p.evidence} linkOf={linkOf} />
          </div>
        </details>
      </td>
      <td className="effort-cell">
        <EffortCell effort={p.effort} max={max} />
      </td>
      <td>
        {p.requirement && requirementIds.has(p.requirement) ? (
          <Link href={requirementHref(market, vehicle, p.requirement)} className="title-link">
            {requirementArea(p.requirement)}
          </Link>
        ) : p.requirement ? (
          <span>{requirementArea(p.requirement)}</span>
        ) : (
          <span className="cpm-muted">{copy.newProposal}</span>
        )}
      </td>
    </tr>
  );
}

function Insight({ item, linkOf }: { item: BriefInsight; linkOf: (item: ReferenceItem) => string | null }) {
  return (
    <li className="brief-insight">
      <p className="brief-insight-title">{item.title}</p>
      <p>{item.statement}</p>
      {item.quote ? <blockquote className="refs-quote">{item.quote}</blockquote> : null}
      <p className="refs-meta">
        {item.domainLabel} · {item.confidenceLabel}
        {item.subsystems.length > 0 ? ` · ${item.subsystems.map((s) => s.name).join(", ")}` : ""}
      </p>
      <ReferenceList evidence={item.evidence} linkOf={linkOf} />
    </li>
  );
}
