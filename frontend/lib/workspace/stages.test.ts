import { describe, expect, it } from "vitest";
import { hasStage, scopeContent, stageParams } from "./figures";
import { STAGES, stageAvailable, stageHref } from "./stages";
import { workspaceSnapshot } from "@/lib/data/workspace";

/*
 * Step 19: a stage exists where the backend holds something for the scope.
 * Every scope has its situation analysis; stage 2 needs a requirement set or
 * an analyst brief; stages 3 to 5 need a requirement set.
 */
const available = (vehicle: string, market: string) => STAGES.filter((stage) => hasStage(stage, vehicle, market));

describe("stages per scope", () => {
  it("open every stage where a requirement set exists", () => {
    for (const [v, m] of [["G60", "US"], ["G70", "US"], ["F70", "EU"]]) expect(available(v, m)).toEqual(STAGES);
  });

  it("open the situation and the analyst's brief where only an analysis exists", () => {
    expect(available("G68", "CN")).toEqual(["situation", "structure"]);
  });

  it("open only the situation where the backend holds neither", () => {
    for (const [v, m] of [["G60", "EU"], ["G70", "EU"], ["G70", "CN"]]) expect(available(v, m)).toEqual(["situation"]);
  });

  it("link only the stages that exist and generate only their routes", () => {
    const scope = scopeContent("G68", "CN", workspaceSnapshot("G68", "CN"));
    expect(scope.requirements).toBe(false);
    expect(scope.brief?.key).toBe("G68_CN");
    expect(scope.series?.key).toBe("G60_regions");
    expect(stageHref("CN", "G68", "structure", scope)).toBe("/markets/cn/g68/structure");
    expect(stageHref("CN", "G68", "requirements", scope)).toBeNull();
    expect(stageAvailable("documentation", scope)).toBe(false);
    expect(stageParams("documentation").map((p) => `${p.vehicle}_${p.market}`).sort()).toEqual(["f70_eu", "g60_us", "g70_us"]);
    expect(stageParams("structure").map((p) => `${p.vehicle}_${p.market}`).sort()).toEqual(["f70_eu", "g60_us", "g68_cn", "g70_us"]);
  });
});
