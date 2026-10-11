import { ChevronDown } from "lucide-react";
import Link from "next/link";
import type { BriefCheck, BriefEffort, BriefPackage, Evidence, ReferenceItem } from "@/lib/content/brief-types";
import { site } from "@/lib/site";

/*
 * The parts the analyst's brief (stage 2) and the series page share. The
 * backend serves every code with its words and every reference resolved
 * against the evidence store (D-100); these render them as text, never as
 * HTML or Markdown, so a sentence of the model cannot become a link or a
 * heading. Customer words stay in blockquote, as written (E5). Effort is a
 * share of a new vehicle generation with its range beside it, never money,
 * and borderline when the class holds in under 90 % of the runs (rules 49
 * and 51); the browser computes nothing.
 */

/** "3.1 %" and the class for a table cell, with a thin bar against the largest figure of the table. */
export function EffortCell({ effort, max }: { effort: BriefEffort; max: number }) {
  const copy = site.brief;
  if (effort.status !== "estimated" || effort.effortPct === undefined) {
    return <span className="cpm-muted">{effort.statusLabel}</span>;
  }
  return (
    <>
      <span className="effort-figure">
        <span className="num">{effort.effortPct.toFixed(1)} %</span>
        <span className="cpm-muted">
          {effort.decision}
          {effort.borderline ? `, ${copy.borderline}` : ""}
        </span>
      </span>
      <span className="effort-bar" aria-hidden="true">
        <span style={{ width: `${String(max > 0 ? (effort.effortPct / max) * 100 : 0)}%` }} />
      </span>
    </>
  );
}

/** The estimate in one sentence: figure, range, class, stability, layer, where it comes from. */
export function EffortLine({ effort }: { effort: BriefEffort }) {
  const copy = site.brief;
  if (effort.status !== "estimated" || effort.effortPct === undefined) {
    return (
      <p>
        <span className="cpm-muted">{site.requirements.effort.heading}.</span> {effort.statusLabel}.
      </p>
    );
  }
  return (
    <p>
      <span className="cpm-muted">{site.requirements.effort.heading}.</span> {effort.effortPct.toFixed(1)} % {copy.ofVehicle}, {effort.decision}, {copy.range}{" "}
      {effort.p5?.toFixed(1)} to {effort.p95?.toFixed(1)}, {copy.keptIn} {effort.stablePct?.toFixed(0)}
      {copy.ofRuns}
      {effort.borderline ? `, ${copy.borderline}` : ""}; {copy.layer} {effort.layer} ({effort.layerLabel})
      {effort.basis ? `, ${effort.basis}` : ""}.{effort.analystProfile ? ` ${capital(copy.analystProfile)}.` : ""}
      {effort.subsystems && effort.subsystems.length > 0 ? ` ${copy.footprint}: ${effort.subsystems.map((s) => `${s.name} ${s.effortPct.toFixed(1)} %`).join(", ")}.` : ""}
    </p>
  );
}

function capital(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function Checks({ checks }: { checks: BriefCheck[] }) {
  if (checks.length === 0) return null;
  return (
    <ul className="brief-checks">
      {checks.map((c, i) => (
        <li key={`${c.rule}-${String(i)}`}>
          <b>
            {capital(c.levelLabel)}, {c.ruleLabel}
          </b>
          : {c.text}
        </li>
      ))}
    </ul>
  );
}

/** "9 references: 3 findings, 2 customer verbatims" opening the list of what they are. */
export function ReferenceList({ evidence, linkOf }: { evidence: Evidence; linkOf?: (item: ReferenceItem) => string | null }) {
  const copy = site.brief;
  if (evidence.count === 0) return null;
  return (
    <details className="refs">
      <summary className="refs-summary">
        <ChevronDown className="candidate-chevron" aria-hidden="true" size={16} strokeWidth={1.75} />
        {copy.evidence}: {evidence.byKind.map((k) => `${String(k.count)} ${k.label}`).join(", ")}
      </summary>
      <ul className="refs-list">
        {evidence.items.map((item) => {
          const href = linkOf?.(item) ?? null;
          return (
            <li key={item.ref} className="refs-item">
              {item.kind === "verbatim" && item.text ? (
                <>
                  <span className="refs-meta">
                    {item.label}
                    {item.meta ? `, ${item.meta}` : ""}
                  </span>
                  <blockquote className="refs-quote">{item.text}</blockquote>
                </>
              ) : (
                <>
                  <span className="refs-label">{href ? <Link href={href} className="cpm-citing-link">{item.label}</Link> : item.label}</span>
                  {item.meta ? <span className="refs-meta">{item.meta}</span> : null}
                  {item.url ? (
                    <a href={item.url} className="cpm-citing-link refs-source" target="_blank" rel="noreferrer">
                      {site.brief.source}
                    </a>
                  ) : null}
                </>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}

/** The engine's packages: per horizon, the proposals combined per subsystem so shared work counts once. */
export function PackageLines({ packages }: { packages: BriefPackage[] }) {
  const copy = site.brief;
  if (packages.length === 0) return null;
  return (
    <ul className="brief-packages">
      {packages.map((p) => (
        <li key={p.horizon}>
          <b>{p.label}</b>: {String(p.proposals)} {p.proposals === 1 ? copy.proposalWord : copy.proposalsWord} {copy.together} <b>{p.effortPct.toFixed(1)} %</b> {copy.ofVehicle}, {p.decision},{" "}
          {copy.range} {p.p5.toFixed(1)} to {p.p95.toFixed(1)}, {copy.keptIn} {p.stablePct.toFixed(0)}
          {copy.ofRuns}
          {p.borderline ? `, ${copy.borderline}` : ""}; {copy.sharedOnce} ({copy.sumOfSingle} {p.sumOfSinglePct.toFixed(1)} %).
          {p.notCounted.length > 0 ? ` ${copy.notCounted} ${p.notCounted.join("; ")}.` : ""}
          <Checks checks={p.checks} />
        </li>
      ))}
    </ul>
  );
}
