import { decideRequirement } from "@/app/actions/decide";
import { dateTime } from "@/lib/content/format";
import type { Requirement } from "@/lib/content/workspace-types";
import type { WorkspaceRead } from "@/lib/data/workspace";
import { site } from "@/lib/site";

/*
 * Gate G2 on the requirement page (D-085). In the live mode: a form with
 * the mandatory rationale and the three decisions as submit controls,
 * handled by the server action that forwards to the API and returns here.
 * Otherwise the three controls are disabled with the sentence that says
 * why. A notice from the URL reports the outcome of the last submission.
 */
export interface DecisionFormProps {
  requirement: Requirement;
  read: WorkspaceRead;
  pathname: string;
  /** The `decision` and `reason` query values after a submission. */
  notice: { decision?: string; reason?: string };
}

export function DecisionForm({ requirement: r, read, pathname, notice }: DecisionFormProps) {
  const copy = site.requirements.decision;
  const message = noticeText(notice);
  return (
    <div id="decision" className="decision">
      <p className="decision-status">
        {copy.current}: <b>{r.status}</b>, {site.requirements.facts.version} {String(r.version)}.
      </p>
      {message ? (
        <p className="decision-notice" role="status">
          {message}
        </p>
      ) : null}
      {read.live ? (
        <form action={decideRequirement} className="decision-form">
          <input type="hidden" name="id" value={r.id} />
          <input type="hidden" name="back" value={pathname} />
          <label className="decision-note">
            {copy.rationale}
            <textarea name="note" required minLength={3} rows={3} placeholder={copy.rationaleHint} />
          </label>
          <div className="button-row">
            <button type="submit" name="decision" value="approve" className="filter-apply">
              {copy.approve}
            </button>
            <button type="submit" name="decision" value="reject" className="filter-apply">
              {copy.reject}
            </button>
            <button type="submit" name="decision" value="defer" className="filter-apply">
              {copy.defer}
            </button>
          </div>
          <p className="workspace-hint">{copy.liveNote}</p>
        </form>
      ) : (
        <>
          <div className="button-row" role="group" aria-label={copy.heading}>
            <button type="button" className="filter-apply" disabled>
              {copy.approve}
            </button>
            <button type="button" className="filter-apply" disabled>
              {copy.reject}
            </button>
            <button type="button" className="filter-apply" disabled>
              {copy.defer}
            </button>
          </div>
          <p className="workspace-hint">
            {copy.note} {dateTime(read.snapshot.snapshot.takenAt)}.
          </p>
        </>
      )}
    </div>
  );
}

function noticeText(notice: { decision?: string; reason?: string }): string | null {
  const copy = site.requirements.decision;
  switch (notice.decision) {
    case "approve":
    case "reject":
    case "defer":
      return `${copy.recorded} ${copy.outcomes[notice.decision]}.`;
    case "failed":
      return `${copy.failed} ${notice.reason === "unreachable" ? copy.unreachable : notice.reason && notice.reason !== "error" ? `${notice.reason}.` : copy.error}`;
    case "invalid":
      return copy.invalid;
    case "note":
      return copy.noteMissing;
    case "offline":
      return copy.offline;
    default:
      return null;
  }
}
