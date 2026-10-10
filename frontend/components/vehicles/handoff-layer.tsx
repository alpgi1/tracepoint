"use client";

import { useEffect, useRef } from "react";
import { clearHandoff, setHandoffPhase, useHandoff } from "@/lib/vehicles/handoff";
import type { Box } from "@/lib/vehicles/layout";

/*
 * The layer that carries a car's photo from the map to the vehicle screen.
 * It lives in the root layout, so it survives the route change: a paper
 * veil dissolves the map, the photo moves from the card to its place on the
 * vehicle screen while the veil clears and that screen appears underneath,
 * then the photo fades out and the screen reveals the sketch behind it.
 * Timings are the one transition between the two screens (forbidden list,
 * exemption E4).
 */
const VEIL_MS = 220;
/** How long to wait for the vehicle screen before moving to the computed fallback. */
const ARRIVAL_MS = 450;
const MOVE_MS = 720;
const FADE_MS = 900;
/** The sketch starts to show this far into the photo's fade. */
const REVEAL_AT_MS = 420;
const REVEAL_MS = 700;
const EASE = "cubic-bezier(0.65, 0, 0.35, 1)";

function transformTo(from: Box, to: Box): string {
  return `translate(${String(to.left - from.left)}px, ${String(to.top - from.top)}px) scale(${String(to.width / from.width)})`;
}

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
    const { id, from } = job;
    let cancelled = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms));
    };

    const finish = () => clearHandoff(id);

    const fade = () => {
      setHandoffPhase(id, "fading");
      const animation = photo.animate([{ opacity: 1 }, { opacity: 0 }], { duration: FADE_MS, easing: "cubic-bezier(0.25, 1, 0.5, 1)", fill: "forwards" });
      later(() => setHandoffPhase(id, "reveal"), REVEAL_AT_MS);
      animation.finished.then(() => later(finish, Math.max(0, REVEAL_AT_MS + REVEAL_MS - FADE_MS) + 40)).catch(finish);
    };

    const move = () => {
      const to = targetRef.current ?? job.fallbackTo;
      setHandoffPhase(id, "moving");
      const animation = photo.animate([{ transform: "translate(0, 0) scale(1)" }, { transform: transformTo(from, to) }], { duration: MOVE_MS, easing: EASE, fill: "forwards" });
      animation.finished.then(() => {
        if (!cancelled) fade();
      }).catch(finish);
    };

    // Move once the vehicle screen has reported its target, or after the arrival window.
    const waitStart = performance.now();
    const poll = () => {
      if (cancelled) return;
      if (targetRef.current || performance.now() - waitStart > ARRIVAL_MS) {
        move();
        return;
      }
      requestAnimationFrame(poll);
    };
    later(poll, VEIL_MS);

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
