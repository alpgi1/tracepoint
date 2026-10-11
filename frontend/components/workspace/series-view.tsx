import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { SeriesBrief, SeriesTopic } from "@/lib/content/brief-types";
import { dateTime, full } from "@/lib/content/format";
import { marketByCode, vehicleHref, vehicleIn } from "@/lib/content/markets";
import type { MarketCode } from "@/lib/content/types";
import type { BriefRead } from "@/lib/data/analyses";
import { site } from "@/lib/site";
import { Checks, EffortCell, EffortLine, PackageLines, ReferenceList } from "./brief-parts";

/*
 * One series across its regions (step 19): the series analysis as the
 * backend serves it for the product manager (GET /analyses/{key}/brief,
 * D-100). The answer first, the regions side by side, then the topics
 * sorted into the five decisions (change now in every region, change now
 * in one region, next generation, keep, no action) in one hairline table
 * whose rows open the regional evidence, the reasoning, the effort and the
 * references; then the engine's packages, what each region expects, the
 * optimum version, and what the data cannot answer. The region of the
 * current workspace is marked; every region links to its own workspace.
 * A server component, rendered as text.
 */
export interface SeriesViewProps {
  read: BriefRead;
  market: MarketCode;
  vehicle: string;
}

function regionHref(label: string, vehicleCode: string): string | null {
  const m = marketByCode(label);
  return m && vehicleIn(m, vehicleCode) ? vehicleHref(m.code, vehicleCode) : null;
}

