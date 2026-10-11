import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { scopesWithRequirements, workspaceScopes, workspaceSnapshot } from "@/lib/data/workspace";
import { candidatesOf, filterCandidates, groupByDomain, stageCounts, viewCandidates } from "@/lib/workspace/candidates";
import { cpmCatalogue, cpmView } from "./cpm";
import { content } from "./markets";

/*
 * The workspace snapshots (content/workspace/*.json) are the backend API's
 * own responses; these tests pin the contract the stage pages rely on: one
 * file per vehicle and market pair, the literal unions of workspace-types.ts,
 * every effort row naming a requirement of the same scope and a subsystem of
 * the CPM catalogue, the three scenarios, and the candidate rules.
 */
const pairs = content.markets.flatMap((m) => m.vehicles.map((v) => `${v.code}_${m.code}`));
const subsystemKeys = cpmCatalogue().subsystems.map((s) => s.key);
const domainKeys = content.domains.map((d) => d.key);

describe("workspace snapshots", () => {
  it("exist for every vehicle and market pair of the map, and for nothing else", () => {
    const files = readdirSync(new URL("../../content/workspace", import.meta.url))
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""))
      .sort();
    expect(files).toEqual([...pairs].sort());
    expect(workspaceScopes().map((s) => `${s.vehicle}_${s.market}`).sort()).toEqual([...pairs].sort());
  });

  it("carry when they were taken and which endpoints answered", () => {
    for (const key of pairs) {
      const [vehicle, market] = key.split("_");
      const s = workspaceSnapshot(vehicle, market);
      expect(s).toBeDefined();
      if (!s) continue;
      expect(Date.parse(s.snapshot.takenAt)).not.toBeNaN();
      expect(s.snapshot.endpoints.requirements).toBe(`/requirements?vehicle=${vehicle}&market=${market}`);
      expect(s.snapshot.endpoints.efforts).toBe(`/effort/requirements?vehicle=${vehicle}&market=${market}`);
      if (s.efforts.length > 0) expect(s.snapshot.modelHash).toMatch(/^[0-9a-f]{12}$/);
    }
  });

  it("hold requirements with the literal fields of the contract", () => {
    for (const s of workspaceScopes()) {
      for (const r of s.requirements) {
        expect(r.id).toMatch(new RegExp(`^REQ-${s.vehicle}-${s.market}-[A-Z]{2}-\\d{2}$`));
        expect(domainKeys).toContain(r.domain);
        expect(["H1", "H2"]).toContain(r.horizon);
        expect(["A", "B", "C", "D"]).toContain(r.evidence_level);
        expect(["proposed", "approved", "rejected", "deferred"]).toContain(r.status);
        expect(r.recommend_rationale.length).toBeGreaterThan(0);
        expect(r.criteria.length).toBeGreaterThan(0);
        for (const c of r.criteria) expect(["evidence", "assumption"]).toContain(c.basis);
        for (const f of r.findings) expect(["primary", "supporting", "context"]).toContain(f.role);
        expect(r.findings.some((f) => f.role === "primary")).toBe(true);
      }
    }
  });

  it("hold one effort row per requirement, on known subsystems, with ranges and a decision", () => {
    for (const s of workspaceScopes()) {
      expect(s.efforts.map((e) => e.id).sort()).toEqual(s.requirements.map((r) => r.id).sort());
      for (const e of s.efforts) {
        expect(["change", "preserve", "no_vehicle_change"]).toContain(e.kind);
        expect(["adapt", "major revision", "new generation", "no change"]).toContain(e.decision);
        expect(["K0", "K1", "K2", "K3"]).toContain(e.layer);
        expect(["XS", "S", "M", "L", "XL", "-"]).toContain(e.size);
        expect(e.p5).toBeLessThanOrEqual(e.effort_pct);
        expect(e.p95).toBeGreaterThanOrEqual(e.effort_pct);
        expect(e.decision_stable_pct).toBeGreaterThan(0);
        for (const c of e.changes) {
          expect(subsystemKeys).toContain(c.subsystem);
          expect(["K0", "K1", "K2", "K3"]).toContain(c.layer);
          expect(c.own_impact).toBeGreaterThan(0);
          expect(c.own_impact).toBeLessThanOrEqual(1);
        }
        for (const t of e.subsystems) expect(subsystemKeys).toContain(t.subsystem);
        for (const f of e.flags) {
          expect(["info", "warning", "conflict"]).toContain(f.level);
          expect(f.rule).toMatch(/^\d+$/);
        }
        if (e.kind === "change") expect(e.changes.length).toBeGreaterThan(0);
        else expect(e.changes).toHaveLength(0);
      }
    }
  });

  it("hold the three package variations, combined effort never above the plain sum", () => {
    for (const s of workspaceScopes()) {
      expect(s.scenarios.map((x) => x.scenario)).toEqual(["H1", "H2", "ALL"]);
      for (const x of s.scenarios) {
        expect(x.effort_pct).toBeLessThanOrEqual(x.sum_of_single_pct + 1e-9);
        expect(x.requirements).toBe(s.requirements.filter((r) => r.recommend && r.status !== "rejected" && (x.scenario === "ALL" || r.horizon === x.scenario)).length);
      }
    }
  });

  it("hold the scope's requirement events only, oldest first", () => {
    for (const s of workspaceScopes()) {
      let last = 0;
      for (const e of s.events) {
        expect(e.entity_id.startsWith(`REQ-${s.vehicle}-${s.market}-`)).toBe(true);
        expect(["human", "agent", "system"]).toContain(e.actor_type);
        expect(e.id).toBeGreaterThan(last);
        last = e.id;
      }
      for (const x of s.excluded) {
        expect(x.finding).toMatch(new RegExp(`^FND-${s.vehicle}-${s.market}-`));
        expect(x.reason.length).toBeGreaterThan(0);
      }
    }
  });

  it("hold the detail of every requirement with its findings, and the evidence the findings reference", () => {
    for (const s of workspaceScopes()) {
      expect(Object.keys(s.details).sort()).toEqual(s.requirements.map((r) => r.id).sort());
      for (const r of s.requirements) {
        const d = s.details[r.id];
        expect(d.id).toBe(r.id);
        expect(d.version).toBe(r.version);
        expect(d.findings.map((f) => f.id).sort()).toEqual(r.findings.map((f) => f.id).sort());
        expect(d.effort?.id).toBe(r.id);
        for (const f of d.findings) {
          expect(["primary", "supporting", "context"]).toContain(f.role);
          expect(f.statement.length).toBeGreaterThan(0);
          for (const e of f.evidence) {
            expect(["example", "quantifies", "compares", "supports"]).toContain(e.role);
            const at = e.evidence_ref.indexOf(":");
            const kind = e.evidence_ref.slice(0, at);
            const rest = e.evidence_ref.slice(at + 1);
            if (kind === "vclass" || kind === "verbatim") {
              const v = s.verbatims[rest.split("#")[0]];
              expect(v).toBeDefined();
              expect(v.text.length).toBeGreaterThan(0);
              expect(v.vehicle_code).toBe(s.vehicle);
            } else if (kind === "metric") expect(s.metrics[rest]).toBeDefined();
            else if (kind === "equipment") expect(s.equipment[rest]).toBeDefined();
            else expect(["aggregate", "finding"]).toContain(kind);
          }
        }
      }
      for (const v of Object.values(s.verbatims)) expect(v.evidence_ref).toBe(`verbatim:${v.id}`);
      for (const m of Object.values(s.metrics)) expect(m.evidence_ref).toBe(`metric:${m.id}`);
      for (const e of Object.values(s.equipment)) expect(e.evidence_ref).toBe(`equipment:${e.id}`);
    }
  });

  it("name the three scopes with a requirement set", () => {
    expect(scopesWithRequirements().map((s) => `${s.vehicle}_${s.market}`).sort()).toEqual(["F70_EU", "G60_US", "G70_US"]);
  });
});

