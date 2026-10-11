"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { full, weight } from "@/lib/content/format";
import type { CpmBlock, CpmCatalogue, CpmCriticisedTheme, CpmLikedTheme, CpmMarketRow, CpmSubsystem, CpmSubsystemView, CpmView } from "@/lib/content/cpm-types";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { site } from "@/lib/site";
import type { SubsystemEvidence } from "@/lib/workspace/market";
import { requirementHref, type SubsystemBridge } from "@/lib/workspace/requirements";
import { vehicleHref } from "@/lib/content/markets";
import { ExternalRows } from "./external-rows";
import { requirementArea } from "@/lib/workspace/requirement-name";

/*
 * The subsystem dialog: covers most of the viewport over the vehicle screen
 * and shows, for one CPM subsystem in one market, three bands after the
 * team's sketch (step 13, revision 2): Liked and Disliked, each a
 * one-sentence suggestion and a short summary beside the likes or complaints
 * per theme as columns rising from or hanging under one baseline; then the
 * market analysis with the sourced statements for the market; since step
 * 15 a fourth band with the requirements that change the subsystem
 * (bridge 2 of plan 08) and, under the disliked suggestion, the
 * requirements on the criticised themes (bridge 3). Built on the
 * native dialog element (showModal): the top layer, Escape, focus containment
 * and the return of focus come from the browser, nothing is installed.
 * Method after the scrolling dialogs with a sticky header seen in the
 * 21st.dev survey (frontend/docs/01-research-notes.md 6.2), written here with
 * the tokens; the columns follow the chart rules (one series in the one
 * blue, thin marks, values on the caps, text in ink). Since step 19 the
 * market band also carries the external sources that bear on the
 * subsystem, the first few with a link to all of them; a market without
 * customer verbatims shows no Liked and Disliked bands, and a scope without
 * a requirement set no requirements band.
 */
export interface CpmDialogProps {
  subsystem: CpmSubsystem | null;
  entry: CpmSubsystemView | null;
  catalogue: CpmCatalogue;
  view: CpmView;
  market: MarketContent;
  vehicle: VehicleContent;
  /** null: a requirement set exists but nothing changes this subsystem; undefined: no requirement set. */
  bridge: SubsystemBridge | null | undefined;
  /** The external statements on the subsystem, null where none bears on it. */
  evidence: SubsystemEvidence | null;
  /** The market evidence page of the scope. */
  marketHref: string | null;
  onClose: () => void;
}

const TITLE_ID = "cpm-dialog-title";

