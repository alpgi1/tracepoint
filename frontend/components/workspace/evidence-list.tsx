import { ChevronDown } from "lucide-react";
import { full, percent } from "@/lib/content/format";
import type { FindingDetail, WorkspaceSnapshot } from "@/lib/content/workspace-types";
import { site } from "@/lib/site";
import { type EvidenceItem, findingsByRole, resolveEvidence } from "@/lib/workspace/requirements";

/*
 * The evidence of a requirement: its linked findings by role, each a native
 * details element (the primary finding open) with the backend's statement,
 * its figures, its links to other findings, and the evidence rows it
 * linked: verbatims as written in a blockquote with their id, source,
 * country, powertrain, classification and workbook row (exemption E5),
 * study attributes with their mean and shares, catalogue items with their
 * availability, counts, and references to other findings. Method after the
 * quote card and the accordion rows of the 21st.dev survey (research notes
 * 6.4): the quote with its attribution beneath, nothing else; no avatars,
 * no stars, no coloured marker.
 */
export interface EvidenceListProps {
  snapshot: WorkspaceSnapshot;
  findings: FindingDetail[];
}

export function EvidenceList({ snapshot, findings }: EvidenceListProps) {
  const copy = site.requirements;
  const ordered = findingsByRole({ findings } as Parameters<typeof findingsByRole>[0]);
  return (
    <ul className="findings">
      {ordered.map((finding) => (
        <li key={finding.id}>
          <details className="finding" open={finding.role === "primary" ? true : undefined}>
            <summary className="finding-summary">
              <ChevronDown className="candidate-chevron" aria-hidden="true" size={16} strokeWidth={1.75} />
              <span className="finding-role">{copy.roles[finding.role]}</span>
              <span className="finding-title">{finding.title}</span>
              <span className="finding-meta">
                {copy.kinds[finding.kind] ?? finding.kind} · {copy.level} {finding.evidence_level} · {full(finding.evidence.length)}{" "}
                {finding.evidence.length === 1 ? copy.rowsOne : copy.rowsMany}
              </span>
            </summary>
            <div className="finding-body">
              <p className="candidate-id">{finding.id}</p>
              <p className="finding-statement">{finding.statement}</p>
              <FigureLines finding={finding} />
              {finding.links_out.length + finding.links_in.length > 0 ? (
                <ul className="finding-links">
                  {finding.links_out.map((link) => (
                    <li key={`out-${link.to_finding_id}`}>
                      <span className="cpm-muted">{copy.linkKinds[link.kind] ?? link.kind}</span> <span className="candidate-id">{link.to_finding_id}</span>
                      {link.rationale ? `: ${link.rationale}` : ""}
                    </li>
                  ))}
                  {finding.links_in.map((link) => (
                    <li key={`in-${link.from_finding_id}`}>
                      <span className="candidate-id">{link.from_finding_id}</span> <span className="cpm-muted">{copy.linkKinds[link.kind] ?? link.kind}</span> this finding
                      {link.rationale ? `: ${link.rationale}` : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              <ul className="evidence-rows">
                {finding.evidence.map((row) => (
                  <EvidenceRowItem key={row.evidence_ref} item={resolveEvidence(snapshot, row)} />
                ))}
              </ul>
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}

function num(q: Record<string, unknown>, key: string): number | null {
  const v = q[key];
  return typeof v === "number" ? v : null;
}

function rec(q: Record<string, unknown>, key: string): Record<string, number> | null {
  const v = q[key];
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, number> = {};
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) if (typeof x === "number") out[k] = x;
  return Object.keys(out).length > 0 ? out : null;
}

function pairs(r: Record<string, number>, fmt: (n: number) => string = full): string {
  return Object.entries(r)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => `${k} ${fmt(v)}`)
    .join(", ");
}

/** The finding's figures as the backend counted them, labelled per kind of finding. */
function FigureLines({ finding }: { finding: FindingDetail }) {
  const copy = site.requirements;
  const q = finding.quantification;
  const lines: string[] = [];
  const rows = num(q, "rows");
  const likes = num(q, "likes");
  const complaints = num(q, "complaints");
  if (rows !== null && complaints !== null) {
    const parts = [num(q, "defects"), num(q, "difficult_to_use"), num(q, "wants")];
    lines.push(
      `${full(rows)} ${copy.quant.rows}: ${full(likes ?? 0)} ${copy.quant.likes}, ${full(complaints)} ${copy.quant.complaints}` +
        (parts.every((p) => p !== null) ? ` (${full(parts[0] ?? 0)} ${copy.quant.defects}, ${full(parts[1] ?? 0)} ${copy.quant.difficultToUse}, ${full(parts[2] ?? 0)} ${copy.quant.wants})` : ""),
    );
    const share = num(q, "share_of_market_complaints_pct");
    const total = num(q, "total_market_complaint_rows");
    const ofTheme = num(q, "complaint_share_of_theme");
    if (share !== null && total !== null) lines.push(`${share.toFixed(1)} % ${copy.quant.ofMarketComplaints} ${full(total)} ${copy.quant.complaintRows}${ofTheme !== null ? `; ${percent(ofTheme)} ${copy.quant.ofThemeRows}` : ""}`);
  } else if (rows !== null && likes !== null) {
    const share = num(q, "like_share");
    lines.push(`${full(rows)} ${copy.quant.rows}, ${full(likes)} ${copy.quant.likes}${share !== null ? ` (${percent(share)})` : ""}`);
  }
  for (const [key, label] of [
    ["by_powertrain", copy.quant.byPowertrain],
    ["by_source", copy.quant.bySource],
    ["by_country", copy.quant.byCountry],
  ] as const) {
    const r = rec(q, key);
    if (r) lines.push(`${label}: ${pairs(r)}`);
  }
  const score = num(q, "score");
  if (score !== null) {
    const scale = typeof q.scale === "string" ? q.scale : "";
    const study = typeof q.study === "string" ? q.study : "";
    const peerMean = num(q, "peer_mean");
    const peers = rec(q, "peers");
    lines.push(`${study}: ${copy.quant.score} ${score.toFixed(2)}${scale ? ` (${scale})` : ""}${peerMean !== null ? `; ${copy.peerMean} ${peerMean.toFixed(2)}` : ""}${peers ? ` (${pairs(peers, (n) => n.toFixed(2))})` : ""}`);
    const rank = num(q, "rank_weakest_first");
    const count = num(q, "attributes_in_study");
    const top2 = num(q, "top2");
    const bottom3 = num(q, "bottom3");
    const extra: string[] = [];
    if (rank !== null && count !== null) extra.push(`${copy.rank} ${full(rank)} ${copy.of} ${full(count)} ${copy.quant.attributes}`);
    if (top2 !== null) extra.push(`${copy.top2} ${percent(top2)}`);
    if (bottom3 !== null) extra.push(`${copy.bottom3} ${percent(bottom3)}`);
    if (extra.length > 0) lines.push(extra.join("; "));
    const other = rec(q, "other_markets");
    if (other) lines.push(`${copy.quant.otherMarkets}: ${pairs(other, (n) => n.toFixed(2))}`);
  }
  const themeComplaints = num(q, "theme_complaints");
  if (themeComplaints !== null) {
    const wishes = num(q, "theme_wants");
    const items = Array.isArray(q.catalogue_items) ? q.catalogue_items.length : null;
    const optional = num(q, "items_optional_somewhere");
    const variants = num(q, "variants");
    lines.push(
      `${full(themeComplaints)} ${copy.quant.complaintRowsOfTheme}${wishes !== null ? `, ${full(wishes)} ${copy.quant.wishes}` : ""}${items !== null ? `; ${full(items)} ${copy.quant.catalogueItems}` : ""}${optional !== null ? `, ${full(optional)} ${copy.quant.optionalSomewhere}` : ""}${variants !== null ? `; ${full(variants)} ${copy.variants}` : ""}`,
    );
  }
  if (lines.length === 0) return null;
  return (
    <p className="finding-figures">
      <span className="cpm-muted">{copy.figures}.</span> {lines.join(". ")}.
    </p>
  );
}

function EvidenceRowItem({ item }: { item: EvidenceItem }) {
  const copy = site.requirements;
  const role = copy.evidenceRoles[item.row.role] ?? item.row.role;
  switch (item.kind) {
    case "verbatim": {
      const v = item.verbatim;
      const c = item.classification;
      const classification = c ? [c.feedback_type, c.level2_raw, c.level3_raw].filter(Boolean).join(", ") : null;
      return (
        <li className="evidence-verbatim">
          <blockquote className="verbatim">
            <p>{v.text}</p>
            <footer className="verbatim-meta">
              {v.id} · {v.source_label} · {v.country_code}
              {v.powertrain ? ` · ${v.powertrain}` : ""}
              {classification ? ` · ${classification}` : ""} · {v.locator.file}, {copy.workbookRow} {full(v.locator.row)}
            </footer>
          </blockquote>
        </li>
      );
    }
    case "metric": {
      const m = item.metric;
      const d = m.distribution;
      return (
        <li className="evidence-line">
          <span className="cpm-muted">{role}</span> {copy.study} {m.study}, {m.vehicle_code} {m.market_code}: {m.attribute_raw}, {copy.mean}{" "}
          {m.mean !== null ? m.mean.toFixed(2) : "n/a"}
          {d?.top2 !== null && d?.top2 !== undefined ? `; ${copy.top2} ${percent(d.top2)}` : ""}
          {d?.bottom3 !== null && d?.bottom3 !== undefined ? `; ${copy.bottom3} ${percent(d.bottom3)}` : ""}
          {m.scale_note ? ` (${m.scale_note})` : ""}
          {item.row.note ? ` · ${item.row.note}` : ""}
        </li>
      );
    }
    case "equipment": {
      const e = item.item;
      const standard = Object.values(e.availability).filter((s) => s === "standard").length;
      const optional = Object.values(e.availability).filter((s) => s === "optional").length;
      return (
        <li className="evidence-line">
          <span className="cpm-muted">{role}</span> {e.name_en ?? e.name_de}
          {e.name_en && e.name_de !== e.name_en ? ` (${e.name_de})` : ""}
          {e.sa_code ? `, ${copy.saCode} ${e.sa_code}` : ""}
          {e.section ? `, ${e.section}` : ""}; {copy.standardOn} {full(standard)}, {copy.optionalOn} {full(optional)} {copy.of} {full(Object.keys(e.availability).length)} {copy.variants} · {e.id}
          {item.row.note ? ` · ${item.row.note}` : ""}
        </li>
      );
    }
    case "aggregate":
      return (
        <li className="evidence-line">
          <span className="cpm-muted">{copy.count}</span> {item.row.note ?? item.row.evidence_ref}
        </li>
      );
    case "finding":
      return (
        <li className="evidence-line">
          <span className="cpm-muted">{role}</span> {copy.finding} <span className="candidate-id">{item.findingId}</span>
          {item.row.note ? ` · ${item.row.note}` : ""}
        </li>
      );
    default:
      return (
        <li className="evidence-line">
          <span className="cpm-muted">{role}</span> {item.row.evidence_ref} · {copy.unresolved}
        </li>
      );
  }
}
