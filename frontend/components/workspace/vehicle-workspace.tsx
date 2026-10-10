"use client";

import Image from "next/image";
import Link from "next/link";
import { useLayoutEffect, useRef, useState } from "react";
import { VehicleDrawing } from "@/components/vehicles/vehicle-drawing";
import { full, percent, scaleTop, score } from "@/lib/content/format";
import type { DomainFigures, DomainKey, MarketContent, VehicleContent } from "@/lib/content/types";
import { drawingFor, photoFor } from "@/lib/vehicles/drawings";
import { takeHandoff } from "@/lib/vehicles/handoff";
import { site } from "@/lib/site";

/*
 * Screen 2: one vehicle in one market. The car as a sketch (side and top
 * view) beside the domain list; the selected or hovered domain shows its
 * complaint themes. Arriving from the map, the screen starts with the car's
 * photo where the sketch will be and cross-fades to the sketch. Decisions
 * are not built yet.
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
  const side = drawingFor(vehicle.drawing, "side");
  const top = drawingFor(vehicle.drawing, "top");
  const photo = photoFor(vehicle.drawing);
  const note = site.panel.drawingNotes[vehicle.code];
  const themes = shown ? vehicle.complaintThemes.filter((t) => t.domain === shown).sort((a, b) => b.complaints - a.complaints).slice(0, THEMES_SHOWN) : [];
  const { workspace } = site;

  // The hand-over phase is written to the DOM, not to state: the server renders the
  // sketch, and the first client paint must already show the photo when arriving from the map.
  const viewRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const view = viewRef.current;
    if (!view || takeHandoff() !== vehicle.drawing) return;
    view.dataset.phase = "photo";
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        view.dataset.phase = "fade";
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
    };
  }, [vehicle.drawing]);

  const [x0, y0, x1] = side.bbox;
  const photoStyle: React.CSSProperties = {
    left: `${String((x0 / side.width) * 100)}%`,
    width: `${String(((x1 - x0) / side.width) * 100)}%`,
    top: `${String((y0 / side.height) * 100)}%`,
    aspectRatio: `${String(photo.width)} / ${String(photo.height)}`,
  };

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
          <div className="workspace-view" ref={viewRef} data-phase="sketch">
            <VehicleDrawing drawing={side} size="stage" />
            <Image className="vehicle-photo" style={photoStyle} src={photo.src} alt="" width={photo.width} height={photo.height} unoptimized draggable={false} />
          </div>
          <div className="workspace-view workspace-view-top">
            <VehicleDrawing drawing={top} size="stage" />
          </div>
        </section>
        <aside className="workspace-domains">
          {hasVerbatims ? (
            <>
              <section className="panel-card">
                <h2 className="workspace-h2">{workspace.domainsHeading}</h2>
                <p className="workspace-hint">{workspace.domainsHint}</p>
                <ol className="domain-list">
                  {domains.map((domain) => (
                    <li key={domain.key}>
                      <DomainRow domain={domain} active={active === domain.key} hovered={hovered === domain.key} onHover={setHovered} onPick={setActive} />
                    </li>
                  ))}
                </ol>
              </section>
              {shown ? (
                <section className="panel-card themes" aria-live="polite">
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
            <section className="panel-card">
              <h2 className="workspace-h2">{workspace.noVerbatimsHeading}</h2>
              <p className="workspace-hint">{workspace.noVerbatimsBody}</p>
              {vehicle.study ? (
                <>
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
                </>
              ) : null}
            </section>
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
