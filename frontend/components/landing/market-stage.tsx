"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { WireframeDottedGlobe } from "@/components/ui/wireframe-dotted-globe";
import { REGIONS, type RegionId, regionById } from "@/lib/globe/regions";
import { useReducedMotion } from "@/lib/motion/reduced-motion";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/*
 * Owns the hover and selection state shared by the market buttons (keyboard
 * path, left column) and the globe (pointer path, right column). State
 * changes only on enter, leave and click, never per frame.
 */
export function MarketStage({ copy }: { copy: React.ReactNode }) {
  const [hovered, setHovered] = useState<RegionId | null>(null);
  const [selected, setSelected] = useState<RegionId | null>(null);
  const reducedMotion = useReducedMotion();
  const readoutId = useId();

  const toggle = useCallback((id: RegionId | null) => {
    setSelected((current) => (current === id ? null : id));
  }, []);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelected(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const active = selected ?? hovered;
  const activeSpec = active ? regionById(active) : null;

  return (
    <div className="relative mx-auto grid max-w-(--container-site) grid-cols-1 items-center gap-x-12 gap-y-10 px-gutter pb-12 pt-10 md:pt-14 lg:min-h-[calc(100dvh-4rem)] lg:grid-cols-12 lg:pb-16">
      <div className="lg:col-span-5">
        {copy}
        <div className="intro mt-9" style={{ "--intro-delay": "260ms" } as React.CSSProperties}>
          <p className="eyebrow text-chalk-3" id={`${readoutId}-label`}>
            {site.hero.marketsLabel}
          </p>
          <ul className="mt-3 flex flex-wrap gap-2" aria-labelledby={`${readoutId}-label`}>
            {REGIONS.map((region) => {
              const isSelected = selected === region.id;
              const isHovered = hovered === region.id && !isSelected;
              return (
                <li key={region.id}>
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => toggle(region.id)}
                    onMouseEnter={() => setHovered(region.id)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(region.id)}
                    onBlur={() => setHovered(null)}
                    className={cn(
                      "tap inline-flex items-center gap-3 rounded-md border px-4 py-2.5 text-left transition-colors duration-200",
                      isSelected
                        ? "border-signal bg-signal text-signal-ink"
                        : isHovered
                          ? "border-line-strong bg-night-3 text-chalk"
                          : "border-line bg-transparent text-chalk-2 hover:border-line-strong hover:text-chalk",
                    )}
                  >
                    <span className={cn("eyebrow", isSelected ? "text-signal-ink" : "text-signal")}>{region.id}</span>
                    <span className="text-[0.95rem] font-medium">{region.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="lg:col-span-7">
        <div
          className="intro relative mx-auto w-full max-w-[min(100%,78vh)]"
          style={{ "--intro-delay": "120ms" } as React.CSSProperties}
        >
          <WireframeDottedGlobe
            regions={REGIONS}
            hovered={hovered}
            selected={selected}
            onHover={setHovered}
            onSelect={toggle}
            reducedMotion={reducedMotion}
            label={site.hero.globeLabel}
          />
          {selected ? (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="tap eyebrow absolute left-0 top-0 inline-flex items-center gap-2 rounded-md border border-line bg-night/80 px-3 text-chalk backdrop-blur-sm transition-colors hover:border-line-strong"
            >
              <span aria-hidden>←</span> {site.hero.back}
            </button>
          ) : null}
        </div>
        <div
          className="intro mx-auto mt-4 flex w-full max-w-[min(100%,78vh)] items-baseline justify-between gap-4 border-t border-line pt-3"
          style={{ "--intro-delay": "360ms" } as React.CSSProperties}
        >
          <p className="eyebrow min-h-[1.3em] text-chalk-2" aria-live="polite" id={readoutId}>
            {activeSpec ? (
              <>
                <span className="text-signal">{activeSpec.id}</span> · {activeSpec.name}
                {selected ? ` · ${site.hero.selectedReadout}` : ""}
              </>
            ) : (
              site.hero.restingReadout
            )}
          </p>
          <p className="eyebrow shrink-0 text-chalk-3">{site.hero.source}</p>
        </div>
      </div>
    </div>
  );
}
