"use client";

import { useEffect, useRef } from "react";
import { clearHandoff, setHandoffPhase, useHandoff } from "@/lib/vehicles/handoff";
import { type Box, flightTransform, landingCorrection } from "@/lib/vehicles/layout";

/*
 * The layer that carries a car's photo from the map to the vehicle screen.
 * It lives in the root layout, so it survives the route change. The photo
 * leaves the card the moment it is clicked, towards the place the sketch has
 * on the vehicle screen as the layout computes it, while a paper veil
 * dissolves the map; once the veil is in, the layer navigates, so the map
 * is never seen to change. When the vehicle screen has laid out and reported
 * its exact target, the veil clears to show it and a small correction, added
 * to the flight, lands the photo on the pixel. Then the photo fades out and
 * the screen reveals the sketch behind it. Nothing waits for the server
 * before the photo moves (step 20); the flight is a transform on the
 * compositor, so it keeps its pace while the new screen renders. Timings
 * are the one transition between the two screens (forbidden list,
 * exemption E4).
 */
const VEIL_MS = 220;
const MOVE_MS = 720;
/** The shortest correction, when the exact target arrives after the photo has landed. */
const MIN_CORRECTION_MS = 180;
/** How long the photo waits on its target for a vehicle screen that is slow to arrive. */
const MAX_WAIT_MS = 4000;
const FADE_MS = 900;
/** The sketch starts to show this far into the photo's fade. */
const REVEAL_AT_MS = 420;
const REVEAL_MS = 700;
/** --ease-emphasized: the photo is under way at once and settles slowly. */
const EASE = "cubic-bezier(0.2, 0, 0, 1)";
/** --ease-out. */
const EASE_OUT = "cubic-bezier(0.25, 1, 0.5, 1)";

export function HandoffLayer() {
  const { job, target, phase } = useHandoff();
  const photoRef = useRef<HTMLImageElement>(null);
  const startedRef = useRef<number | null>(null);
  const targetRef = useRef<Box | null>(null);

  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  useEffect(() => {
    const photo = photoRef.current;
    if (!job || !photo || startedRef.current === job.id) return;
    startedRef.current = job.id;
    const { id, from, to } = job;
    const started = performance.now();
    let cancelled = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(
        window.setTimeout(() => {
          if (!cancelled) fn();
        }, ms),
      );
    };
    const finish = () => clearHandoff(id);

    // The flight starts with the click.
    const flight = photo.animate([{ transform: "translate(0, 0) scale(1)" }, { transform: flightTransform(from, to) }], { duration: MOVE_MS, easing: EASE, fill: "forwards" });
    let landed = false;
    let arrived = false;
    let fading = false;
    let correction: Promise<unknown> = Promise.resolve();

    const fade = () => {
      setHandoffPhase(id, "fading");
      const animation = photo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: EASE_OUT, fill: "forwards" });
      later(() => setHandoffPhase(id, "reveal"), REVEAL_AT_MS);
      animation.finished.then(() => later(finish, Math.max(0, REVEAL_AT_MS + REVEAL_MS - FADE_MS) + 40)).catch(finish);
    };

    // The photo fades once it has landed on a screen that is there.
    const maybeFade = () => {
      if (cancelled || fading || !landed || !arrived) return;
      fading = true;
      correction.then(fade, finish);
    };

    const arrive = (exact: Box | null) => {
      arrived = true;
      setHandoffPhase(id, "screen");
      const add = exact ? landingCorrection(from, to, exact) : null;
      if (add) {
        const remaining = Math.max(MIN_CORRECTION_MS, MOVE_MS - (performance.now() - started));
        correction = photo.animate([{ transform: "translate(0px, 0px) scale(1)" }, { transform: add }], { duration: remaining, easing: EASE_OUT, fill: "forwards", composite: "add" }).finished;
      }
      maybeFade();
    };

    // The vehicle screen reports its target in a layout effect; look for it every frame once the veil is in.
    const poll = () => {
      if (cancelled) return;
      if (targetRef.current) {
        arrive(targetRef.current);
        return;
      }
      if (performance.now() - started > MAX_WAIT_MS) {
        arrive(null);
        return;
      }
      requestAnimationFrame(poll);
    };
    later(() => {
      job.navigate();
      poll();
    }, VEIL_MS);

    flight.finished.then(() => {
      landed = true;
      maybeFade();
    }, finish);

    return () => {
      cancelled = true;
      for (const t of timers) window.clearTimeout(t);
    };
  }, [job]);

  if (!job) return null;
  const { from } = job;
  return (
    <div className="handoff" aria-hidden="true">
      <span className="handoff-veil" data-off={phase === "veil" ? undefined : "true"} />
      {/* A plain img: the layer is transient and the file is our own static asset. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={photoRef}
        className="handoff-photo"
        src={job.src}
        alt=""
        draggable={false}
        style={{ left: `${String(from.left)}px`, top: `${String(from.top)}px`, width: `${String(from.width)}px`, height: `${String(from.height)}px` }}
      />
    </div>
  );
}
