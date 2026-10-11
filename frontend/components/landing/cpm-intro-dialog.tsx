"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import type { CpmIntro, IntroExample, IntroNode } from "@/lib/content/cpm-intro";
import { site } from "@/lib/site";

/*
 * The CPM explainer the brand mark opens (step 20, D-112): a dialog over the
 * centre of the map, not the whole screen, that says in three numbered steps
 * what the Change Prediction Method does and shows it on one documented BMW
 * decision per effort class from the engine's back-test: the subsystem where
 * the change starts, the subsystems it reaches one, two and three links
 * away with their share of the effort, and where the figure lands on the
 * scale of the three classes. Built for the demo, where it is opened first
 * and read in about fifteen seconds.
 *
 * Method after the 21st.dev survey of step 20 (frontend/docs/01-research-notes.md
 * 6.7): the anatomy of the onboarding dialogs (the visual first, a short
 * title, a few lines of text, one way out) and the curved connectors
 * between node boxes of Magic UI's Animated Beam (Dillion Verma, MIT),
 * drawn here once per opening instead of the beam's endless gradient loop.
 * Nothing installed; the native dialog element gives the top layer,
 * Escape, the inert map and the return of focus, as in cpm-dialog.tsx.
 * Every figure is the effort snapshot's (content/effort.json).
 */
export interface CpmIntroDialogProps {
  intro: CpmIntro;
  open: boolean;
  /** Counts the openings, so the drawing plays again each time. */
  run: number;
  onClose: () => void;
}

const TITLE_ID = "cpm-intro-title";

