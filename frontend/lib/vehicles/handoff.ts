import { useSyncExternalStore } from "react";
import type { DrawingCode } from "./drawings";
import type { Box } from "./layout";

/**
 * Hand-over from the map to the vehicle screen. The card starts a job; a
 * layer in the root layout carries the car's photo across the route change.
 * The photo leaves the card at once, towards the place the sketch has on
 * the vehicle screen as the layout computes it, while a paper veil covers
 * the map; the layer asks for the navigation once the veil is in, so the
 * map is never seen to change. The vehicle screen reports the exact target
 * once it has laid out (the photo then lands on the pixel), the veil clears,
 * and the photo fades out while that screen reveals the sketch (step 20).
 */
export interface HandoffJob {
  id: number;
  code: DrawingCode;
  src: string;
  from: Box;
  /** The target as computed from the layout before the vehicle screen exists. */
  to: Box;
  /** Called by the layer when the veil covers the map. */
  navigate: () => void;
}

export type HandoffPhase = "veil" | "screen" | "fading" | "reveal";

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
