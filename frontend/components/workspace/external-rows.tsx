import type { ExternalRow } from "@/lib/content/brief-types";
import { site } from "@/lib/site";

/*
 * External statements (GET /external, D-102) as a hairline list: the
 * statement, its source with a link, who published it and when, how many
 * independent sources agree, and whether its figures were found on the
 * source page; both sides of a contradiction, never averaged (rule 35).
 * Shared by the subsystem dialog (a client component) and the market
 * evidence page, so it holds no state and no server import.
 */
export function ExternalRows({ rows, vehicle }: { rows: ExternalRow[]; vehicle: string }) {
  const copy = site.cpm.dialog;
  return (
    <ul className="cpm-market-list">
      {rows.map((row) => (
        <li key={row.id} className="cpm-market-row">
          <p className="cpm-market-statement">
            <span className="cpm-kind">{row.kindLabel}</span>
            {row.statement}
          </p>
          {row.source.url ? (
            <a className="tap cpm-market-link" href={row.source.url} target="_blank" rel="noreferrer">
              {row.source.title}
            </a>
          ) : (
            <p className="cpm-market-source">{row.source.title}</p>
          )}
          <p className="cpm-market-source">
            {[row.source.origin, row.source.date, row.levelLabel, row.verificationLabel].filter(Boolean).join(" · ")}
            {row.aboutVehicle ? ` · ${site.market.about} ${vehicle}` : ""}
          </p>
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
  );
}