describe("candidates of G60 US", () => {
  const snapshot = workspaceSnapshot("G60", "US");
  const candidates = snapshot ? candidatesOf(snapshot, cpmView("G60", "US")) : [];

  it("join every requirement with its estimate and the subsystems it starts in and reaches", () => {
    expect(candidates).toHaveLength(20);
    for (const c of candidates) {
      expect(c.effort).not.toBeNull();
      for (const k of c.starts) expect(c.reaches).not.toContain(k);
    }
    const seats = candidates.find((c) => c.requirement.id === "REQ-G60-US-IC-01");
    expect(seats?.starts).toEqual(["seats"]);
    expect(seats?.reaches).toContain("software_hmi");
  });

  it("put the not-recommended candidate and the level-C candidate in the inbox, with their rule", () => {
    const inbox = viewCandidates(candidates, "inbox");
    expect(inbox.length).toBeGreaterThan(0);
    expect(inbox.length).toBeLessThan(candidates.length);
    const cd = inbox.find((c) => c.requirement.id === "REQ-G60-US-ID-04");
    expect(cd?.reasons.map((r) => r.rule)).toContain("not_recommended");
    for (const c of candidates) {
      if (c.requirement.evidence_level === "C") expect(c.reasons.map((r) => r.rule)).toContain("evidence_c");
      if (c.requirement.criteria.every((x) => x.basis === "assumption")) expect(c.reasons.map((r) => r.rule)).toContain("criteria_assumed");
    }
  });

  it("filter by domain, subsystem, horizon and status, and group in the domain order", () => {
    expect(filterCandidates(candidates, { horizon: "H2" }).every((c) => c.requirement.horizon === "H2")).toBe(true);
    const seats = filterCandidates(candidates, { subsystem: "seats" });
    expect(seats.map((c) => c.requirement.id)).toContain("REQ-G60-US-IC-01");
    expect(filterCandidates(candidates, { status: "approved" })).toHaveLength(0);
    const groups = groupByDomain(filterCandidates(candidates, { domain: "interior_comfort" }), domainKeys);
    expect(groups).toHaveLength(1);
    expect(groups[0].domain).toBe("interior_comfort");
    const all = groupByDomain(candidates, domainKeys);
    expect(all.reduce((n, g) => n + g.items.length, 0)).toBe(20);
    expect(all.map((g) => g.domain)).toEqual(domainKeys.filter((d) => all.some((g) => g.domain === d)));
  });

  it("count the stage figures from the rows", () => {
    if (!snapshot) return;
    const counts = stageCounts(snapshot, candidates);
    expect(counts.candidates).toBe(20);
    expect(counts.recommended).toBe(19);
    expect(counts.excluded).toBe(6);
    expect(counts.h1 + counts.h2).toBe(20);
    expect(counts.criteriaOnEvidence).toBeLessThanOrEqual(counts.criteria);
    expect(counts.decided).toBe(0);
    expect(counts.events).toBe(40);
  });
});
