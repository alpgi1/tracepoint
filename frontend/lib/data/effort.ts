import raw from "@/content/effort.json";
import type { CpmCatalogue } from "@/lib/content/cpm-types";
import type { Backtest, EstimateResponse } from "@/lib/content/workspace-types";

/*
 * The effort model and the back-test (content/effort.json, written by
 * scripts/snapshot.mjs from GET /effort/model and GET /effort/backtest),
 * and the package estimate, which POST /effort/estimate computes at request
 * time in the live mode and stores nowhere. Server side only; the browser
 * never calls the API.
 */
export interface EffortModelVehicle {
  platform: string | null;
  absent: string[];
  note: string | null;
}

/** The rest of the model the engine computes with (GET /effort/model, step 19). */
export interface EffortModelParameters {
  carryoverFactor: number;
  propagationReferenceImpact: number;
  platformRule: { subsystems: string[]; minOwnImpact: number };
  certification: { triggerSubsystems: string[]; minOwnImpact: number };
  k0MaxOwnImpact: number;
  maxPathLength: number;
  sizes: Record<string, number>;
}

export interface EffortContent {
  snapshot: { takenAt: string; api: string; codeVersion: string | null; endpoints: Record<string, string> };
  model: CpmCatalogue & { vehicles: Record<string, EffortModelVehicle>; modelHash: string; parameters: EffortModelParameters };
  backtest: Backtest;
}

// The JSON's string fields are wider than the literal unions of the contract; the test checks them.
const content = raw as unknown as EffortContent;

export function effortContent(): EffortContent {
  return content;
}

const API = (process.env.TRACEPOINT_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");

export type EstimateResult = { ok: true; response: EstimateResponse; api: string } | { ok: false; api: string; reason: string };

/** The engine's estimate of a set of requirements, combined per subsystem (rule 45). */
export async function estimatePackage(vehicle: string, market: string, requirementIds: string[]): Promise<EstimateResult> {
  try {
    const response = await fetch(`${API}/effort/estimate`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ vehicle, market, requirement_ids: requirementIds }),
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) return { ok: false, api: API, reason: `HTTP ${String(response.status)}` };
    return { ok: true, response: (await response.json()) as EstimateResponse, api: API };
  } catch (error) {
    return { ok: false, api: API, reason: error instanceof Error ? error.message : String(error) };
  }
}
