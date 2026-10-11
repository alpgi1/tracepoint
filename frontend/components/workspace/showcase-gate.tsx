"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { dateTime, full } from "@/lib/content/format";
import { site } from "@/lib/site";
import { requirementArea } from "@/lib/workspace/requirement-name";
import {
  type Decision,
  type LocalDecision,
  SHOWCASE_ACTOR,
  STATUS_OF,
  clearDecisions,
  latestLocal,
  recordDecision,
  useShowcaseDecisions,
} from "@/lib/workspace/showcase-decisions";

/*
 * Gate G2 of the static showcase (lib/workspace/showcase-decisions.ts): the
 * decision form works and every screen that shows a decision follows it,
 * kept in this browser only, which the form says. Rendered only in the
 * static build; the app with its backend records decisions through the
 * server action as before.
 */
const ACTION = "requirement.decided";

/** The status of a requirement after the decisions made in this browser. */
export function ShowcaseStatus({ id, status }: { id: string; status: string }) {
  const local = latestLocal(useShowcaseDecisions()).get(id);
  return <b>{local ? local.status : status}</b>;
}

export function ShowcaseDecisionForm({
  id,
  version,
}: {
  id: string;
  version: number;
}) {
  const copy = site.requirements.decision;
  const decisions = useShowcaseDecisions();
  const [message, setMessage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent)
      .submitter as HTMLButtonElement | null;
    const decision = submitter?.value as Decision | undefined;
    if (!decision || !(decision in STATUS_OF)) return;
    if (note.trim().length < 3) {
      setMessage(copy.noteMissing);
      return;
    }
    recordDecision(id, decision, version, note.trim());
    setNote("");
    setMessage(`${copy.recorded} ${copy.outcomes[decision]}.`);
  };
  return (
    <>
      {message ? (
        <p className="decision-notice" role="status">
          {message}
        </p>
      ) : null}
      <form onSubmit={submit} className="decision-form">
        <label className="decision-note">
          {copy.rationale}
          <textarea
            name="note"
            required
            minLength={3}
            rows={3}
            placeholder={copy.rationaleHint}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="button-row">
          <button
            type="submit"
            name="decision"
            value="approve"
            className="filter-apply"
          >
            {copy.approve}
          </button>
          <button
            type="submit"
            name="decision"
            value="reject"
            className="filter-apply"
          >
            {copy.reject}
          </button>
          <button
            type="submit"
            name="decision"
            value="defer"
            className="filter-apply"
          >
            {copy.defer}
          </button>
        </div>
        <p className="workspace-hint">
          {copy.showcaseNote}
          {decisions.length > 0 ? (
            <>
              {" "}
              <button
                type="button"
                className="link-button"
                onClick={() => clearDecisions()}
              >
                {copy.showcaseClear}
              </button>
            </>
          ) : null}
        </p>
      </form>
    </>
  );
}

export interface RecordRow {
  id: string;
  title: string;
  href: string;
  status: string;
  version: number;
  decision: { status: string; by: string; when: string; note: string } | null;
}

