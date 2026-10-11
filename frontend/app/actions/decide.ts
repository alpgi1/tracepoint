"use server";

import { redirect } from "next/navigation";
import { API_URL, liveEnabled } from "@/lib/data/workspace";

/*
 * Gate G2 from the requirement page (D-085): the form posts here, the
 * action forwards the decision to the backend API and sends the browser
 * back to the page, which reads the new status and the audit event live.
 * The browser never calls the API. The backend sets the actor from its
 * own configuration (TRACEPOINT_HUMAN_ACTOR_ID, D-014), records the event
 * and appends the line to config/decisions/requirements.jsonl (D-061).
 */
const ID = /^REQ-[A-Z0-9]{3}-[A-Z]{2,3}-[A-Z]{2}-\d{2}$/;
const DECISIONS = new Set(["approve", "reject", "defer"]);
const TIMEOUT_MS = 10_000;

export async function decideRequirement(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  const backRaw = String(formData.get("back") ?? "");
  // Only a workspace page of ours is a valid return address.
  const back = /^\/markets\/[a-z]{2}\/[a-z0-9]{3}\/requirements\/[a-z0-9-]+$/.test(backRaw) ? backRaw : "/";
  const outcome = (status: string, reason?: string) => `${back}?decision=${status}${reason ? `&reason=${encodeURIComponent(reason.slice(0, 200))}` : ""}#decision`;
  if (!liveEnabled()) redirect(outcome("offline"));
  if (!ID.test(id) || !DECISIONS.has(decision)) redirect(outcome("invalid"));
  if (note.length < 3) redirect(outcome("note"));
  let failure: string | null = null;
  try {
    const response = await fetch(`${API_URL}/requirements/${id}/decision`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ decision, note }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      let detail = `HTTP ${String(response.status)}`;
      try {
        const body = (await response.json()) as { detail?: unknown };
        if (typeof body.detail === "string") detail = body.detail;
      } catch {
        // the status alone is the reason
      }
      failure = detail;
    }
  } catch (error) {
    failure = error instanceof Error ? error.message : String(error);
  }
  redirect(failure ? outcome("failed", failure) : outcome(decision));
}
