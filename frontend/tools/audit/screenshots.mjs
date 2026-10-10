/**
 * Screenshots of the landing page states for the step report: resting globe,
 * a hovered market, a selected (zoomed) market, mobile. Run against a built
 * app started in another shell (`pnpm build && pnpm start`).
 *
 *   node tools/audit/screenshots.mjs http://localhost:3400 [outDir]
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import pkg from "/opt/node22/lib/node_modules/playwright/index.js";

const { chromium } = pkg;
const [BASE = "http://localhost:3400", OUT = "tools/audit/out"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: "/opt/pw-browsers/chromium",
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
});

async function shoot(name, viewport, steps, options = {}) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, reducedMotion: options.reducedMotion ?? "no-preference" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForSelector('canvas[data-ready="true"]', { timeout: 15000 });
  await page.waitForTimeout(1800);
  await steps(page);
  const file = join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: options.fullPage ?? false });
  console.log(`${file}${errors.length ? `  ERRORS: ${errors.join(" | ")}` : ""}`);
  await context.close();
}

const desktop = { width: 1440, height: 900 };
const mobile = { width: 390, height: 844 };

await shoot("01-resting-1440", desktop, async () => {});
await shoot("02-hover-eu-1440", desktop, async (page) => {
  await page.hover('button:has-text("European Union")');
  await page.waitForTimeout(400);
});
await shoot("03-selected-eu-1440", desktop, async (page) => {
  await page.click('button:has-text("European Union")');
  await page.waitForTimeout(1600);
});
await shoot("04-selected-cn-1440", desktop, async (page) => {
  await page.click('button:has-text("China")');
  await page.waitForTimeout(1600);
});
await shoot("05-selected-us-1440", desktop, async (page) => {
  await page.click('button:has-text("United States")');
  await page.waitForTimeout(1600);
});
await shoot("06-resting-390", mobile, async () => {}, { fullPage: true });
await shoot("07-selected-us-390", mobile, async (page) => {
  await page.click('button:has-text("United States")');
  await page.waitForTimeout(1600);
});
await shoot("08-reduced-motion-1440", desktop, async () => {}, { reducedMotion: "reduce" });

await browser.close();