export function CpmIntroDialog({ intro, open, run, onClose }: CpmIntroDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  // The chosen example holds for one opening; the next opening starts again at the first class.
  const [choice, setChoice] = useState({ run, index: 0 });
  const copy = site.intro;
  const example = intro.examples[Math.min(choice.run === run ? choice.index : 0, intro.examples.length - 1)];

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="cpmx"
      aria-labelledby={TITLE_ID}
      onClose={() => {
        if (open) onClose();
      }}
      onClick={(event) => {
        // The dialog element itself is hit only through its backdrop.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="cpmx-frame">
        <header className="cpmx-head">
          <div>
            <h2 id={TITLE_ID} className="cpmx-title">
              {intro.method.name}
            </h2>
            <p className="cpmx-lead">{copy.lead}</p>
          </div>
          <button type="button" className="tap cpmx-close" onClick={onClose}>
            {copy.close}
          </button>
        </header>
        <div className="cpmx-body">
          <ol className="cpmx-steps" aria-label={copy.stepsLabel}>
            <li>
              <h3 className="cpmx-step-title">
                {String(intro.subsystems)} {copy.model.title}
              </h3>
              <p>{copy.model.body}</p>
            </li>
            <li>
              <h3 className="cpmx-step-title">{copy.spread.title}</h3>
              <p>
                {copy.spread.before} {String(intro.maxPathLength)} {copy.spread.after}
              </p>
            </li>
            <li>
              <h3 className="cpmx-step-title">{copy.figure.title}</h3>
              <p>
                {copy.figure.before} {String(intro.thresholds.adaptBelowPercent)} {copy.figure.middle} {String(intro.thresholds.newGenerationFromPercent)} {copy.figure.after}
              </p>
            </li>
          </ol>
          {example ? (
            <section className="cpmx-example" aria-label={copy.exampleLabel}>
              <div className="cpmx-classes" role="group" aria-label={copy.classesLabel}>
                {intro.examples.map((e, i) => (
                  <button key={e.id} type="button" className="tap cpmx-class" aria-pressed={e.id === example.id} onClick={() => setChoice({ run, index: i })}>
                    {copy.classes[e.decision]}
                  </button>
                ))}
              </div>
              <p className="cpmx-name">
                <span className="cpmx-name-text">{example.name}</span>
                <span className="cpmx-verdict">
                  {copy.bmwDecision} {example.actual} · {copy.engineClass} {example.decision}
                </span>
              </p>
              <Spread key={`${example.id}-${String(run)}`} example={example} intro={intro} />
              <p className="cpmx-note">
                {copy.legend}
                {example.notReached.length > 0 ? ` ${copy.notReached} ${example.notReached.join(", ")}.` : ""}
              </p>
              <Scale key={`scale-${example.id}-${String(run)}`} example={example} intro={intro} />
            </section>
          ) : null}
        </div>
        <footer className="cpmx-foot">
          <p>
            {copy.backtestBefore} {String(intro.backtest.hits)} {copy.backtestMiddle} {String(intro.backtest.anchors)} {copy.backtestAfter} {intro.modelHash}. {copy.basis}
          </p>
          <p className="cpmx-source">
            {intro.method.reference}. {copy.stored} <span className="cpmx-nowrap">{intro.takenAt.slice(0, 10)}</span>.
          </p>
        </footer>
      </div>
    </dialog>
  );
}

/* The drawing's grid in SVG units: four columns of boxes, one per distance from the start. */
const COLUMN_WIDTH = 140;
const COLUMN_GAP = 36;
const NODE_HEIGHT = 34;
const ROW_GAP = 6;
const HEAD = 22;

function Spread({ example, intro }: { example: IntroExample; intro: CpmIntro }) {
  const copy = site.intro;
  const columns = intro.maxPathLength + 1;
  const width = columns * COLUMN_WIDTH + (columns - 1) * COLUMN_GAP;
  const height = HEAD + intro.rows * NODE_HEIGHT + (intro.rows - 1) * ROW_GAP;
  const counts = new Map<number, number>();
  for (const n of example.nodes) counts.set(n.depth, (counts.get(n.depth) ?? 0) + 1);
  const x = (depth: number) => depth * (COLUMN_WIDTH + COLUMN_GAP);
  const y = (n: IntroNode) => HEAD + ((intro.rows - (counts.get(n.depth) ?? 1)) * (NODE_HEIGHT + ROW_GAP)) / 2 + n.row * (NODE_HEIGHT + ROW_GAP);
  const byKey = new Map(example.nodes.map((n) => [n.key, n]));
  const maxRisk = Math.max(...example.nodes.filter((n) => n.depth > 0).map((n) => n.risk), 0.0001);
  const start = example.nodes.find((n) => n.depth === 0);
  const label = `${copy.graphBefore} ${copy.startsIn} ${start ? `${start.name}, ${effortText(start.effortPct)} %` : ""}. ${copy.graphReaches} ${example.nodes
    .filter((n) => n.depth > 0)
    .map((n) => `${n.name} ${effortText(n.effortPct)} %`)
    .join(", ")}.`;
  return (
    <div className="cpmx-spread">
      <svg viewBox={`0 0 ${String(width)} ${String(height)}`} role="img" aria-label={label}>
        {Array.from({ length: columns }, (_, depth) => (
          <text key={depth} className="cpmx-col" x={x(depth)} y={11}>
            {depth === 0 ? copy.startsIn : `${String(depth)} ${depth === 1 ? copy.linkAway : copy.linksAway}`}
          </text>
        ))}
        {example.nodes.map((n) => {
          const parent = n.parent ? byKey.get(n.parent) : undefined;
          if (!parent) return null;
          const x1 = x(parent.depth) + COLUMN_WIDTH;
          const y1 = y(parent) + NODE_HEIGHT / 2;
          const x2 = x(n.depth);
          const y2 = y(n) + NODE_HEIGHT / 2;
          const bend = COLUMN_GAP / 2;
          return (
            <path
              key={`link-${n.key}`}
              className="cpmx-link"
              pathLength={1}
              d={`M ${String(x1)} ${String(y1)} C ${String(x1 + bend)} ${String(y1)}, ${String(x2 - bend)} ${String(y2)}, ${String(x2)} ${String(y2)}`}
              style={{ "--d": n.depth, "--o": (0.25 + 0.75 * (n.risk / maxRisk)).toFixed(2) } as CSSProperties}
            />
          );
        })}
        {example.nodes.map((n) => (
          <g key={n.key} className="cpmx-node" data-start={n.depth === 0 ? "true" : undefined} style={{ "--d": n.depth } as CSSProperties}>
            <title>{`${n.name}: ${effortText(n.effortPct)} % ${copy.nodeOf}${n.depth > 0 ? `, ${copy.nodeLikelihood} ${String(Math.round(n.risk * 100))} %` : ""}`}</title>
            <rect x={x(n.depth) + 0.5} y={y(n) + 0.5} width={COLUMN_WIDTH - 1} height={NODE_HEIGHT - 1} rx={6} />
            <text className="cpmx-node-name" x={x(n.depth) + 10} y={y(n) + 14}>
              {n.name}
            </text>
            <text className="cpmx-node-value" x={x(n.depth) + 10} y={y(n) + 28}>
              {effortText(n.effortPct)} %
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function Scale({ example, intro }: { example: IntroExample; intro: CpmIntro }) {
  const copy = site.intro;
  const { adaptBelowPercent: adapt, newGenerationFromPercent: generation } = intro.thresholds;
  const at = (value: number) => `${String(Math.min(100, Math.max(0, value)))}%`;
  const steps = Math.max(...example.nodes.map((n) => n.depth)) + 1;
  const notes = [
    example.certificationAddOn ? `${copy.certificationBefore} ${String(intro.certificationAddOnPercent)} ${copy.certificationAfter}` : null,
    example.platformRule ? copy.platformRule : null,
  ].filter((n): n is string => n !== null);
  if (notes.length === 0) notes.push(copy.plainSum);
  return (
    <div className="cpmx-result" style={{ "--d": steps } as CSSProperties}>
      <p className="cpmx-figure">
        <span className="cpmx-figure-value">{example.effortPct.toFixed(1)} %</span>
        <span>{copy.ofVehicle}</span>
        <span>
          {copy.range} {example.p5.toFixed(1)} {copy.to} {example.p95.toFixed(1)}
        </span>
      </p>
      <div className="cpmx-scale" role="img" aria-label={`${copy.scaleLabel}: ${example.effortPct.toFixed(1)} %, ${example.decision}`}>
        <div className="cpmx-track">
          <span className="cpmx-band" data-band="major" style={{ left: at(adapt), width: at(generation - adapt) }} />
          <span className="cpmx-band" data-band="new" style={{ left: at(generation), width: at(100 - generation) }} />
          <span className="cpmx-range" style={{ left: at(example.p5), width: at(example.p95 - example.p5) }} />
          <span className="cpmx-dot" style={{ left: at(example.effortPct) }} />
        </div>
        <div className="cpmx-ticks" aria-hidden="true">
          {[0, adapt, generation, 100].map((t) => (
            <span key={t} style={{ left: at(t) }}>
              {String(t)} %
            </span>
          ))}
        </div>
        <div className="cpmx-band-names" aria-hidden="true">
          <span style={{ left: at(0), width: at(adapt) }}>{copy.bands.adapt}</span>
          <span style={{ left: at(adapt), width: at(generation - adapt) }}>{copy.bands.major}</span>
          <span style={{ left: at(generation), width: at(100 - generation) }}>{copy.bands.new}</span>
        </div>
      </div>
      <p className="cpmx-note cpmx-result-note">{notes.join(" ")}</p>
    </div>
  );
}

/** A subsystem's share with one decimal; the smallest shares read as under 0.1. */
function effortText(value: number): string {
  return value >= 0.05 ? value.toFixed(1) : `${site.intro.under} 0.1`;
}