/** The decision record of Documentation with the decisions of this browser on top of the stored ones. */
export function ShowcaseRecord({ rows }: { rows: RecordRow[] }) {
  const copy = site.log;
  const local = latestLocal(useShowcaseDecisions());
  const shown = rows.map((row) => {
    const d = local.get(row.id);
    return d
      ? {
          ...row,
          status: d.status,
          decision: {
            status: d.status,
            by: SHOWCASE_ACTOR,
            when: dateTime(d.ts),
            note: d.note,
          },
        }
      : row;
  });
  const decided = shown.filter((row) => row.status !== "proposed").length;
  return (
    <>
      <p className="effort-lead">
        <b>
          {full(decided)} {copy.decidedBefore} {full(rows.length)}
        </b>{" "}
        {copy.recordLead}
      </p>
      <div className="table-scroll">
        <table className="candidate-table record-table">
          <thead>
            <tr>
              <th scope="col">{copy.columns.id}</th>
              <th scope="col">{copy.columns.title}</th>
              <th scope="col">{copy.columns.status}</th>
              <th scope="col" className="num">
                {copy.columns.version}
              </th>
              <th scope="col">{copy.columns.decision}</th>
              <th scope="col">{copy.columns.by}</th>
              <th scope="col">{copy.columns.when}</th>
              <th scope="col">{copy.columns.note}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.id} className="candidate">
                <td className="req-area">{requirementArea(row.id)}</td>
                <td>
                  <Link href={row.href} className="title-link">
                    {row.title}
                  </Link>
                </td>
                <td>{row.status}</td>
                <td className="num">{String(row.version)}</td>
                <td>
                  {row.decision ? (
                    row.decision.status
                  ) : (
                    <span className="cpm-muted">{copy.noDecision}</span>
                  )}
                </td>
                <td>{row.decision?.by ?? ""}</td>
                <td className="record-when">{row.decision?.when ?? ""}</td>
                <td className="record-note">{row.decision?.note ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** The number of events of a scope with the decisions of this browser. */
export function ShowcaseEventCount({
  stored,
  ids,
}: {
  stored: number;
  ids: string[];
}) {
  const scope = new Set(ids);
  const count =
    stored + useShowcaseDecisions().filter((d) => scope.has(d.id)).length;
  return (
    <b>
      {full(count)} {site.log.events}
    </b>
  );
}

export interface ShowcaseEventsProps {
  /** The requirements whose decisions belong here, with their stored status, title and page. */
  requirements: { id: string; status: string; title: string; href: string }[];
  /** Newest first (the audit trail) or oldest first (a requirement's history). */
  order: "newest" | "oldest";
  /** Name and link the requirement (the audit trail of a scope). */
  linked: boolean;
}

/** The decisions of this browser as events of the audit trail, in its markup. */
export function ShowcaseEvents({
  requirements,
  order,
  linked,
}: ShowcaseEventsProps) {
  const copy = site.requirements.history;
  const byId = new Map(requirements.map((r) => [r.id, r]));
  const mine = useShowcaseDecisions().filter((d) => byId.has(d.id));
  if (mine.length === 0) return null;
  // The status before each decision: the previous decision of this browser, else the stored status.
  const before = new Map<number, string>();
  const last = new Map<string, string>();
  for (const d of mine) {
    before.set(d.seq, last.get(d.id) ?? byId.get(d.id)?.status ?? "proposed");
    last.set(d.id, d.status);
  }
  const events: LocalDecision[] =
    order === "newest" ? [...mine].reverse() : mine;
  return (
    <ol className="timeline">
      {events.map((d) => {
        const r = byId.get(d.id);
        const from = before.get(d.seq);
        return (
          <li key={d.seq} className="timeline-item">
            <span className="timeline-time">{dateTime(d.ts)}</span>
            <span className="timeline-body">
              <span className="timeline-head">
                {linked && r ? (
                  <>
                    <Link href={r.href} className="cpm-citing-link">
                      {r.title}
                    </Link>{" "}
                    ·{" "}
                  </>
                ) : null}
                <b>{ACTION}</b> · {copy.actors.human} {SHOWCASE_ACTOR}
                {from && from !== d.status
                  ? ` · ${copy.statusChange} ${from} ${copy.to} ${d.status}`
                  : ""}
              </span>
              <span className="timeline-text">{d.note}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** The stage bar's Documentation figure with the decisions of this browser. */
export function ShowcaseDecidedFigure({
  decidedIds,
  ids,
  candidates,
  events,
}: {
  decidedIds: string[];
  ids: string[];
  candidates: number;
  events: number;
}) {
  const copy = site.stages;
  const decisions = useShowcaseDecisions();
  const scope = new Set(ids);
  const local = latestLocal(decisions);
  const decided = new Set(decidedIds);
  for (const [id, d] of local) {
    if (!scope.has(id)) continue;
    if (d.status === "proposed") decided.delete(id);
    else decided.add(id);
  }
  const count = events + decisions.filter((d) => scope.has(d.id)).length;
  return (
    <span className="stage-figure">
      {full(decided.size)} {copy.decided} {full(candidates)} · {full(count)}{" "}
      {copy.events}
    </span>
  );
}
