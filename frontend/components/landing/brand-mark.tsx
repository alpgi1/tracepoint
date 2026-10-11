"use client";

import { useState } from "react";
import type { CpmIntro } from "@/lib/content/cpm-intro";
import { site } from "@/lib/site";
import { BmwRoundel } from "./bmw-roundel";
import { CpmIntroDialog } from "./cpm-intro-dialog";

/*
 * The brand mark at the foot of the map (step 20, D-107): the BMW roundel
 * on the left, a hairline, the product's name, after the team's partner
 * lockup (logo, rule, name in the logo's grey). It is one button and opens
 * the CPM explainer. It hides with the callouts while the map flies and
 * while a market is open, since the market panel takes the foot of the page.
 */
export interface BrandMarkProps {
  intro: CpmIntro;
  hidden: boolean;
}

export function BrandMark({ intro, hidden }: BrandMarkProps) {
  const [open, setOpen] = useState(false);
  const [run, setRun] = useState(0);
  return (
    <>
      <button
        type="button"
        className="brand-mark"
        data-hidden={hidden ? "true" : undefined}
        aria-haspopup="dialog"
        onClick={() => {
          setRun((n) => n + 1);
          setOpen(true);
        }}
      >
        <BmwRoundel className="brand-roundel" label={site.intro.logo} />
        <span className="brand-rule" aria-hidden="true" />
        <span className="brand-name">{site.name}</span>
        <span className="sr-only">{`, ${site.intro.opens}`}</span>
      </button>
      <CpmIntroDialog intro={intro} open={open} run={run} onClose={() => setOpen(false)} />
    </>
  );
}
