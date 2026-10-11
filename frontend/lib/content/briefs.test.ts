import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import type { Brief, SeriesBrief, SituationBrief } from "@/lib/content/brief-types";
import { analysesFor, analysesIndex, storedBrief } from "@/lib/data/analyses";
import { workspaceScopes } from "@/lib/data/workspace";
import { marketEvidenceBySubsystem } from "@/lib/workspace/market";
import { cpmCatalogue, cpmView } from "./cpm";

/*
 * The briefs (content/analyses/) and the external evidence (content/
 * workspace/*.json) are the backend's GET /analyses/{key}/brief and
 * GET /external, written by scripts/snapshot.mjs (step 19). These tests pin
 * the contract the screens rely on: one file per analysis of the index, the
 * groups that sort the proposals and topics cover each of them once, every
 * reference read back from the store, the words for every code, no code
 * key left in an agent's sentence, and the external rows in words with
 * links only to web addresses.
 */
const index = analysesIndex();
const keys = index.items.map((i) => i.key);
const subsystemKeys = cpmCatalogue().subsystems.map((s) => s.key);
const CODE_KEYS = /\b(?:software_hmi|interior_console|thermal_hvac|ee_architecture|body_structure|hv_battery|exterior_design|paint_color|infotainment_digital|own_impact|effort_changes)\b/;
const FORBIDDEN = /[–—!]/;

function texts(brief: Brief): string[] {
  if (brief.kind === "situation") {
    return [brief.headline, brief.summary, ...brief.proposals.flatMap((p) => [p.title, p.proposal, p.why]), ...brief.customers.flatMap((g) => g.items.flatMap((i) => [i.title, i.statement])), ...brief.assumptions];
  }
  return [brief.headline, brief.answer, ...brief.topics.flatMap((t) => [t.title, t.action, t.why, ...t.regions.map((r) => r.customers)]), ...brief.unknowns];
}

