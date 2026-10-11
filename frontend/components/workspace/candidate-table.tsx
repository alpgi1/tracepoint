import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { cpmCatalogue } from "@/lib/content/cpm";
import { domainName } from "@/lib/content/markets";
import type { DomainKey, MarketCode } from "@/lib/content/types";
import type { ExcludedCandidate } from "@/lib/content/workspace-types";
import { site } from "@/lib/site";
import type { Candidate, CandidateView } from "@/lib/workspace/candidates";
import { requirementHref } from "@/lib/workspace/requirements";

/*
 * Stage 2: the candidate table, grouped by customer domain. Columns: the
 * requirement id, the title (a native details element that opens the
 * agent's rationale, the horizon rationale, the subsystems the change
 * starts in and reaches, and the rules that put it in front of the PM),
 * the 0/1 proposal, horizon, evidence level, effort with its class and a
 * thin bar, and the gate status. Method after the hairline tables and the
 * expanding sub-row of the 21st.dev survey (Origin UI table, accordion
 * "table w/ chevron"; frontend/docs/01-research-notes.md 6.3), written as
 * a plain table with the tokens: no row selection, no status pills, no
 * flags, no avatars; the chevron of the accordion rows marks the row that
 * opens. The bar follows the chart rules: one series in the
 * one blue, 3 px, the value as text beside it (dataviz: thin marks, text in
 * ink, a single series needs no legend).
 */
export interface CandidateTableProps {
  groups: { domain: string; items: Candidate[] }[];
  view: CandidateView;
  market: MarketCode;
  vehicle: string;
}

export function CandidateTable({ groups, view, market, vehicle }: CandidateTableProps) {
  const copy = site.structure;
  const maxEffort = Math.max(0, ...groups.flatMap((g) => g.items.map((c) => c.effort?.effort_pct ?? 0)));
  return (
    <div className="table-scroll">
      <table className="candidate-table">
        <thead>
          <tr>
            <th scope="col">{copy.columns.title}</th>
            <th scope="col" className="num">
              {copy.columns.recommend}
            </th>
            <th scope="col">{copy.columns.horizon}</th>
            <th scope="col">{copy.columns.evidence}</th>
            <th scope="col" className="effort-cell">
              {copy.columns.effort}
            </th>
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
            {group.items.map((candidate) => (
              <CandidateRow key={candidate.requirement.id} candidate={candidate} view={view} maxEffort={maxEffort} href={requirementHref(market, vehicle, candidate.requirement.id)} />
            ))}
          </tbody>
        ))}
      </table>
    </div>
  );
}

interface CandidateRowProps {
  candidate: Candidate;
  view: CandidateView;
  maxEffort: number;
  /** The requirement page (stage 3). */
  href: string;
}

function CandidateRow({ candidate, view, maxEffort, href }: CandidateRowProps) {
  const copy = site.structure;
  const { requirement: r, effort, starts, reaches, reasons } = candidate;
  const names = (keys: string[]) => keys.map((k) => subsystemName(k)).join(", ");
  const hasEstimate = effort !== null && effort.kind === "change";
  return (
    <tr className="candidate">
      <td className="candidate-title">
        <details className="candidate-details" open={view === "inbox" ? true : undefined}>
          <summary className="candidate-summary">
            <ChevronDown className="candidate-chevron" aria-hidden="true" size={16} strokeWidth={1.75} />
            {r.title}
          </summary>
          <div className="candidate-more">
            <p>
              <Link href={href} className="cpm-citing-link">
                {copy.openRequirement}
              </Link>
            </p>
            {reasons.length > 0 ? (
              <>
                <p className="candidate-more-label">{copy.reasonsHeading}</p>
                <ul className="candidate-reasons">
                  {reasons.map((reason, i) => (
                    <li key={`${reason.rule}-${String(i)}`}>
                      <b>{copy.rules[reason.rule]}</b>: {reason.detail}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
            <p>
              <span className="cpm-muted">{copy.rationale}.</span> {r.recommend_rationale}
            </p>
            <p>
              <span className="cpm-muted">{copy.horizonWhy}.</span> {r.horizon_rationale}
            </p>
            {starts.length > 0 ? (
              <p>
                <span className="cpm-muted">{copy.startsIn}</span> {names(starts)}
                {reaches.length > 0 ? `; ${copy.reaches} ${names(reaches)}` : ""}.
              </p>
            ) : null}
          </div>
        </details>
      </td>
      <td className="num">{r.recommend ? copy.recommendYes : copy.recommendNo}</td>
      <td>{r.horizon}</td>
      <td>{r.evidence_level}</td>
      <td className="effort-cell">
        {hasEstimate ? (
          <>
            <span className="effort-figure">
              <span className="num">
                {effort.effort_pct.toFixed(1)} {copy.effortUnit}
              </span>
              <span className="cpm-muted">{effort.decision}</span>
            </span>
            <span className="effort-bar" aria-hidden="true">
              <span style={{ width: `${String(maxEffort > 0 ? (effort.effort_pct / maxEffort) * 100 : 0)}%` }} />
            </span>
          </>
        ) : (
          <span className="cpm-muted">{copy.effortNone}</span>
        )}
      </td>
      <td>{r.status}</td>
    </tr>
  );
}

function subsystemName(key: string): string {
  return cpmCatalogue().subsystems.find((s) => s.key === key)?.name ?? key;
}

export function ExcludedTable({ excluded }: { excluded: ExcludedCandidate[] }) {
  const copy = site.structure;
  return (
    <div className="table-scroll">
      <table className="candidate-table">
        <thead>
          <tr>
            <th scope="col">{copy.excludedColumns.finding}</th>
            <th scope="col">{copy.excludedColumns.reason}</th>
          </tr>
        </thead>
        <tbody>
          {excluded.map((x) => (
            <tr key={x.finding} className="candidate">
              <td className="candidate-id">{x.finding}</td>
              <td className="candidate-reason">{x.reason}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
