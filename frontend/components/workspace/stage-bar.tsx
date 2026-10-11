import Link from "next/link";
import { full } from "@/lib/content/format";
import type { MarketCode } from "@/lib/content/types";
import { site } from "@/lib/site";
import { STAGES, type StageFigures, type StageKey, stageHref } from "@/lib/workspace/stages";

/*
 * The stage bar: the five stages of the BMW process slide as one row under
 * the workspace header, each with the figure it holds in this scope. The
 * current stage carries aria-current and the one blue rule; a stage whose
 * page is not built is plain text. Method after the horizontal steppers
 * with inline titles of the 21st.dev survey (Origin UI stepper, Cnippet
 * checkout breadcrumb, frontend/docs/01-research-notes.md 6.3): a number,
 * a name and a hairline between the steps, written here with the tokens;
 * the filled circles, check marks and the green of the originals were not
 * taken, since the current stage is marked by text weight and the rule.
 */
export interface StageBarProps {
  market: MarketCode;
  vehicle: string;
  current: StageKey;
  figures: StageFigures;
}

export function StageBar({ market, vehicle, current, figures }: StageBarProps) {
  const copy = site.stages;
  return (
    <nav className="stage-bar" aria-label={copy.label}>
      <ol className="stage-list">
        {STAGES.map((stage, index) => {
          const href = stageHref(market, vehicle, stage);
          const figure = stageFigure(stage, figures);
          const body = (
            <>
              <span className="stage-no" aria-hidden="true">
                {String(index + 1)}
              </span>
              <span className="stage-text">
                <span className="stage-name">{copy.names[stage]}</span>
                {figure ? <span className="stage-figure">{figure}</span> : null}
              </span>
            </>
          );
          return (
            <li key={stage} className="stage" data-current={stage === current ? "true" : undefined}>
              {href ? (
                <Link href={href} className="stage-link" aria-current={stage === current ? "page" : undefined}>
                  {body}
                </Link>
              ) : (
                <span className="stage-link stage-static">{body}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function stageFigure(stage: StageKey, f: StageFigures): string | null {
  const copy = site.stages;
  const { counts } = f;
  switch (stage) {
    case "situation":
      return `${full(f.subsystems)} ${copy.subsystems} · ${f.verbatims > 0 ? `${full(f.verbatims)} ${site.readout.verbatims}` : site.readout.noVerbatims}`;
    case "structure":
      return counts ? `${full(counts.candidates)} ${copy.candidates} · ${full(counts.excluded)} ${copy.leftOut}` : copy.noRequirements;
    case "requirements":
      return counts ? `${full(counts.criteria)} ${copy.criteria} · ${full(counts.criteriaOnEvidence)} ${copy.onEvidence}` : null;
    case "priorities":
      return f.h1Package ? `${copy.package} ${f.h1Package.effortPct.toFixed(1)} %, ${f.h1Package.decision}` : null;
    case "documentation":
      return counts ? `${full(counts.decided)} ${copy.decided} ${full(counts.candidates)} · ${full(counts.events)} ${copy.events}` : null;
  }
}