export function CpmDialog({ subsystem, entry, catalogue, view, market, vehicle, bridge, evidence, marketHref, onClose }: CpmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = subsystem !== null && entry !== null;
  // The last shown subsystem stays rendered while the dialog fades out (state kept from the previous render).
  const [shown, setShown] = useState<{ subsystem: CpmSubsystem; entry: CpmSubsystemView; bridge: SubsystemBridge | null | undefined; evidence: SubsystemEvidence | null } | null>(null);
  if (subsystem && entry && (shown?.subsystem !== subsystem || shown.entry !== entry)) setShown({ subsystem, entry, bridge, evidence });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="cpm-dialog"
      aria-labelledby={TITLE_ID}
      onClose={() => {
        if (open) onClose();
      }}
      onClick={(event) => {
        // The dialog element itself is hit only through its backdrop.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {shown ? <DialogContent {...shown} catalogue={catalogue} view={view} market={market} vehicle={vehicle} marketHref={marketHref} onClose={onClose} /> : null}
    </dialog>
  );
}

interface DialogContentProps {
  subsystem: CpmSubsystem;
  entry: CpmSubsystemView;
  catalogue: CpmCatalogue;
  view: CpmView;
  market: MarketContent;
  vehicle: VehicleContent;
  bridge: SubsystemBridge | null | undefined;
  evidence: SubsystemEvidence | null;
  marketHref: string | null;
  onClose: () => void;
}

function DialogContent({ subsystem, entry, view, market, vehicle, bridge, evidence, marketHref, onClose }: DialogContentProps) {
  const copy = site.cpm.dialog;
  const hasVerbatims = view.verbatims > 0;
  const rowsLine = !hasVerbatims
    ? null
    : entry.rows > 0
      ? `${full(entry.rows)} ${site.cpm.rows}: ${full(entry.complaints)} ${entry.complaints === 1 ? site.cpm.complaint : site.cpm.complaints}, ${full(entry.likes)} ${entry.likes === 1 ? site.cpm.like : site.cpm.likes}`
      : site.cpm.noThemes;
  return (
    <div className="cpm-dialog-frame">
      <header className="cpm-dialog-head">
        <div>
          <h2 id={TITLE_ID} className="cpm-dialog-title">
            {subsystem.name}
          </h2>
          <p className="cpm-dialog-meta">
            {vehicle.name} {vehicle.code} · {market.name} ·{" "}
            {hasVerbatims ? `${full(view.verbatims)} ${site.readout.verbatims}` : site.readout.noVerbatims}
          </p>
          <p className="cpm-dialog-meta">
            {copy.weight} {weight(entry.weight)} {site.cpm.weightOf} <span className="cpm-muted">{copy.weightNote}</span>
            {rowsLine ? ` · ${rowsLine}` : ""}
          </p>
        </div>
        <button type="button" className="tap cpm-dialog-close" onClick={onClose}>
          {copy.close}
        </button>
      </header>
      <div className="cpm-dialog-body">
        {hasVerbatims ? (
          <>
        <Band
          id="cpm-liked"
          heading={copy.likedHeading}
          block={entry.liked}
          empty={copy.noLikes}
          chart={
            entry.liked.themes.length > 0 ? (
              <ThemeBars caption={copy.likesPerTheme} direction="up" items={entry.liked.themes.map((t) => ({ label: t.theme, value: t.likes }))} />
            ) : null
          }
        />
        <Band
          id="cpm-criticised"
          heading={copy.criticisedHeading}
          block={entry.criticised}
          empty={copy.noComplaints}
          chart={
            entry.criticised.themes.length > 0 ? (
              <ThemeBars caption={copy.complaintsPerTheme} direction="down" items={entry.criticised.themes.map((t) => ({ label: t.theme, value: t.complaints }))} />
            ) : null
          }
          below={entry.criticised.themes.length > 0 && bridge !== undefined ? <CitingLine bridge={bridge} market={market} vehicle={vehicle} /> : null}
        />
          </>
        ) : null}
        <MarketBand rows={entry.market} subsystem={subsystem} evidence={evidence} market={market} vehicle={vehicle} marketHref={marketHref} />
        {bridge !== undefined ? <RequirementsBand subsystem={subsystem} bridge={bridge} market={market} vehicle={vehicle} /> : null}
      </div>
    </div>
  );
}

interface BandProps {
  id: string;
  heading: string;
  block: CpmBlock<CpmLikedTheme> | CpmBlock<CpmCriticisedTheme>;
  empty: string;
  chart: React.ReactNode;
  /** Under the summary: the requirements on the criticised themes (bridge 3). */
  below?: React.ReactNode;
}

function Band({ id, heading, block, empty, chart, below }: BandProps) {
  return (
    <section className="cpm-band" aria-labelledby={id}>
      <div className="cpm-band-text">
        <h3 id={id} className="cpm-band-h">
          {heading}
        </h3>
        {block.narration ? (
          <>
            <p className="cpm-band-lead">{block.narration.suggestion}</p>
            <p className="cpm-band-summary">{block.narration.summary}</p>
            {below}
          </>
        ) : (
          <p className="cpm-empty">{empty}</p>
        )}
      </div>
      {chart}
    </section>
  );
}

/** Bridge 3: the requirements citing the subsystem's criticised themes, theme by theme. */
function CitingLine({ bridge, market, vehicle }: { bridge: SubsystemBridge | null; market: MarketContent; vehicle: VehicleContent }) {
  const copy = site.cpm.dialog;
  const citing = bridge?.citing ?? [];
  if (citing.length === 0) return <p className="cpm-citing cpm-muted">{copy.citingNone}</p>;
  return (
    <div className="cpm-citing">
      <span className="cpm-muted">{copy.citingHeading}.</span>{" "}
      {citing.map((c, i) => (
        <span key={c.theme}>
          {i > 0 ? " " : ""}
          {c.theme}:{" "}
          {c.requirements.map((r, j) => (
            <span key={r.id}>
              {j > 0 ? ", " : ""}
              <Link href={requirementHref(market.code, vehicle.code, r.id)} className="cpm-citing-link">
                {r.title}
              </Link>
            </span>
          ))}
          .
        </span>
      ))}
    </div>
  );
}

/** Bridge 2: the fourth band, the requirements whose change starts in or reaches the subsystem. */
function RequirementsBand({ subsystem, bridge, market, vehicle }: { subsystem: CpmSubsystem; bridge: SubsystemBridge | null; market: MarketContent; vehicle: VehicleContent }) {
  const copy = site.cpm.dialog;
  const starts = bridge?.starts ?? [];
  const reaches = bridge?.reaches ?? [];
  const lines = [...starts.map((r) => ({ ...r, where: copy.startsHere })), ...reaches.map((r) => ({ ...r, where: copy.reaches }))];
  return (
    <section className="cpm-band cpm-band-requirements" aria-labelledby="cpm-requirements">
      <div className="cpm-band-text">
        <h3 id="cpm-requirements" className="cpm-band-h">
          {copy.requirementsHeading} {subsystem.name}
        </h3>
        {lines.length === 0 ? (
          <p className="cpm-empty">
            {copy.noRequirementsBefore} {subsystem.name} {copy.noRequirementsAfter}
          </p>
        ) : (
          <>
            <p className="cpm-band-lead">
              {full(starts.length)} {copy.startsHere}, {full(reaches.length)} {copy.reaches}.
            </p>
            <p className="cpm-band-summary">{copy.requirementsLead}</p>
            <p className="cpm-band-summary">
              <Link href={`${vehicleHref(market.code, vehicle.code)}/structure?view=all&subsystem=${subsystem.key}`} className="tap cpm-market-link">
                {copy.toStructure}
              </Link>
            </p>
          </>
        )}
      </div>
      {lines.length > 0 ? (
        <ol className="cpm-requirement-list">
          {lines.map((r) => (
            <li key={`${r.where}-${r.id}`} className="cpm-requirement">
              <Link href={requirementHref(market.code, vehicle.code, r.id)} className="cpm-requirement-link">
                <span className="req-area">{requirementArea(r.id)}</span>
                <span>{r.title}</span>
              </Link>
              <span className="cpm-requirement-figure">
                {r.horizon} · {r.kind === "change" ? `${r.effortPct.toFixed(1)} %, ${r.decision}` : r.decision} · {r.where}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

interface ThemeBarsProps {
  caption: string;
  direction: "up" | "down";
  items: { label: string; value: number }[];
}

/*
 * One series of columns on one baseline: likes rise from it, complaints hang
 * under it. Columns are 20 px, rounded at the data end and square at the
 * baseline; every cap carries its value (six columns, no axis needed); labels
 * and values are ink, the columns are the one blue.
 */
const SLOTS = 6;

function ThemeBars({ caption, direction, items }: ThemeBarsProps) {
  const max = Math.max(1, ...items.map((item) => item.value));
  // Six slots always, so the baseline and the column pitch are the same in every chart.
  const empty = Array.from({ length: Math.max(0, SLOTS - items.length) }, (_, i) => i);
  return (
    <figure className="cpm-bars" data-direction={direction}>
      <figcaption className="cpm-bars-caption">{caption}</figcaption>
      <ol className="cpm-bars-list">
        {items.map((item) => (
          <li key={item.label} className="cpm-bar">
            <span className="cpm-bar-value">{full(item.value)}</span>
            <span className="cpm-bar-track" aria-hidden="true">
              <span style={{ height: `${String((item.value / max) * 100)}%` }} />
            </span>
            <span className="cpm-bar-label">{item.label}</span>
          </li>
        ))}
        {empty.map((i) => (
          <li key={`empty-${String(i)}`} className="cpm-bar" aria-hidden="true">
            <span className="cpm-bar-value" />
            <span className="cpm-bar-track" />
            <span className="cpm-bar-label" />
          </li>
        ))}
      </ol>
    </figure>
  );
}

interface MarketBandProps {
  rows: CpmMarketRow[];
  subsystem: CpmSubsystem;
  evidence: SubsystemEvidence | null;
  market: MarketContent;
  vehicle: VehicleContent;
  marketHref: string | null;
}

function MarketBand({ rows, subsystem, evidence, market, vehicle, marketHref }: MarketBandProps) {
  const copy = site.cpm.dialog;
  const external = evidence?.count ?? 0;
  const total = rows.length + external;
  return (
    <section className="cpm-band cpm-band-market" aria-labelledby="cpm-market">
      <div className="cpm-band-text">
        <h3 id="cpm-market" className="cpm-band-h">
          {copy.marketHeading} {market.name}
        </h3>
        {total === 0 ? (
          <p className="cpm-empty">
            {copy.noMarketBefore} {subsystem.name} {copy.noMarketAfter}
          </p>
        ) : (
          <>
            <p className="cpm-band-lead">
              {full(total)} {copy.marketCountBefore} {total === 1 ? copy.statementOne : copy.statementMany} {copy.marketCountMiddle} {market.name} {copy.marketCountAfter}
              {rows.length > 0 ? `: ${full(rows.length)} ${copy.teamRows}` : ""}
              {external > 0 ? `${rows.length > 0 ? "," : ":"} ${full(external)} ${copy.externalRows}, ${full(evidence?.verified ?? 0)} ${copy.verifiedRows}` : ""}.
            </p>
            <p className="cpm-band-summary">{copy.levelNote}</p>
            {marketHref && external > 0 ? (
              <p className="cpm-band-summary">
                <a href={`${marketHref}#${subsystem.key}`} className="tap cpm-market-link">
                  {copy.externalMore} {market.name}
                </a>
              </p>
            ) : null}
          </>
        )}
      </div>
      {total > 0 ? (
        <div className="cpm-market-lists">
          {rows.length > 0 ? (
            <ul className="cpm-market-list">
              {rows.map((row) => (
                <li key={row.source.url} className="cpm-market-row">
                  <p className="cpm-market-statement">
                    <span className="cpm-kind">{copy.kinds[row.kind]}</span>
                    {row.statement}
                  </p>
                  <a className="tap cpm-market-link" href={row.source.url} target="_blank" rel="noreferrer">
                    {row.source.title}
                  </a>
                  <p className="cpm-market-source">
                    {row.source.date} · {copy.sourceTypes[row.source.type]} · {copy.levels[row.level]} · {copy.bases[row.basis]}
                  </p>
                  {row.note ? <p className="cpm-market-note">{row.note}</p> : null}
                  {row.contradiction ? (
                    <>
                      <p className="cpm-market-note">
                        <span className="cpm-muted">{copy.contradictionFor}</span> {row.contradiction.for}
                      </p>
                      <p className="cpm-market-note">
                        <span className="cpm-muted">{copy.contradictionAgainst}</span> {row.contradiction.against}
                      </p>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
          {evidence && evidence.rows.length > 0 ? <ExternalRows rows={evidence.rows} vehicle={vehicle.code} /> : null}
        </div>
      ) : null}
    </section>
  );
}
