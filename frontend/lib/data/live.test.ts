import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The live setting (D-106): TRACEPOINT_LIVE=1 is always live, 0 never, and
 * unset is live whenever the API's health check answers; the check is asked
 * at most once every five seconds. Each test imports the module afresh, so
 * the remembered answer of one test does not reach the next.
 */
async function load() {
  vi.resetModules();
  return import("./workspace");
}

describe("live setting", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-10-11T08:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("reads TRACEPOINT_LIVE as on, off or automatic", async () => {
    const { liveSetting } = await load();
    vi.stubEnv("TRACEPOINT_LIVE", "1");
    expect(liveSetting()).toBe("on");
    vi.stubEnv("TRACEPOINT_LIVE", "0");
    expect(liveSetting()).toBe("off");
    vi.stubEnv("TRACEPOINT_LIVE", "");
    expect(liveSetting()).toBe("auto");
  });

  it("asks nothing when the setting is on or off", async () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const { liveEnabled } = await load();
    vi.stubEnv("TRACEPOINT_LIVE", "1");
    expect(await liveEnabled()).toBe(true);
    vi.stubEnv("TRACEPOINT_LIVE", "0");
    expect(await liveEnabled()).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("goes live in the automatic setting only when the health check answers", async () => {
    vi.stubEnv("TRACEPOINT_LIVE", "");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    expect(await (await load()).liveEnabled()).toBe(true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 500 })));
    expect(await (await load()).liveEnabled()).toBe(false);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("fetch failed")));
    expect(await (await load()).liveEnabled()).toBe(false);
  });

  it("asks the health check once in five seconds", async () => {
    vi.stubEnv("TRACEPOINT_LIVE", "");
    const fetch = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    vi.stubGlobal("fetch", fetch);
    const { API_URL, liveEnabled } = await load();
    expect(await liveEnabled()).toBe(false);
    expect(fetch).toHaveBeenCalledWith(`${API_URL}/health`, expect.objectContaining({ cache: "no-store" }));
    fetch.mockResolvedValue(new Response("{}", { status: 200 }));
    vi.setSystemTime(new Date("2026-10-11T08:00:04Z"));
    expect(await liveEnabled()).toBe(false);
    vi.setSystemTime(new Date("2026-10-11T08:00:06Z"));
    expect(await liveEnabled()).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
