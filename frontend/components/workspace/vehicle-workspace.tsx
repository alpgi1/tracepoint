"use client";

import Link from "next/link";
import { useState } from "react";
import { VehicleDrawing } from "@/components/vehicles/vehicle-drawing";
import { full, percent, scaleTop, score } from "@/lib/content/format";
import type { DomainFigures, DomainKey, MarketContent, VehicleContent } from "@/lib/content/types";
import { drawingFor } from "@/lib/vehicles/drawings";
import { ZONES, type Zone } from "@/lib/vehicles/zones";
import { site } from "@/lib/site";

/*
 * Screen 2: one vehicle in one market. The car is the domain selector: each
 * zone of the body is a requirement domain, washed in blue by that domain's
 * complaint share; hovering or clicking a zone selects the domain, as does
 * the list beside it, which carries the figures. The selected domain shows
 * its complaint themes. Decisions are not built yet.
 */
export interface VehicleWorkspaceProps {
  market: MarketContent;
  vehicle: VehicleContent;
}

const THEMES_SHOWN = 6;

export function VehicleWorkspace({ market, vehicle }: VehicleWorkspaceProps) {
  const domains = [...vehicle.domains].filter((d) => d.key !== "general").sort((a, b) => b.complaintShare - a.complaintShare);
  const hasVerbatims = domains.length > 0;
  const [active, setActive] = useState<DomainKey | null>(vehicle.weakestDomain?.key ?? domains[0]?.key ?? null);
  const [hovered, setHovered] = useState<DomainKey | null>(null);
  const shown = hovered ?? active;
  const heat = hasVerbatims ? Object.fromEntries(domains.map((d) => [d.key, d.complaintShare])) : undefined;
  const side = drawingFor(vehicle.drawing, "side");
  const top = drawingFor(vehicle.drawing, "top");
  const note = site.panel.drawingNotes[vehicle.code];
  const themes = shown ? vehicle.complaintThemes.filter((t) => t.domain === shown).sort((a, b) => b.complaints - a.complaints).slice(0, THEMES_SHOWN) : [];
  const { workspace } = site;

  return (
    <div className="workspace">
      <header className="workspace-head">
        <Link href="/" className="tap workspace-back">
          {workspace.back}
        </Link>
        <div>
          <h1 className="workspace-title">
            {vehicle.name} <span className="workspace-code">{vehicle.code}</span>
          </h1>
          <p className="workspace-meta">
            {market.name} · {full(vehicle.sales.units)} {site.readout.units} {String(vehicle.sales.year)} ·{" "}
            {vehicle.verbatims > 0 ? `${full(vehicle.verbatims)} ${site.readout.verbatims}` : site.readout.noVerbatims}
            {note ? ` · ${note}` : ""}
          </p>
        </div>
      </header>
      <div className="workspace-body">
        <section className="workspace-stage" aria-label={workspace.stageLabel}>
          <div className="workspace-view">
            <VehicleDrawing drawing={side} zones={ZONES.side} heat={heat} active={shown} />
            {hasVerbatims ? <ZoneHits zones={ZONES.side} drawing={side} onHover={setHovered} onPick={setActive} /> : null}
          </div>
          <div className="workspace-view workspace-view-top">
            <VehicleDrawing drawing={top} zones={ZONES.top} heat={heat} active={shown} />
            {hasVerbatims ? <ZoneHits zones={ZONES.top} drawing={top} onHover={setHovered} onPick={setActive} /> : null}
          </div>
          {hasVerbatims ? <p className="workspace-zone-note">{workspace.zoneNote}</p> : null}
        </section>
        <aside className="workspace-domains">
          {hasVerbatims ? (
            <>
              <h2 className="workspace-h2">{workspace.domainsHeading}</h2>
              <p className="workspace-hint">{workspace.domainsHint}</p>
              <ol className="domain-list">
                {domains.map((domain) => (
                  <li key={domain.key}>
                    <DomainRow
                      domain={domain}
                      active={active === domain.key}
                      hovered={hovered === domain.key}
                      onHover={setHovered}
                      onPick={setActive}
                    />
                  </li>
                ))}
              </ol>
              {shown ? (
                <section className="themes" aria-live="polite">
                  <h3 className="workspace-h3">
                    {workspace.themesHeading} · {domains.find((d) => d.key === shown)?.name}
                  </h3>
                  {themes.length > 0 ? (
                    <ol className="theme-list">
                      {themes.map((theme) => (
                        <li key={theme.theme} className="theme">
                          <span className="theme-name">{theme.theme}</span>
                          <span className="theme-figures">
                            {full(theme.complaints)} {workspace.complaints} {site.readout.of} {full(theme.rows)} {workspace.rows} ·{" "}
                            {full(theme.defects)} {workspace.defects} · {full(theme.difficultToUse)} {workspace.difficultToUse} ·{" "}
                            {full(theme.wants)} {workspace.wants}
                          </span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="workspace-hint">{workspace.noThemes}</p>
                  )}
                </section>
              ) : null}
            </>
          ) : (
            <>
              <h2 className="workspace-h2">{workspace.noVerbatimsHeading}</h2>
              <p className="workspace-hint">{workspace.noVerbatimsBody}</p>
              {vehicle.study ? (
                <section>
                  <h3 className="workspace-h3">
                    {workspace.studyHeading} · {vehicle.study.sheet}
                  </h3>
                  <ol className="theme-list">
                    {vehicle.study.weakest.map((item) => (
                      <li key={item.attribute} className="theme">
                        <span className="theme-name">{item.attribute}</span>
                        <span className="theme-figures">
                          {score(item.score)} {site.readout.of} {scaleTop(vehicle.study?.scale ?? "")}
                        </span>
                      </li>
                    ))}
                  </ol>
                  {vehicle.study.overall !== null ? (
                    <p className="workspace-hint">
                      {workspace.overall} {score(vehicle.study.overall)}
                    </p>
                  ) : null}
                </section>
              ) : null}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

interface DomainRowProps {
  domain: DomainFigures;
  active: boolean;
  hovered: boolean;
  onHover: (key: DomainKey | null) => void;
  onPick: (key: DomainKey) => void;
}

function DomainRow({ domain, active, hovered, onHover, onPick }: DomainRowProps) {
  return (
    <button
      type="button"
      className="domain-row"
      aria-pressed={active}
      data-hovered={hovered ? "true" : undefined}
      onClick={() => onPick(domain.key)}
      onMouseEnter={() => onHover(domain.key)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(domain.key)}
      onBlur={() => onHover(null)}
    >
      <span className="domain-row-name">{domain.name}</span>
      <span className="domain-row-figures">
        {percent(domain.complaintShare)} {site.readout.of} {full(domain.rows)} {site.workspace.rows}
      </span>
      <span className="domain-row-bar" aria-hidden="true">
        <span style={{ width: percent(domain.complaintShare) }} />
      </span>
    </button>
  );
}

interface ZoneHitsProps {
  zones: Zone[];
  drawing: { width: number; height: number; bbox: [number, number, number, number] };
  onHover: (key: DomainKey | null) => void;
  onPick: (key: DomainKey) => void;
}

/** Mouse shortcuts on the body; the domain list is the keyboard route to the same actions. */
function ZoneHits({ zones, drawing, onHover, onPick }: ZoneHitsProps) {
  const [x0, y0, x1, y1] = drawing.bbox;
  const bw = x1 - x0;
  const bh = y1 - y0;
  const pct = (v: number) => `${String(Math.round(v * 1000) / 10)}%`;
  return (
    <div className="zone-hits" aria-hidden="true">
      {zones.flatMap((zone) =>
        zone.rects.map((rect, index) => (
          <div
            key={`${zone.domain}-${String(index)}`}
            className="zone-hit"
            style={{
              left: pct((x0 + rect[0] * bw) / drawing.width),
              top: pct((y0 + rect[1] * bh) / drawing.height),
              width: pct(((rect[2] - rect[0]) * bw) / drawing.width),
              height: pct(((rect[3] - rect[1]) * bh) / drawing.height),
            }}
            onMouseEnter={() => onHover(zone.domain)}
            onMouseLeave={() => onHover(null)}
            onClick={() => onPick(zone.domain)}
          />
        )),
      )}
    </div>
  );
}
