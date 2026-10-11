import { Suspense } from "react";
import { full } from "@/lib/content/format";
import type { MarketCode } from "@/lib/content/types";
import { site } from "@/lib/site";
import { STATIC_EXPORT } from "@/lib/static";
import {
  STAGES,
  type ScopeContent,
  type StageFigures,
  type StageKey,
  stageHref,
} from "@/lib/workspace/stages";
import { ShowcaseDecidedFigure } from "./showcase-gate";
import { StageItem } from "./stage-item";

/*
 * The stage bar: the five stages of the BMW process slide as one row under
 * the workspace header, each with the figure it holds in this scope. The
 * current stage carries aria-current and the one blue rule; a stage the
 * backend holds nothing for in this scope is plain text (step 19). Method
 * after the horizontal steppers with inline titles of the 21st.dev survey
 * (Origin UI stepper, Cnippet checkout breadcrumb, frontend/docs/01-research-notes.md
 * 6.3): a number, a name and a hairline between the steps, written here
 * with the tokens; the filled circles, check marks and the green of the
 * originals were not taken, since the current stage is marked by text
 * weight and the rule.
 *
 * Since step 20 the bar is part of the scope layout and stays on screen
 * between the stages. The links mark the current stage on the client
 * (StageItem). The figures are the stored ones at first and the live ones
 * once the workspace is read (the same in the snapshot mode), so the bar is
 * complete in the static shell and never waits.
 */
export interface StageBarProps {
  market: MarketCode;
  vehicle: string;
  scope: ScopeContent;
  /** The figures of the stored workspace, known at build time. */
  stored: StageFigures;
  /** The figures of the workspace read at request time. */
  live: Promise<StageFigures>;
}

export function StageBar({
  market,
  vehicle,
  scope,
  stored,
  live,
}: StageBarProps) {
  const copy = site.stages;
  return (
    <nav className="stage-bar" aria-label={copy.label}>
      <ol className="stage-list">
        {STAGES.map((stage, index) => {
          const href = stageHref(market, vehicle, stage, scope);
          const body = (
            <>
              <span className="stage-no" aria-hidden="true">
                {String(index + 1)}
              </span>
              <span className="stage-text">
                <span className="stage-name">{copy.names[stage]}</span>
                {STATIC_EXPORT && stage === "documentation" && stored.counts ? (
                  <ShowcaseDecidedFigure
                    decidedIds={stored.counts.decidedIds}
                    ids={stored.counts.ids}
                    candidates={stored.counts.candidates}
                    events={stored.counts.events}
                  />
                ) : (
                  <Suspense
                    fallback={<FigureText text={stageFigure(stage, stored)} />}
                  >
                    <LiveFigure stage={stage} live={live} />
                  </Suspense>
                )}
              </span>
            </>
          );
          return href ? (
            // The vehicle screen is prefetched with its sketch, so the car can grow back into it (exemption E7).
            <StageItem
              key={stage}
              stage={stage}
              href={href}
              prefetch={stage === "situation"}
            >
              {body}
            </StageItem>
          ) : (
            <li key={stage} className="stage">
              <span className="stage-link stage-static">{body}</span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function FigureText({ text }: { text: string | null }) {
  return text ? <span className="stage-figure">{text}</span> : null;
}

async function LiveFigure({
  stage,
  live,
}: {
  stage: StageKey;
  live: Promise<StageFigures>;
}) {
  return <FigureText text={stageFigure(stage, await live)} />;
}

function stageFigure(stage: StageKey, f: StageFigures): string | null {
  const copy = site.stages;
  const { counts } = f;
  switch (stage) {
    case "situation":
      return `${full(f.subsystems)} ${copy.subsystems} · ${f.verbatims > 0 ? `${full(f.verbatims)} ${site.readout.verbatims}` : site.readout.noVerbatims}`;
    case "structure":
      if (counts)
        return `${full(counts.candidates)} ${copy.candidates} · ${full(counts.excluded)} ${copy.leftOut}`;
      return f.scope.brief
        ? `${copy.brief} · ${full(f.scope.brief.proposals)} ${copy.proposals}`
        : copy.noRequirements;
    case "requirements":
      return counts
        ? `${full(counts.criteria)} ${copy.criteria} · ${full(counts.criteriaOnEvidence)} ${copy.onEvidence}`
        : null;
    case "priorities":
      return f.h1Package
        ? `${copy.package} ${f.h1Package.effortPct.toFixed(1)} %, ${f.h1Package.decision}`
        : null;
    case "documentation":
      return counts
        ? `${full(counts.decided)} ${copy.decided} ${full(counts.candidates)} · ${full(counts.events)} ${copy.events}`
        : null;
  }
}
