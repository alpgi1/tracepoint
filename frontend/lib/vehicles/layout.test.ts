import { describe, expect, it } from "vitest";
import { type Box, flightTransform, landingCorrection } from "./layout";

/*
 * Step 20: the photo leaves the card at once towards the computed target;
 * when the vehicle screen reports the exact box, a correction composed
 * after the flight lands it there. Applying the transforms to the card box
 * (origin at its top left corner) must give the exact box.
 */
interface Affine {
  tx: number;
  ty: number;
  s: number;
}

function parse(transform: string): Affine {
  const m = /translate\((-?[\d.e-]+)px, (-?[\d.e-]+)px\) scale\(([\d.e-]+)\)/.exec(transform);
  if (!m) throw new Error(`not a flight transform: ${transform}`);
  return { tx: Number(m[1]), ty: Number(m[2]), s: Number(m[3]) };
}

/** translate(a) scale(b) followed by translate(c) scale(d), as CSS composes a list. */
function compose(a: Affine, b: Affine): Affine {
  return { tx: a.tx + a.s * b.tx, ty: a.ty + a.s * b.ty, s: a.s * b.s };
}

function apply(t: Affine, box: Box): Box {
  return { left: box.left + t.tx, top: box.top + t.ty, width: box.width * t.s, height: box.height * t.s };
}

const card: Box = { left: 48, top: 640, width: 420, height: 160 };
const computed: Box = { left: 69.3, top: 239.1, width: 821.3, height: 312.9 };

describe("the hand-over's flight and landing", () => {
  it("carries the card onto the computed target", () => {
    const landed = apply(parse(flightTransform(card, computed)), card);
    expect(landed.left).toBeCloseTo(computed.left, 6);
    expect(landed.top).toBeCloseTo(computed.top, 6);
    expect(landed.width).toBeCloseTo(computed.width, 6);
  });

  it("needs no correction where the screen agrees with the computation", () => {
    expect(landingCorrection(card, computed, { ...computed, left: computed.left + 0.3 })).toBeNull();
  });

  it("lands on the exact box where a scrollbar moved the stage", () => {
    const exact: Box = { left: 61.4, top: 239.7, width: 828.8, height: 315.8 };
    const add = landingCorrection(card, computed, exact);
    expect(add).not.toBeNull();
    const landed = apply(compose(parse(flightTransform(card, computed)), parse(add ?? "")), card);
    expect(landed.left).toBeCloseTo(exact.left, 6);
    expect(landed.top).toBeCloseTo(exact.top, 6);
    expect(landed.width).toBeCloseTo(exact.width, 6);
  });
});
