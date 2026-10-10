import { useSyncExternalStore } from "react";
import type { DrawingCode } from "./drawings";
import type { Box } from "./layout";

/**
 * Hand-over from the map to the vehicle screen. The card starts a job and
 * navigates at once; a layer in the root layout carries the car's photo
 * across the route change, moves it from the card to the place the sketch
 * has on the vehicle screen, then fades it out while that screen reveals
 * the sketch. The vehicle screen reports the exact target once it has laid
 * out, so the photo lands on the pixel; the card's computed box is the
 * fallback if the screen is slow to arrive.
 */
export interface HandoffJob {
  id: number;
  code: DrawingCode;
  src: string;
  from: Box;
  fallbackTo: Box;
}

export type HandoffPhase = "veil" | "moving" | "fading" | "reveal";

export interface HandoffState {
  job: HandoffJob | null;
  phase: HandoffPhase;
  target: Box | null;
}

const IDLE: HandoffState = { job: null, phase: "veil", target: null };
let state: HandoffState = IDLE;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

function getServerSnapshot() {
  return IDLE;
}

export function startHandoff(job: Omit<HandoffJob, "id">): number {
  const id = nextId++;
  state = { job: { ...job, id }, phase: "veil", target: null };
  emit();
  return id;
}

/** The vehicle screen has laid out: where the photo must land. */
export function arriveHandoff(code: DrawingCode, target: Box) {
  if (!state.job || state.job.code !== code || state.target) return;
  state = { ...state, target };
  emit();
}

export function setHandoffPhase(id: number, phase: HandoffPhase) {
  if (!state.job || state.job.id !== id) return;
  state = { ...state, phase };
  emit();
}

export function clearHandoff(id: number) {
  if (!state.job || state.job.id !== id) return;
  state = IDLE;
  emit();
}

export function useHandoff(): HandoffState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** What the vehicle screen does with its sketch during a hand-over for this car. */
export function useSketchPhase(code: DrawingCode): "hidden" | "reveal" | "shown" {
  const { job, phase } = useHandoff();
  if (!job || job.code !== code) return "shown";
  return phase === "reveal" ? "reveal" : "hidden";
}
