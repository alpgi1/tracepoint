"use client";

import { useEffect, useRef, useState } from "react";
import { full } from "@/lib/content/format";
import { subsystemName } from "@/lib/content/cpm";
import type { CpmCatalogue, CpmCriticisedTheme, CpmLikedTheme, CpmMarketRow, CpmQuote, CpmSubsystem, CpmSubsystemView, CpmView } from "@/lib/content/cpm-types";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { site } from "@/lib/site";

/*
 * The subsystem dialog: covers most of the viewport over the vehicle screen
 * and shows, for one CPM subsystem in one market, what customers like there,
 * what they criticise, and the market and competition evidence. Built on the
 * native dialog element (showModal): the top layer, Escape, focus containment
 * and the return of focus come from the browser, nothing is installed.
 * Method after the scrolling dialogs with a sticky header, the two-column
 * comparison and the hairline evidence table seen in the 21st.dev survey
 * (frontend/docs/01-research-notes.md 6.2), written here with the tokens.
 * Verbatims are shown as written (blockquote), with their evidence reference.
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

function DialogContent({ subsystem, entry, catalogue, view, market, vehicle, onClose }: DialogContentProps) {
  const copy = site.cpm.dialog;
  const hasVerbatims = view.verbatims > 0;
  const complaintShare = entry.rows > 0 ? (entry.complaints / entry.rows) * 100 : 0;
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
        </div>
        <button type="button" className="tap cpm-dialog-close" onClick={onClose}>
          {copy.close}
        </button>
      </header>
      <div className="cpm-dialog-body">
        <dl className="cpm-facts">
          <div>
            <dt>{copy.weight}</dt>
            <dd>
              {String(subsystem.weight)} {site.cpm.weightOf} <span className="cpm-muted">{copy.weightNote}</span>
            </dd>
          </div>
          <div>
            <dt>{copy.scope}</dt>
            <dd>{subsystem.scope}</dd>
          </div>
          <div>
            <dt>{copy.customerRows}</dt>
            <dd>
              {hasVerbatims && entry.rows > 0 ? (
                <>
                  {full(entry.rows)} {site.cpm.rows} · {full(entry.complaints)} {site.cpm.complaints} · {full(entry.likes)} {site.cpm.likes}
                  <span className="cpm-partition" aria-hidden="true">
                    <span style={{ width: `${String(complaintShare)}%` }} />
                  </span>
                </>
              ) : (
                <span className="cpm-muted">{hasVerbatims ? site.cpm.noThemes : site.cpm.noVerbatims}</span>
              )}
            </dd>
          </div>
          <div>
            <dt>{copy.propagates}</dt>
            <dd>
              {subsystem.links.length > 0 ? (
                subsystem.links.map((link, i) => (
                  <span key={link.to}>
                    {i > 0 ? " · " : ""}
                    {subsystemName(catalogue, link.to)}{" "}
                    <span className="cpm-muted">
                      ({copy.likelihood} {String(link.likelihood)}, {copy.impact} {String(link.impact)})
                    </span>
                  </span>
                ))
              ) : (
                <span className="cpm-muted">{copy.propagatesNone}</span>
              )}
              {subsystem.certificationTrigger ? <span className="cpm-muted"> {copy.certification}</span> : null}
            </dd>
          </div>
        </dl>

        <div className="cpm-blocks">
          <section className="cpm-block" aria-labelledby="cpm-liked">
            <h3 id="cpm-liked" className="cpm-block-h">
              {copy.likedHeading}
            </h3>
            {!hasVerbatims ? (
              <p className="cpm-empty">{copy.noVerbatims}</p>
            ) : entry.liked.length === 0 ? (
              <p className="cpm-empty">{copy.noLikes}</p>
            ) : (
              <ol className="cpm-themes">
                {entry.liked.map((theme) => (
                  <li key={theme.theme} className="cpm-theme">
                    <LikedTheme theme={theme} catalogue={catalogue} />
                  </li>
                ))}
              </ol>
            )}
          </section>
          <section className="cpm-block" aria-labelledby="cpm-criticised">
            <h3 id="cpm-criticised" className="cpm-block-h">
              {copy.criticisedHeading}
            </h3>
            {!hasVerbatims ? (
              <p className="cpm-empty">{copy.noVerbatims}</p>
            ) : entry.criticised.length === 0 ? (
              <p className="cpm-empty">{copy.noComplaints}</p>
            ) : (
              <ol className="cpm-themes">
                {entry.criticised.map((theme) => (
                  <li key={theme.theme} className="cpm-theme">
                    <CriticisedTheme theme={theme} catalogue={catalogue} />
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>

        <section className="cpm-block cpm-block-market" aria-labelledby="cpm-market">
          <h3 id="cpm-market" className="cpm-block-h">
            {copy.marketHeading} {market.name}
          </h3>
          {entry.market.length === 0 ? (
            <p className="cpm-empty">
              {copy.noMarketBefore} {market.name} {copy.noMarketAfter}
            </p>
          ) : (
            <>
              <table className="cpm-table">
                <thead>
                  <tr>
                    <th scope="col">{copy.columns.statement}</th>
                    <th scope="col">{copy.columns.source}</th>
                    <th scope="col">{copy.columns.level}</th>
                    <th scope="col">{copy.columns.basis}</th>
                    <th scope="col">{copy.columns.note}</th>
                  </tr>
                </thead>
                <tbody>
                  {entry.market.map((row) => (
                    <MarketRow key={row.source.url} row={row} />
                  ))}
                </tbody>
              </table>
              <p className="cpm-note">{copy.levelNote}</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function LikedTheme({ theme, catalogue }: { theme: CpmLikedTheme; catalogue: CpmCatalogue }) {
  return (
    <>
      <ThemeHead name={theme.theme} domain={catalogue.domains[theme.domain]} />
      <p className="cpm-theme-figures">
        {full(theme.likes)} {site.cpm.likes} {site.readout.of} {full(theme.rows)} {site.cpm.rows}
      </p>
      <Quotes quotes={theme.quotes} />
    </>
  );
}

function CriticisedTheme({ theme, catalogue }: { theme: CpmCriticisedTheme; catalogue: CpmCatalogue }) {
  const copy = site.cpm.dialog;
  return (
    <>
      <ThemeHead name={theme.theme} domain={catalogue.domains[theme.domain]} />
      <p className="cpm-theme-figures">
        {full(theme.complaints)} {site.cpm.complaints} {site.readout.of} {full(theme.rows)} {site.cpm.rows} · {full(theme.defects)} {copy.defects} ·{" "}
        {full(theme.difficultToUse)} {copy.difficultToUse} · {full(theme.wants)} {copy.wants}
      </p>
      <Quotes quotes={theme.quotes} />
    </>
  );
}

function ThemeHead({ name, domain }: { name: string; domain: string }) {
  return (
    <div className="cpm-theme-head">
      <span className="cpm-theme-name">{name}</span>
      <span className="cpm-theme-domain">{domain}</span>
    </div>
  );
}

function Quotes({ quotes }: { quotes: CpmQuote[] }) {
  if (quotes.length === 0) return null;
  return (
    <ul className="cpm-quotes">
      {quotes.map((quote) => (
        <li key={quote.id}>
          <blockquote className="cpm-quote" cite={quote.evidenceRef}>
            <p>{quote.text}</p>
            <footer>
              {quote.id} · {quote.source}
              {quote.powertrain ? ` · ${quote.powertrain}` : ""}
            </footer>
          </blockquote>
        </li>
      ))}
    </ul>
  );
}

function MarketRow({ row }: { row: CpmMarketRow }) {
  const copy = site.cpm.dialog;
  return (
    <tr>
      <td>
        <span className="cpm-kind">{copy.kinds[row.kind]}</span>
        {row.statement}
      </td>
      <td className="cpm-source">
        <a className="tap" href={row.source.url} target="_blank" rel="noreferrer">
          {row.source.title}
        </a>
        <span className="cpm-muted">
          {row.source.date} · {copy.sourceTypes[row.source.type]}
        </span>
      </td>
      <td>{copy.levels[row.level]}</td>
      <td>{row.basis}</td>
      <td>
        {row.note ? <p>{row.note}</p> : null}
        {row.contradiction ? (
          <>
            <p>
              <span className="cpm-muted">{copy.contradictionFor}</span> {row.contradiction.for}
            </p>
            <p>
              <span className="cpm-muted">{copy.contradictionAgainst}</span> {row.contradiction.against}
            </p>
          </>
        ) : null}
      </td>
    </tr>
  );
}