describe("analyst briefs", () => {
  it("exist for every analysis of the index, and for nothing else", () => {
    const files = readdirSync(new URL("../../content/analyses", import.meta.url))
      .filter((f) => f.endsWith(".json") && f !== "index.json")
      .map((f) => f.replace(".json", ""))
      .sort();
    expect(files).toEqual([...keys].sort());
    expect(keys).toEqual(expect.arrayContaining(["G60_US", "G68_CN", "F70_GB", "G60_regions"]));
    for (const key of keys) expect(storedBrief(key)?.key).toBe(key);
    expect(storedBrief("../etc")).toBeUndefined();
  });

  it("name the analyses each scope of the map reads", () => {
    const pick = (v: string, m: string) => {
      const found = analysesFor(v, m);
      return [found.situation?.key ?? null, found.series?.key ?? null];
    };
    expect(pick("G60", "US")).toEqual(["G60_US", "G60_regions"]);
    expect(pick("G60", "EU")).toEqual([null, "G60_regions"]);
    expect(pick("G68", "CN")).toEqual(["G68_CN", "G60_regions"]);
    expect(pick("F70", "EU")).toEqual(["F70_GB", null]);
    expect(pick("G70", "US")).toEqual([null, null]);
  });

  it("sort every proposal and every topic into exactly one group", () => {
    for (const key of keys) {
      const brief = storedBrief(key);
      if (!brief) continue;
      if (brief.kind === "situation") {
        const grouped = brief.proposalGroups.flatMap((g) => g.proposals).sort((a, b) => a - b);
        expect(grouped).toEqual(brief.proposals.map((p) => p.n));
        for (const g of brief.proposalGroups) expect(["now", "next", "keep"]).toContain(g.group);
      } else {
        const grouped = brief.decisions.flatMap((d) => d.topics).sort((a, b) => a - b);
        expect(grouped).toEqual(brief.topics.map((t) => t.n));
        for (const t of brief.topics) expect(t.decisionLabel.length).toBeGreaterThan(0);
      }
    }
  });

  it("carry the engine's figures with their words, and every reference read back", () => {
    for (const key of keys) {
      const brief = storedBrief(key);
      if (!brief) continue;
      const efforts = brief.kind === "situation" ? brief.proposals.map((p) => p.effort) : brief.topics.map((t) => t.effort);
      for (const e of efforts) {
        expect(e.statusLabel.length).toBeGreaterThan(0);
        if (e.status === "estimated") {
          expect(e.p5).toBeLessThanOrEqual(e.effortPct ?? 0);
          expect(e.p95).toBeGreaterThanOrEqual(e.effortPct ?? 0);
          expect(e.decisionLabel).toMatch(/^(Adaptation|Major revision|New generation)/);
          expect(e.borderline).toBe((e.stablePct ?? 100) < 90);
        }
      }
      for (const p of brief.packages) expect(["H1", "H2"]).toContain(p.horizon);
      const evidence = brief.kind === "situation" ? [...brief.proposals.map((p) => p.evidence), ...brief.customers.flatMap((g) => g.items.map((i) => i.evidence))] : brief.topics.map((t) => t.evidence);
      for (const ev of evidence) {
        expect(ev.items).toHaveLength(ev.count);
        for (const item of ev.items) {
          expect(item.kind).not.toBe("unknown");
          expect(item.label.length).toBeGreaterThan(0);
          if (item.url) expect(item.url).toMatch(/^https?:\/\//);
        }
      }
    }
  });

  it("speak in words: no code key and no dash or exclamation mark in an agent's sentence", () => {
    for (const key of keys) {
      const brief = storedBrief(key);
      if (!brief) continue;
      for (const text of texts(brief)) {
        expect(text, key).not.toMatch(CODE_KEYS);
        expect(text, key).not.toMatch(FORBIDDEN);
      }
    }
  });

  it("put the series' regions side by side with the vehicle each region is served by", () => {
    const series = storedBrief("G60_regions") as SeriesBrief;
    expect(series.regions.map((r) => r.label)).toEqual(["EU", "US", "CN"]);
    expect(series.regions.find((r) => r.label === "CN")?.vehicle).toBe("G68");
    expect(series.optimum.regional.map((r) => r.region)).toEqual(["EU", "US", "CN"]);
    const situation = storedBrief("F70_GB") as SituationBrief;
    expect(situation.country).toBe("GB");
  });
});

describe("external evidence of the scopes", () => {
  it("is held for every scope, in words, with links only to web addresses", () => {
    for (const s of workspaceScopes()) {
      expect(s.external.total).toBe(s.external.items.length);
      expect(s.external.total).toBeGreaterThan(0);
      expect(s.external.verified).toBe(s.external.items.filter((r) => r.verified).length);
      for (const r of s.external.items) {
        for (const k of r.subsystems) expect(subsystemKeys).toContain(k);
        expect(["strong", "medium", "weak"]).toContain(r.level);
        expect(r.verificationLabel.length).toBeGreaterThan(0);
        expect(r.kindLabel.length).toBeGreaterThan(0);
        if (r.source.url) expect(r.source.url).toMatch(/^https?:\/\//);
        expect(r.regions.some((x) => x === s.market || x === "Global")).toBe(true);
        expect(r.vehicles.length === 0 || r.vehicles.includes(s.vehicle)).toBe(true);
      }
    }
  });

  it("is counted per subsystem the way the dialog shows it", () => {
    for (const s of workspaceScopes()) {
      const view = cpmView(s.vehicle, s.market);
      if (!view) continue;
      const per = marketEvidenceBySubsystem(s.external, view);
      for (const [key, entry] of Object.entries(per)) {
        expect(entry.count).toBe(s.external.items.filter((r) => r.subsystems.includes(key as (typeof subsystemKeys)[number])).length);
        expect(entry.rows.length).toBeLessThanOrEqual(3);
      }
    }
  });

  it("goes with the exporter's files exactly where the scope carries a requirement set", () => {
    for (const s of workspaceScopes()) {
      if (s.requirements.length === 0) {
        expect(s.exports).toBeNull();
        continue;
      }
      expect(s.exports?.csv.split("\n")[0]).toMatch(/^id,vehicle,market,domain,title,.*,decision,decided_by,decided_at,decision_note\r?$/);
      expect(s.exports?.csv.split("\n").filter((l) => l.startsWith(`REQ-${s.vehicle}-${s.market}-`))).toHaveLength(s.requirements.length);
      expect(s.exports?.md.startsWith(`# Requirement list, ${s.vehicle} ${s.market}`)).toBe(true);
    }
  });
});
