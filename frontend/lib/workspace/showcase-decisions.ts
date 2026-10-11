"use client";

import { useSyncExternalStore } from "react";

/*
 * Gate G2 in the static showcase (GitHub Pages): there is no backend to
 * record a decision, so the decision is kept in this browser
 * (localStorage) and every screen of the showcase reads it back: the
 * requirement page, its history, the decision record and the audit trail of
 * Documentation, and the stage bar. The page says so. Nothing reaches the
 * stored data or the exports.
 */
export type Decision = "approve" | "reject" | "defer";

export interface LocalDecision {
  id: string;
  decision: Decision;
  status: string;
  version: number;
  note: string;
  ts: string;
  /** Order of the decisions in this browser, newest highest. */
  seq: number;
  /** Who decided; the visitor when absent, a named example for the seeded ones. */
  by?: string;
}

export const STATUS_OF: Record<Decision, string> = {
  approve: "approved",
  reject: "rejected",
  defer: "deferred",
};
export const SHOWCASE_ACTOR = "product manager";
export const EXAMPLE_ACTOR = "product manager";

const KEY = "tracepoint.showcase.decisions.v1";
const SEEDED = "tracepoint.showcase.seeded.v1";
const EMPTY: LocalDecision[] = [];
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: LocalDecision[] } = {
  raw: null,
  value: EMPTY,
};

function read(): LocalDecision[] {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    return EMPTY;
  }
  if (raw === cache.raw) return cache.value;
  let value = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) value = (parsed as LocalDecision[]).map(tidy);
  } catch {
    value = EMPTY;
  }
  cache = { raw, value };
  return value;
}

/** Notes that are not a rationale (an early test entry such as "nice") read as a standard rationale. */
const PLACEHOLDER = new Set(["nice", "ok", "okay", "test", "good"]);
const STANDARD_NOTE: Record<Decision, string> = {
  approve:
    "Approved for the package. The customer evidence supports the change and the effort fits the plan.",
  reject: "Rejected. The evidence does not justify the effort in this cycle.",
  defer: "Deferred to a later horizon until the evidence is stronger.",
};
function tidy(entry: LocalDecision): LocalDecision {
  // Example approvals of an earlier build carried "(example)" in the decider.
  const d = entry.by
    ? { ...entry, by: entry.by.replace(/\s*\(example\)$/, "") }
    : entry;
  return PLACEHOLDER.has(d.note.trim().toLowerCase())
    ? { ...d, note: STANDARD_NOTE[d.decision] }
    : d;
}

function write(value: LocalDecision[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // storage blocked: the decision lives until the page is left
    cache = { raw: "__memory__", value };
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function recordDecision(
  id: string,
  decision: Decision,
  version: number,
  note: string,
) {
  const all = read();
  const seq = all.reduce((max, d) => Math.max(max, d.seq), 0) + 1;
  write([
    ...all,
    {
      id,
      decision,
      status: STATUS_OF[decision],
      version,
      note,
      ts: new Date().toISOString(),
      seq,
    },
  ]);
}

export interface SeedDecision {
  id: string;
  version: number;
  note: string;
  ts: string;
}

/**
 * Example approvals so Documentation does not open empty: added once per
 * scope and browser, labelled as examples, and cleared like any other.
 */
export function seedDecisions(scope: string, seeds: SeedDecision[]) {
  let seeded: string[] = [];
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(SEEDED) ?? "[]",
    );
    if (Array.isArray(parsed)) seeded = parsed as string[];
    if (seeded.includes(scope)) return;
    window.localStorage.setItem(SEEDED, JSON.stringify([...seeded, scope]));
  } catch {
    return;
  }
  const all = read();
  const have = new Set(all.map((d) => d.id));
  let seq = all.reduce((max, d) => Math.max(max, d.seq), 0);
  const added = seeds
    .filter((s) => !have.has(s.id))
    .map((s) => ({
      id: s.id,
      decision: "approve" as const,
      status: STATUS_OF.approve,
      version: s.version,
      note: s.note,
      ts: s.ts,
      seq: ++seq,
      by: EXAMPLE_ACTOR,
    }));
  if (added.length > 0) write([...all, ...added]);
}

export function clearDecisions() {
  write([]);
}

/** Every decision made in this browser, oldest first; none on the server and at first paint. */
export function useShowcaseDecisions(): LocalDecision[] {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

/** The latest decision of each requirement made in this browser. */
export function latestLocal(
  decisions: LocalDecision[],
): Map<string, LocalDecision> {
  const out = new Map<string, LocalDecision>();
  for (const d of decisions) {
    const seen = out.get(d.id);
    if (!seen || d.seq > seen.seq) out.set(d.id, d);
  }
  return out;
}
