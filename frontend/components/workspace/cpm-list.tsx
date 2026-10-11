"use client";

import { useState } from "react";
import { full, weight } from "@/lib/content/format";
import { subsystemsByWeight } from "@/lib/content/cpm";
import type { CpmCatalogue, CpmSubsystem, CpmSubsystemKey, CpmSubsystemView, CpmView } from "@/lib/content/cpm-types";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { site } from "@/lib/site";
import { CpmDialog } from "./cpm-dialog";

/*
 * The CPM subsystems of the vehicle, heaviest first: each row carries the
 * subsystem's weight (its share of a new vehicle's development effort, the
 * team's assumption from config/effort/model.yaml, renormalised over the
 * subsystems the model keeps on this vehicle) as a bar in the one blue, and
 * the classified verbatim rows whose themes fall in it. A row opens the
 * subsystem dialog. Weights are per vehicle, not per market, so the list
 * stays for markets without verbatims.
 */
export interface CpmListProps {
  catalogue: CpmCatalogue;
  view: CpmView;
  market: MarketContent;
  vehicle: VehicleContent;
}

export function CpmList({ catalogue, view, market, vehicle }: CpmListProps) {
  const [openKey, setOpenKey] = useState<CpmSubsystemKey | null>(null);
  const rows = subsystemsByWeight(catalogue, view);
  const open = openKey ? rows.find((r) => r.subsystem.key === openKey) ?? null : null;
  const { cpm } = site;
  const absentRows = view.absent.reduce((sum, a) => sum + a.rows, 0);
  const absentNames = view.absent.map((a) => a.name).join(", ");
  return (
    <>
      <section className="panel-card">
        <h2 className="workspace-h2">{cpm.heading}</h2>
        <p className="workspace-hint">{cpm.hint}</p>
        <ol className="cpm-list" aria-label={cpm.listLabel}>
          {rows.map(({ subsystem, entry }) => (
            <li key={subsystem.key}>
              <CpmRow subsystem={subsystem} entry={entry} verbatims={view.verbatims} onOpen={setOpenKey} />
            </li>
          ))}
        </ol>
        <p className="cpm-note">
          {view.absent.length > 0
            ? `${cpm.absentBefore} ${absentNames} ${cpm.absentAfter} ${String(rows.length)} ${cpm.absentPresent}${absentRows > 0 ? `; ${full(absentRows)} ${cpm.absentRows}` : ""}. `
            : ""}
          {view.unassignedRows > 0 ? `${full(view.unassignedRows)} ${cpm.unassignedRows}. ` : ""}
          {cpm.mappingNote}
        </p>
      </section>
      <CpmDialog
        subsystem={open?.subsystem ?? null}
        entry={open?.entry ?? null}
        catalogue={catalogue}
        view={view}
        market={market}
        vehicle={vehicle}
        onClose={() => setOpenKey(null)}
      />
    </>
  );
}

interface CpmRowProps {
  subsystem: CpmSubsystem;
  entry: CpmSubsystemView;
  verbatims: number;
  onOpen: (key: CpmSubsystemKey) => void;
}

function CpmRow({ subsystem, entry, verbatims, onOpen }: CpmRowProps) {
  const { cpm } = site;
  const figures =
    verbatims === 0
      ? cpm.noVerbatims
      : entry.themes === 0
        ? cpm.noThemes
        : `${full(entry.complaints)} ${cpm.complaints} · ${full(entry.likes)} ${cpm.likes}`;
  return (
    <button type="button" className="cpm-row" aria-haspopup="dialog" onClick={() => onOpen(subsystem.key)}>
      <span className="cpm-row-name">{subsystem.name}</span>
      <span className="cpm-row-weight">
        <b>{weight(entry.weight)}</b> {cpm.weightOf}
      </span>
      <span className="cpm-row-bar" aria-hidden="true">
        <span style={{ width: `${String(entry.weight)}%` }} />
      </span>
      <span className="cpm-row-figures">{figures}</span>
    </button>
  );
}
