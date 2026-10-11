"use client";

import { useEffect, useRef, useState } from "react";
import { full } from "@/lib/content/format";
import type { CpmBlock, CpmCatalogue, CpmCriticisedTheme, CpmLikedTheme, CpmMarketRow, CpmSubsystem, CpmSubsystemView, CpmView } from "@/lib/content/cpm-types";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { site } from "@/lib/site";

/*
 * The subsystem dialog: covers most of the viewport over the vehicle screen
 * and shows, for one CPM subsystem in one market, three bands after the
 * team's sketch (step 13, revision 2): Liked and Disliked, each a
 * one-sentence suggestion and a short summary beside the likes or complaints
 * per theme as columns rising from or hanging under one baseline; then the
 * market analysis with the sourced statements for the market. Built on the
 * native dialog element (showModal): the top layer, Escape, focus containment
 * and the return of focus come from the browser, nothing is installed.
 * Method after the scrolling dialogs with a sticky header seen in the
 * 21st.dev survey (frontend/docs/01-research-notes.md 6.2), written here with
 * the tokens; the columns follow the chart rules (one series in the one
 * blue, thin marks, values on the caps, text in ink).
 */
export interface CpmDialogProps {
  subsystem: CpmSubsystem | null;
  entry: CpmSubsystemView | null;
  catalogue: CpmCatalogue;
  view: CpmView;
  market: MarketContent;
  vehicle: VehicleContent;
  onClose: () => void;
}

const TITLE_ID = "cpm-dialog-title";

export function CpmDialog({ subsystem, entry, catalogue, view, market, vehicle, onClose }: CpmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = subsystem !== null && entry !== null;
  // The last shown subsystem stays rendered while the dialog fades out (state kept from the previous render).
  const [shown, setShown] = useState<{ subsystem: CpmSubsystem; entry: CpmSubsystemView } | null>(null);
  if (subsystem && entry && (shown?.subsystem !== subsystem || shown.entry !== entry)) setShown({ subsystem, entry });

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
      {shown ? <DialogContent {...shown} catalogue={catalogue} view={view} market={market} vehicle={vehicle} onClose={onClose} /> : null}
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
  onClose: () => void;
}

function DialogContent({ subsystem, entry, view, market, vehicle, onClose }: DialogContentProps) {
  const copy = site.cpm.dialog;
  const hasVerbatims = view.verbatims > 0;
  const rowsLine =
    hasVerbatims && entry.rows > 0
      ? `${full(entry.rows)} ${site.cpm.rows}: ${full(entry.complaints)} ${site.cpm.complaints}, ${full(entry.likes)} ${site.cpm.likes}`
      : hasVerbatims
        ? site.cpm.noThemes
        : site.cpm.noVerbatims;
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
            {copy.weight} {String(subsystem.weight)} {site.cpm.weightOf} <span className="cpm-muted">{copy.weightNote}</span> · {rowsLine}
          </p>
        </div>
        <button type="button" className="tap cpm-dialog-close" onClick={onClose}>
          {copy.close}
        </button>
      </header>
      <div className="cpm-dialog-body">
        <Band
          id="cpm-liked"
          heading={copy.likedHeading}
          block={entry.liked}
          hasVerbatims={hasVerbatims}
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
          hasVerbatims={hasVerbatims}
          empty={copy.noComplaints}
          chart={
            entry.criticised.themes.length > 0 ? (
              <ThemeBars caption={copy.complaintsPerTheme} direction="down" items={entry.criticised.themes.map((t) => ({ label: t.theme, value: t.complaints }))} />
            ) : null
          }
        />
        <MarketBand rows={entry.market} market={market} />
      </div>
    </div>
  );
}

interface BandProps {
  id: string;
  heading: string;
  block: CpmBlock<CpmLikedTheme> | CpmBlock<CpmCriticisedTheme>;
  hasVerbatims: boolean;
  empty: string;
  chart: React.ReactNode;
}

function Band({ id, heading, block, hasVerbatims, empty, chart }: BandProps) {
  const copy = site.cpm.dialog;
  return (
    <section className="cpm-band" aria-labelledby={id}>
      <div className="cpm-band-text">
        <h3 id={id} className="cpm-band-h">
          {heading}
        </h3>
        {!hasVerbatims ? (
          <p className="cpm-empty">{copy.noVerbatims}</p>
        ) : block.narration ? (
          <>
            <p className="cpm-band-lead">{block.narration.suggestion}</p>
            <p className="cpm-band-summary">{block.narration.summary}</p>
          </>
        ) : (
          <p className="cpm-empty">{empty}</p>
        )}
      </div>
      {chart}
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

function MarketBand({ rows, market }: { rows: CpmMarketRow[]; market: MarketContent }) {
  const copy = site.cpm.dialog;
  const marketRows = rows.filter((r) => r.kind === "market").length;
  const competitorRows = rows.length - marketRows;
  return (
    <section className="cpm-band cpm-band-market" aria-labelledby="cpm-market">
      <div className="cpm-band-text">
        <h3 id="cpm-market" className="cpm-band-h">
          {copy.marketHeading} {market.name}
        </h3>
        {rows.length === 0 ? (
          <p className="cpm-empty">
            {copy.noMarketBefore} {market.name} {copy.noMarketAfter}
          </p>
        ) : (
          <>
            <p className="cpm-band-lead">
              {full(rows.length)} {copy.marketCountBefore} {rows.length === 1 ? copy.statementOne : copy.statementMany} {copy.marketCountMiddle} {market.name}{" "}
              {copy.marketCountAfter}: {full(marketRows)} {copy.kinds.market}, {full(competitorRows)} {copy.kinds.competitor}.
            </p>
            <p className="cpm-band-summary">{copy.levelNote}</p>
          </>
        )}
      </div>
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
    </section>
  );
}