export function SeriesView({ read, market, vehicle }: SeriesViewProps) {
  const copy = site.regions;
  const b = read.brief as SeriesBrief;
  const byN = new Map(b.topics.map((t) => [t.n, t]));
  const max = Math.max(0, ...b.topics.map((t) => t.effort.effortPct ?? 0));
  const regionNames = new Map(b.regions.map((r) => [r.label, r.name]));
  return (
    <>
      <p className="workspace-hint">
        {b.run.ranAt ? `${site.brief.written} ${dateTime(b.run.ranAt)} ${site.brief.with} ${b.run.model}. ` : ""}
        {String(b.citations.cited)} {site.brief.cited}
        {b.citations.unknown.length > 0 ? `, ${String(b.citations.unknown.length)} ${site.brief.unknown}` : ""}.
      </p>
      <p className="brief-headline">{b.headline}</p>
      <p className="brief-summary">{b.answer}</p>

      <h3 className="stage-h3">{copy.regionsHeading}</h3>
      <div className="table-scroll">
        <table className="candidate-table">
          <thead>
            <tr>
              <th scope="col">{copy.regionColumns.region}</th>
              <th scope="col">{copy.regionColumns.vehicle}</th>
              <th scope="col" className="num">
                {copy.regionColumns.verbatims}
              </th>
              <th scope="col" className="num">
                {copy.regionColumns.sales2025}
              </th>
              <th scope="col" className="num">
                {copy.regionColumns.sales2030}
              </th>
              <th scope="col">{copy.regionColumns.study}</th>
            </tr>
          </thead>
          <tbody>
            {b.regions.map((r) => {
              const href = regionHref(r.label, r.vehicle);
              const here = r.market === market && r.vehicle === vehicle;
              return (
                <tr key={r.label} className="candidate" aria-current={here ? "true" : undefined}>
                  <td>
                    {href && !here ? (
                      <Link href={href} className="cpm-citing-link">
                        {r.name}
                      </Link>
                    ) : (
                      r.name
                    )}
                    {here ? <span className="cpm-muted"> ({copy.thisScope})</span> : null}
                  </td>
                  <td className="candidate-id">{r.vehicle}</td>
                  <td className="num">{r.verbatims > 0 ? full(r.verbatims) : copy.noVerbatims}</td>
                  <td className="num">{r.sales2025 !== null ? full(r.sales2025) : ""}</td>
                  <td className="num">{r.sales2030 !== null ? full(r.sales2030) : ""}</td>
                  <td>{r.study ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h3 className="stage-h3">{copy.decisionsHeading}</h3>
      <div className="table-scroll">
        <table className="candidate-table brief-table">
          <thead>
            <tr>
              <th scope="col" className="num">
                {copy.topicColumns.n}
              </th>
              <th scope="col">{copy.topicColumns.topic}</th>
              <th scope="col">{copy.topicColumns.for}</th>
              <th scope="col" className="effort-cell">
                {copy.topicColumns.effort}
              </th>
              <th scope="col">{copy.topicColumns.confidence}</th>
            </tr>
          </thead>
          {b.decisions.map((d) => (
            <tbody key={d.decision}>
              <tr className="candidate-group">
                <th scope="rowgroup" colSpan={5}>
                  {d.label}
                  <span>{String(d.topics.length)}</span>
                  <span className="group-explain">{d.explain}</span>
                </th>
              </tr>
              {d.topics.map((n) => {
                const t = byN.get(n);
                return t ? <TopicRow key={n} t={t} max={max} regionNames={regionNames} /> : null;
              })}
            </tbody>
          ))}
        </table>
      </div>
      <PackageLines packages={b.packages} />

      <h3 className="stage-h3">{copy.expectsHeading}</h3>
      {b.regions.map((r) => (
        <div key={r.label} className="brief-group">
          <p className="brief-group-label">
            {r.name}, {r.verbatims > 0 ? `${full(r.verbatims)} ${site.readout.verbatims}` : site.readout.noVerbatims}
          </p>
          <ul className="text-list">
            {r.expects.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </div>
      ))}

      <h3 className="stage-h3">{copy.optimumHeading}</h3>
      <OptimumList label={copy.everyRegion} items={b.optimum.everyMarket} />
      {b.optimum.regional.map((x) => (
        <OptimumList key={x.region} label={`${copy.only} ${regionNames.get(x.region) ?? x.region}`} items={x.items} empty={copy.nothingOwn} />
      ))}
      <OptimumList label={copy.nextGeneration} items={b.optimum.nextGeneration} />
      <OptimumList label={copy.keep} items={b.optimum.keep} />

      {b.unknowns.length > 0 ? (
        <>
          <h3 className="stage-h3">{copy.unknownsHeading}</h3>
          <ul className="text-list">
            {b.unknowns.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </>
      ) : null}
      {b.openChecks.length > 0 ? (
        <>
          <p className="brief-group-label">{site.brief.openChecks}</p>
          <ul className="text-list">
            {b.openChecks.map((u) => (
              <li key={u}>{u}</li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}

function OptimumList({ label, items, empty }: { label: string; items: string[]; empty?: string }) {
  return (
    <div className="brief-group">
      <p className="brief-group-label">{label}</p>
      {items.length > 0 ? (
        <ul className="text-list">
          {items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      ) : (
        <p className="stage-empty-line">{empty ?? site.regions.nothing}</p>
      )}
    </div>
  );
}

function TopicRow({ t, max, regionNames }: { t: SeriesTopic; max: number; regionNames: Map<string, string> }) {
  const copy = site.regions;
  const changes = t.decision !== "keep" && t.decision !== "no_action";
  const shown = t.regions.filter((r) => r.weight !== "none");
  const quiet = t.regions.filter((r) => r.weight === "none").map((r) => regionNames.get(r.region) ?? r.region);
  const target = t.everywhere ? copy.allRegions : t.targetRegions.length > 0 ? t.targetRegions.map((r) => regionNames.get(r) ?? r).join(", ") : copy.noRegion;
  return (
    <tr className="candidate">
      <td className="num">{String(t.n)}</td>
      <td className="candidate-title">
        <details className="candidate-details">
          <summary className="candidate-summary">
            <ChevronDown className="candidate-chevron" aria-hidden="true" size={16} strokeWidth={1.75} />
            {t.title}
          </summary>
          <div className="candidate-more">
            <p>{t.action}</p>
            {changes ? (
              <div className="table-scroll">
                <table className="candidate-table criteria-table">
                  <thead>
                    <tr>
                      <th scope="col">{copy.regionTable.region}</th>
                      <th scope="col">{copy.regionTable.customers}</th>
                      <th scope="col">{copy.regionTable.market}</th>
                      <th scope="col">{copy.regionTable.signal}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((r) => (
                      <tr key={r.region}>
                        <td>{regionNames.get(r.region) ?? r.region}</td>
                        <td>{r.customers}</td>
                        <td>{r.market ?? ""}</td>
                        <td>{r.weightLabel}</td>
                      </tr>
                    ))}
                    {quiet.length > 0 ? (
                      <tr>
                        <td>{quiet.join(", ")}</td>
                        <td>{copy.quiet}</td>
                        <td />
                        <td>{copy.quiet}</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>
                <span className="cpm-muted">{copy.where}.</span> {shown.map((r) => `${regionNames.get(r.region) ?? r.region} ${r.weightLabel}`).join(", ")}.
              </p>
            )}
            {changes && t.ourOffer ? (
              <p>
                <span className="cpm-muted">{copy.ourOffer}.</span> {t.ourOffer}
              </p>
            ) : null}
            {changes ? (
              <p>
                <span className="cpm-muted">{copy.rivals}.</span> {t.rivals ?? `${copy.noRivals}.`}
              </p>
            ) : null}
            <p>
              <span className="cpm-muted">{site.brief.why}.</span> {t.why}
            </p>
            <EffortLine effort={t.effort} />
            <Checks checks={t.effort.checks} />
            <ReferenceList evidence={t.evidence} />
          </div>
        </details>
      </td>
      <td>{target}</td>
      <td className="effort-cell">
        <EffortCell effort={t.effort} max={max} />
      </td>
      <td>{t.confidenceLabel}</td>
    </tr>
  );
}
