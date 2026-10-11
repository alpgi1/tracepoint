import Link from "next/link";
import { dateTime } from "@/lib/content/format";
import type { AuditEvent } from "@/lib/content/workspace-types";
import { site } from "@/lib/site";

/*
 * Audit events as a hairline timeline: a rail, one mark per event, the
 * time, the actor, the action and the rationale; a status change names
 * both states. With `linkTo` every item leads with the requirement it
 * belongs to, for the audit trail of a whole scope (stage 5). Method after
 * the timelines of the 21st.dev survey (research notes 6.4) without their
 * images and cards.
 */
export interface TimelineProps {
  events: AuditEvent[];
  /** The route of the requirement an event belongs to, when the list spans a scope. */
  linkTo?: (id: string) => string;
}

export function Timeline({ events, linkTo }: TimelineProps) {
  const copy = site.requirements.history;
  if (events.length === 0) return <p className="stage-empty-line">{site.requirements.none}</p>;
  return (
    <ol className="timeline">
      {events.map((e) => {
        const before = e.before && typeof e.before.status === "string" ? e.before.status : null;
        const after = e.after && typeof e.after.status === "string" ? e.after.status : null;
        return (
          <li key={e.id} className="timeline-item">
            <span className="timeline-time">{dateTime(e.ts)}</span>
            <span className="timeline-body">
              <span className="timeline-head">
                {linkTo ? (
                  <>
                    <Link href={linkTo(e.entity_id)} className="cpm-citing-link">
                      {e.entity_id}
                    </Link>{" "}
                    ·{" "}
                  </>
                ) : null}
                <b>{e.action}</b> · {copy.actors[e.actor_type] ?? e.actor_type} {e.actor_id}
                {before && after && before !== after ? ` · ${copy.statusChange} ${before} ${copy.to} ${after}` : ""}
              </span>
              {e.rationale ? <span className="timeline-text">{e.rationale}</span> : null}
              {e.run_id ? <span className="timeline-text cpm-muted">{e.run_id}</span> : null}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
