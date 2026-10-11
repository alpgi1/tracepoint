"use client";

import { useState } from "react";
import { full, weight } from "@/lib/content/format";
import { subsystemsByWeight } from "@/lib/content/cpm";
import type { CpmCatalogue, CpmSubsystem, CpmSubsystemKey, CpmSubsystemView, CpmView } from "@/lib/content/cpm-types";
import type { MarketContent, VehicleContent } from "@/lib/content/types";
import { site } from "@/lib/site";
import type { SubsystemEvidence } from "@/lib/workspace/market";
import type { SubsystemBridge } from "@/lib/workspace/requirements";
import { CpmDialog } from "./cpm-dialog";

/*
 * The CPM subsystems of the vehicle, heaviest first: each row carries the
 * subsystem's weight (its share of a new vehicle's development effort, the
 * team's assumption from config/effort/model.yaml, renormalised over the
 * subsystems the model keeps on this vehicle) as a bar in the one blue, and
 * the classified verbatim rows whose themes fall in it. A row opens the
 * subsystem dialog. Weights are per vehicle, not per market, so the list
 * stays for markets without verbatims, where the row counts the market
 * statements of the external sources instead (step 19). Since step 15 a
 * third line names the requirements whose change starts in or reaches the
 * subsystem (bridge 1 of plan 08), from the scope's effort estimates, where
 * the scope carries a requirement set.
 */
export interface CpmListProps {
  catalogue: CpmCatalogue;
  view: CpmView;
  market: MarketContent;
  vehicle: VehicleContent;
  /** Per subsystem, the requirements that change it; undefined where the scope has no requirement set. */
  bridges: Partial<Record<CpmSubsystemKey, SubsystemBridge>> | undefined;
  /** Per subsystem, the external statements that bear on it. */
  evidence: Partial<Record<CpmSubsystemKey, SubsystemEvidence>>;
  /** The market evidence page of the scope, null where there is none. */
  marketHref: string | null;
}

export function CpmList({ catalogue, view, market, vehicle, bridges, evidence, marketHref }: CpmListProps) {
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
              <CpmRow
                subsystem={subsystem}
                entry={entry}
                verbatims={view.verbatims}
                statements={evidence[subsystem.key]?.count ?? 0}
                bridge={bridges ? (bridges[subsystem.key] ?? null) : undefined}
                onOpen={setOpenKey}
              />
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
        bridge={open && bridges ? (bridges[open.subsystem.key] ?? null) : undefined}
        evidence={open ? (evidence[open.subsystem.key] ?? null) : null}
        marketHref={marketHref}
        onClose={() => setOpenKey(null)}
      />
    </>
  );
}

interface CpmRowProps {
  subsystem: CpmSubsystem;
  entry: CpmSubsystemView;
  verbatims: number;
  /** External statements that bear on the subsystem. */
  statements: number;
  /** null: a requirement set exists but nothing changes this subsystem; undefined: no requirement set. */
  bridge: SubsystemBridge | null | undefined;
  onOpen: (key: CpmSubsystemKey) => void;
}

/** "2 requirements start here · reached by 5 · up to 4.6 %", or that none does. */
function bridgeLine(bridge: SubsystemBridge | null): string {
  const copy = site.cpm.bridge;
  if (!bridge || (bridge.starts.length === 0 && bridge.reaches.length === 0)) return copy.none;
  const parts: string[] = [];
  if (bridge.starts.length > 0) parts.push(`${full(bridge.starts.length)} ${bridge.starts.length === 1 ? copy.startOne : copy.startMany}`);
  if (bridge.reaches.length > 0) parts.push(`${bridge.reaches.length === 1 ? copy.reachedOne : copy.reachedMany} ${full(bridge.reaches.length)}`);
  const max = Math.max(...[...bridge.starts, ...bridge.reaches].map((r) => r.effortPct));
  parts.push(`${copy.upTo} ${max.toFixed(1)} %`);
  return parts.join(" · ");
}

function CpmRow({ subsystem, entry, verbatims, statements, bridge, onOpen }: CpmRowProps) {
  const { cpm } = site;
  const market = statements > 0 ? `${full(statements)} ${statements === 1 ? cpm.marketOne : cpm.marketMany}` : null;
  const figures =
    verbatims === 0
      ? (market ?? cpm.noEvidence)
      : entry.themes === 0
        ? cpm.noThemes
        : `${full(entry.complaints)} ${entry.complaints === 1 ? cpm.complaint : cpm.complaints} · ${full(entry.likes)} ${entry.likes === 1 ? cpm.like : cpm.likes}`;
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
      {bridge !== undefined ? <span className="cpm-row-requirements">{bridgeLine(bridge)}</span> : null}
    </button>
  );
}
