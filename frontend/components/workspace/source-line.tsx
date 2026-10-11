import { dateTime } from "@/lib/content/format";
import type { WorkspaceRead } from "@/lib/data/workspace";
import { site } from "@/lib/site";

/** The source line every stage ends with: which API answered and when, or the snapshot's date; the effort model hash; the backend code version. */
export function SourceLine({ read }: { read: WorkspaceRead }) {
  const copy = site.structure;
  const { snapshot } = read;
  return (
    <p className="stage-source">
      {read.live && read.readAt ? `${copy.sourceLiveBefore} ${read.api}, ${copy.sourceLiveMiddle} ${dateTime(read.readAt)}` : `${copy.sourceBefore} ${dateTime(snapshot.snapshot.takenAt)}`}
      {snapshot.snapshot.modelHash ? `; ${copy.sourceModel} ${snapshot.snapshot.modelHash}, ${copy.sourceModelNote}` : ""}
      {snapshot.snapshot.codeVersion ? `; ${copy.sourceCode} ${snapshot.snapshot.codeVersion}` : ""}.
      {read.reason ? ` ${copy.sourceFallback} ${read.api}: ${read.reason}.` : ""}
    </p>
  );
}

/** The empty shell a stage shows while its body is read at request time. */
export function StagePending() {
  return <div className="workspace stage-pending" aria-busy="true" />;
}
