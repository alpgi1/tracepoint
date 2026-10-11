import { dateTime } from "@/lib/content/format";
import type { WorkspaceRead } from "@/lib/data/workspace";
import { site } from "@/lib/site";

/*
 * The source line every stage ends with, in the product manager's words:
 * live data with the time it was read, or the stored data with the time it
 * was stored, and when the live service did not answer, that it did not;
 * the effort model the figures were computed with; the Tracepoint version
 * that produced the data. Which service and which endpoints answered are in
 * the README and the stored files, not on screen (D-103).
 */
export function SourceLine({ read }: { read: WorkspaceRead }) {
  const copy = site.structure;
  const { snapshot } = read;
  const when = read.live && read.readAt ? `${copy.sourceLiveBefore} ${dateTime(read.readAt)}` : read.reason ? `${copy.sourceFallback} ${dateTime(snapshot.snapshot.takenAt)}` : `${copy.sourceBefore} ${dateTime(snapshot.snapshot.takenAt)}`;
  return (
    <p className="stage-source">
      {when}
      {snapshot.snapshot.modelHash ? `; ${copy.sourceModel} ${snapshot.snapshot.modelHash}, ${copy.sourceModelNote}` : ""}
      {snapshot.snapshot.codeVersion ? `; ${copy.sourceCode} ${snapshot.snapshot.codeVersion}` : ""}.
    </p>
  );
}

/** The empty shell a stage shows while its body is read at request time. */
export function StagePending() {
  return <div className="workspace stage-pending" aria-busy="true" />;
}
