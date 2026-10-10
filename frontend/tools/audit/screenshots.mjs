/**
 * Screenshots of the page states for the step report: resting map with the
 * market callouts, a hovered market, the three magnified markets with their
 * vehicle panels, a hovered vehicle card, the card's photo at full screen,
 * the vehicle screen just after the hand-over (photo fading to the sketch),
 * the vehicle screens for a market with verbatims and one without, keyboard
 * focus, reduced motion. Run against a built app started in another shell
 * (`pnpm build && pnpm start`).
 *
 *   node tools/audit/screenshots.mjs http://localhost:3400 [outDir]
 *
 * Hover and click go through the real pointer: the market callout cards are
 * the market buttons, so their box tells the script where to click.
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import pkg from "/opt/node22/lib/node_modules/playwright/index.js";

const { chromium } = pkg;
const [BASE = "http://localhost:3400", OUT = "tools/audit/out"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });

async function marketPoint(page, id) {
  const box = await page.locator(`button[data-region="${id}"]`).boundingBox();
  if (!box) throw new Error(`no key for ${id}`);
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function selectMarket(page, id) {
  const at = await marketPoint(page, id);
  await page.mouse.move(at.x, at.y);
  await page.mouse.click(at.x, at.y);
  await page.waitForSelector(".market-panel", { timeout: 5000 });
  await page.waitForTimeout(500);
}

async function clickFirstCard(page) {
  const card = await page.locator(".vehicle-card").first().boundingBox();
  await page.mouse.click(card.x + card.width / 2, card.y + card.height / 3);
}

async function shoot(name, viewport, steps, options = {}) {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
    reducedMotion: options.reducedMotion ?? "no-preference",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(BASE + (options.path ?? "/"), { waitUntil: "networkidle" });
  if (!options.path) {
    await page.waitForSelector('canvas[data-ready="true"]', { timeout: 15000 });
    await page.waitForTimeout(900);
  }
  await steps(page);
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(`${file}${errors.length ? `  ERRORS: ${errors.join(" | ")}` : ""}`);
  await context.close();
}

const desktop = { width: 1440, height: 900 };
const wide = { width: 1920, height: 1080 };

await shoot("01-resting-1440", desktop, async () => {});
await shoot("02-hover-eu-1440", desktop, async (page) => {
  const at = await marketPoint(page, "EU");
  await page.mouse.move(at.x, at.y);
  await page.waitForTimeout(400);
});
await shoot("03-selected-eu-1440", desktop, async (page) => selectMarket(page, "EU"));
await shoot("04-selected-cn-1440", desktop, async (page) => selectMarket(page, "CN"));
await shoot("05-selected-us-1440", desktop, async (page) => selectMarket(page, "US"));
await shoot("06-card-hover-eu-1440", desktop, async (page) => {
  await selectMarket(page, "EU");
  const card = await page.locator(".vehicle-card").first().boundingBox();
  await page.mouse.move(card.x + card.width / 2, card.y + card.height / 3);
  await page.waitForTimeout(300);
});
await shoot("07-card-fullscreen-eu-1440", desktop, async (page) => {
  await selectMarket(page, "EU");
  await clickFirstCard(page);
  await page.waitForTimeout(760);
});
await shoot("08-handover-eu-f70-1440", desktop, async (page) => {
  await selectMarket(page, "EU");
  await clickFirstCard(page);
  await page.waitForURL("**/markets/eu/f70", { timeout: 8000 });
  await page.waitForTimeout(120);
});
await shoot("09-vehicle-eu-f70-1440", desktop, async () => {}, { path: "/markets/eu/f70" });
await shoot("10-vehicle-us-g70-hover-1440", desktop, async (page) => {
  const row = page.locator(".domain-row").nth(2);
  await row.hover();
  await page.waitForTimeout(300);
}, { path: "/markets/us/g70" });
await shoot("11-vehicle-cn-g68-1440", desktop, async () => {}, { path: "/markets/cn/g68" });
await shoot("12-keyboard-focus-us-1440", desktop, async (page) => {
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(400);
});
await shoot("13-resting-1920", wide, async () => {});
await shoot("14-reduced-motion-selected-eu-1440", desktop, async (page) => {
  const at = await marketPoint(page, "EU");
  await page.mouse.click(at.x, at.y);
  await page.waitForTimeout(300);
}, { reducedMotion: "reduce" });

await browser.close();
