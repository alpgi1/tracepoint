"use client";

import { useState } from "react";
import { full } from "@/lib/content/format";
import { subsystemView, subsystemsByWeight } from "@/lib/content/cpm";
import type { CpmCatalogue, CpmSubsystem, CpmSubsystemKey, CpmSubsystemView, CpmView } from "@/lib/content/cpm-types";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { site } from "@/lib/site";
import { CpmDialog } from "./cpm-dialog";

/*
 * The twelve CPM subsystems of the vehicle, heaviest first: each row carries
 * the subsystem's weight (its share of a new vehicle's development effort,
 * the team's assumption) as a bar in the one blue, and the classified
 * verbatim rows whose themes fall in it. A row opens the subsystem dialog.
 * Weights are per platform, so the list stays for markets without verbatims.
 */
export interface CpmListProps {
  catalogue: CpmCatalogue;
  view: CpmView;
  market: MarketContent;
  vehicle: VehicleContent;
}

export function CpmList({ catalogue, view, market, vehicle }: CpmListProps) {
  const [openKey, setOpenKey] = useState<CpmSubsystemKey | null>(null);
  const subsystems = subsystemsByWeight(catalogue);
  const open = openKey ? subsystems.find((s) => s.key === openKey) ?? null : null;
  const openEntry = open ? subsystemView(view, open.key) ?? null : null;
  const { cpm } = site;
  return (
    <>
      <section className="panel-card">
        <h2 className="workspace-h2">{cpm.heading}</h2>
        <p className="workspace-hint">{cpm.hint}</p>
        <ol className="cpm-list" aria-label={cpm.listLabel}>
          {subsystems.map((subsystem) => (
            <li key={subsystem.key}>
              <CpmRow subsystem={subsystem} entry={subsystemView(view, subsystem.key)} verbatims={view.verbatims} onOpen={setOpenKey} />
            </li>
          ))}
        </ol>
        <p className="cpm-note">
          {view.unassignedRows > 0 ? `${full(view.unassignedRows)} ${cpm.unassignedRows}. ` : ""}
          {cpm.mappingNote}
        </p>
      </section>
      <CpmDialog
        subsystem={open}
        entry={openEntry}
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
  entry: CpmSubsystemView | undefined;
  verbatims: number;
  onOpen: (key: CpmSubsystemKey) => void;
}

function CpmRow({ subsystem, entry, verbatims, onOpen }: CpmRowProps) {
  const { cpm } = site;
  const figures =
    verbatims === 0
      ? cpm.noVerbatims
      : !entry || entry.themes === 0
        ? cpm.noThemes
        : `${full(entry.complaints)} ${cpm.complaints} · ${full(entry.likes)} ${cpm.likes}`;
  return (
    <button type="button" className="cpm-row" aria-haspopup="dialog" onClick={() => onOpen(subsystem.key)}>
      <span className="cpm-row-name">{subsystem.name}</span>
      <span className="cpm-row-weight">
        <b>{String(subsystem.weight)}</b> {cpm.weightOf}
      </span>
      <span className="cpm-row-bar" aria-hidden="true">
        <span style={{ width: `${String(subsystem.weight)}%` }} />
      </span>
      <span className="cpm-row-figures">{figures}</span>
    </button>
  );
}
