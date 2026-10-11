import { full, percent, weight } from "@/lib/content/format";
import type { CpmCatalogue, CpmView } from "@/lib/content/cpm-types";
import type { Requirement, RequirementEffort } from "@/lib/content/workspace-types";
import { site } from "@/lib/site";
import { footprintOf } from "@/lib/workspace/requirements";

/*
 * The CPM effort of a requirement (plan 08 section 4.2): the figure with its
 * range, class, stability, layer, size and certification add-on; the
 * change profile; the footprint over the vehicle's subsystems, where the
 * twelve-row list of the vehicle screen returns as the effort lens (the
 * weight as the track, the propagated risk as the fill, the value as
 * text, the strongest path beside it); the catalogue scan; the flags with
 * their rule numbers; the model hash. The browser computes nothing: every
 * figure is the engine's. Bars follow the chart rules of the CPM list.
 */
export interface EffortBlockProps {
  requirement: Requirement;
  effort: RequirementEffort | null;
  catalogue: CpmCatalogue;
  view: CpmView;
}

export function EffortBlock({ requirement, effort, catalogue, view }: EffortBlockProps) {
  const copy = site.requirements.effort;
  if (!effort) return <p className="stage-empty">{site.requirements.none}</p>;
  const isChange = effort.kind === "change";
  const footprint = footprintOf(effort, catalogue, view);
  const names = new Map(catalogue.subsystems.map((s) => [s.key, s.name]));
  return (
    <div className="effort">
      {isChange ? (
        <p className="effort-lead">
          <b>{effort.effort_pct.toFixed(1)} %</b> {copy.ofVehicle} · {copy.range} {effort.p5.toFixed(1)} to {effort.p95.toFixed(1)} · <b>{effort.decision}</b>, {copy.keptIn}{" "}
          {effort.decision_stable_pct.toFixed(0)} {copy.ofRuns} · {copy.size} {effort.size} · {copy.layer} {effort.layer} · {copy.certification}{" "}
          {effort.certification ? copy.yes : copy.no}
        </p>
      ) : (
        <p className="effort-lead">
          {copy.noChange}
          {effort.note ? `: ${effort.note}` : "."}
        </p>
      )}
      {effort.stale ? (
        <p className="workspace-hint">
          {copy.staleBefore} {String(effort.requirement_version)} {copy.staleAfter} {String(requirement.version)}.
        </p>
      ) : null}

      {effort.changes.length > 0 ? (
        <>
          <h4 className="stage-h4">{copy.changesHeading}</h4>
          <p className="workspace-hint">{copy.changesHint}</p>
          <ul className="changes">
            {effort.changes.map((c, i) => (
              <li key={`${c.subsystem}-${String(i)}`} className="change">
                <span className="change-head">
                  <b>{names.get(c.subsystem) ?? c.subsystem}</b> · {copy.ownImpact} {percent(c.own_impact)} · {copy.layer} {c.layer}
                  {c.carryover ? ` · ${copy.carryover}` : ""}
                </span>
                <span className="change-why">{c.why}</span>
                {c.portfolio_terms.length > 0 ? (
                  <span className="change-why cpm-muted">
                    {copy.terms}: {c.portfolio_terms.join(", ")}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {isChange ? (
        <>
          <h4 className="stage-h4">{copy.footprintHeading}</h4>
          <p className="workspace-hint">{copy.footprintHint}</p>
          <ol className="footprint">
            {footprint.map((row) => (
              <li key={row.key} className="footprint-row" data-reached={row.risk > 0 ? "true" : "false"}>
                <span className="footprint-name">{row.name}</span>
                <span className="footprint-figure">
                  {row.risk > 0 ? (
                    <>
                      <b>{row.effortPct.toFixed(1)} %</b> · {percent(row.risk)} {copy.ofWeight} {weight(row.weight)}
                    </>
                  ) : (
                    <span className="cpm-muted">{copy.notReached}</span>
                  )}
                </span>
                <span className="footprint-bar" aria-hidden="true" style={{ width: `${String(row.weight)}%` }}>
                  <span style={{ width: `${String(Math.min(100, row.risk * 100))}%` }} />
                </span>
                <span className="footprint-path cpm-muted">
                  {row.starts ? copy.startsHere : row.path && row.path.length > 1 ? `${copy.via} ${row.path.slice(0, -1).join(" → ")}` : ""}
                </span>
              </li>
            ))}
          </ol>
        </>
      ) : null}

      {effort.portfolio.length > 0 ? (
        <>
          <h4 className="stage-h4">{copy.portfolioHeading}</h4>
          <p className="workspace-hint">{copy.portfolioHint}</p>
          <ul className="changes">
            {effort.portfolio.map((scan, i) => (
              <li key={`${scan.subsystem}-${String(i)}`} className="change">
                <span className="change-head">
                  <b>{names.get(scan.subsystem) ?? scan.subsystem}</b> · {copy.level} {String(scan.level)} · {copy.terms}: {scan.terms.join(", ")}
                </span>
                <span className="change-why">
                  {Object.entries(scan.vehicles)
                    .map(([v, x]) => `${v}: ${x.item} (${x.status})`)
                    .join("; ") || "no catalogue item matches"}
                  ; {site.requirements.standardOn} {full(scan.own_variants.standard)}, {site.requirements.optionalOn} {full(scan.own_variants.optional)} {site.requirements.of}{" "}
                  {full(scan.own_variants.total)} {site.requirements.variants}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      {effort.flags.length > 0 ? (
        <>
          <h4 className="stage-h4">{copy.flagsHeading}</h4>
          <ul className="changes">
            {effort.flags.map((f, i) => (
              <li key={`${f.rule}-${String(i)}`} className="change">
                <span className="change-head">
                  <b>{copy.flagLevels[f.level] ?? f.level}</b> · {copy.rule} {f.rule}
                </span>
                <span className="change-why">{f.text}</span>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <p className="stage-source">
        {copy.model} {effort.model_hash}, {copy.modelNote}.
      </p>
    </div>
  );
}
