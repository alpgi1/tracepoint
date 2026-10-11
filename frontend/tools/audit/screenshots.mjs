/**
 * Screenshots of the page states for the step report: resting map with the
 * market callouts, a hovered market, the three magnified markets with their
 * vehicle panels, a hovered vehicle card, the card's photo on its way to the
 * vehicle screen, the photo fading there while the sketch is revealed,
 * the vehicle screens for a market with verbatims and one without, keyboard
 * focus, reduced motion, and the subsystem dialog (with verbatims and market
 * rows, with a market row, without verbatims, at 1920 px), and the stage
 * bar with stage 2 (the inbox, all candidates with a row opened, the
 * filtered table, the left-out findings, a scope without a requirement
 * set, 1920 px), stage 3 and the bridges, stage 4 (the evidence and effort
 * chart scrolled into view) and the method sheet,
 * and stage 5 with gate G2 (one decision is made when the app runs in the
 * live mode and TRACEPOINT_SHOTS_DECIDE=1 is set here, since the app goes
 * live whenever the backend answers, D-106), and the motion of step 20 (the
 * car moving into the header's corner and back, a stage's content arriving,
 * the corner car focused, the header on a phone). Run against a built app
 * started in another shell (`pnpm build && pnpm start`).
 *
 *   node tools/audit/screenshots.mjs http://localhost:3400 [outDir]
 *   SHOTS_ONLY="^3[67]-" node tools/audit/screenshots.mjs http://localhost:3400 [outDir]
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

// SHOTS_ONLY=<regular expression> takes only the matching states (the live states of step 17, for example).
const ONLY = process.env.SHOTS_ONLY ? new RegExp(process.env.SHOTS_ONLY) : null;

async function shoot(name, viewport, steps, options = {}) {
  if (ONLY && !ONLY.test(name)) return;
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
// Step 20: the photo leaves the card with the click; the vehicle screen is there by about 300 ms.
await shoot("07-photo-moving-eu-1440", desktop, async (page) => {
  await selectMarket(page, "EU");
  await clickFirstCard(page);
  await page.waitForTimeout(320);
});
await shoot("08-photo-fading-eu-f70-1440", desktop, async (page) => {
  await selectMarket(page, "EU");
  await clickFirstCard(page);
  await page.waitForTimeout(1250);
});
await shoot("09-vehicle-eu-f70-1440", desktop, async () => {}, { path: "/markets/eu/f70" });
await shoot("10-vehicle-us-g70-hover-1440", desktop, async (page) => {
  const row = page.locator(".cpm-row").nth(2);
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

async function openSubsystem(page, name) {
  await page.locator(".cpm-row", { hasText: name }).first().click();
  await page.waitForSelector("dialog[open]", { timeout: 5000 });
  await page.waitForTimeout(500);
}

await shoot("15-dialog-us-g60-software-1440", desktop, async (page) => openSubsystem(page, "Software/HMI"), { path: "/markets/us/g60" });
await shoot("16-dialog-us-g60-powertrain-1440", desktop, async (page) => openSubsystem(page, "Powertrain"), { path: "/markets/us/g60" });
await shoot("17-dialog-cn-g68-interior-1440", desktop, async (page) => openSubsystem(page, "Interior/console"), { path: "/markets/cn/g68" });
await shoot("18-dialog-eu-f70-seats-1920", wide, async (page) => openSubsystem(page, "Seats"), { path: "/markets/eu/f70" });

// Step 14: the stage bar and stage 2, Structure & context.
await shoot("19-structure-us-g60-inbox-1440", desktop, async () => {}, { path: "/markets/us/g60/structure" });
await shoot("20-structure-us-g60-all-open-1440", desktop, async (page) => {
  await page.locator(".candidate-summary").first().click();
  await page.waitForTimeout(300);
}, { path: "/markets/us/g60/structure?view=all" });
await shoot("21-structure-eu-f70-filtered-1440", desktop, async () => {}, { path: "/markets/eu/f70/structure?view=all&subsystem=software_hmi" });
await shoot("22-structure-us-g70-excluded-1440", desktop, async () => {}, { path: "/markets/us/g70/structure?view=excluded" });
await shoot("23-structure-cn-g68-1440", desktop, async () => {}, { path: "/markets/cn/g68/structure" });
await shoot("24-structure-us-g60-all-1920", wide, async () => {}, { path: "/markets/us/g60/structure?view=all" });

// Step 15: stage 3, the requirement page and the index; the bridges on the vehicle screen.
await shoot("25-requirements-us-g60-1440", desktop, async () => {}, { path: "/markets/us/g60/requirements" });
await shoot("26-requirement-us-g60-ic-01-1440", desktop, async () => {}, { path: "/markets/us/g60/requirements/req-g60-us-ic-01" });
await shoot("27-requirement-us-g60-pr-03-effort-1440", desktop, async (page) => {
  await page.locator("#requirement-heading").waitFor();
  const heading = page.getByRole("heading", { name: "Effort (CPM)" });
  await heading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60/requirements/req-g60-us-pr-03" });
await shoot("28-dialog-us-g60-seats-requirements-1440", desktop, async (page) => {
  await openSubsystem(page, "Seats");
  const band = page.locator(".cpm-band-requirements");
  await band.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60" });
await shoot("29-vehicle-us-g60-bridges-1440", desktop, async () => {}, { path: "/markets/us/g60" });

// Step 16: stage 4, customer evidence and effort per requirement and the packages, the package builder with an estimate, the method sheet.
await shoot("30-priorities-us-g60-1440", desktop, async (page) => {
  await page.getByRole("heading", { name: "Customer evidence and effort per requirement" }).evaluate((el) => window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 24));
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60/priorities" });
await shoot("31-priorities-us-g60-builder-1440", desktop, async (page) => {
  // The builder asks the engine in the live mode only (step 19); otherwise its heading says so.
  const builder = (await page.locator("#builder").count()) > 0 ? page.locator("#builder") : page.getByRole("heading", { name: "Package builder" });
  await builder.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60/priorities?pkg=REQ-G60-US-IC-01&pkg=REQ-G60-US-ID-01&pkg=REQ-G60-US-PR-03" });
await shoot("32-method-us-g60-1440", desktop, async (page) => {
  await page.locator(".dsm").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60/priorities/method" });
await shoot("33-priorities-eu-f70-1920", wide, async () => {}, { path: "/markets/eu/f70/priorities" });

// Step 17: stage 5, the decision record and the audit trail; gate G2 on the requirement page.
// In the live mode (the backend API up, unless TRACEPOINT_LIVE=0 on the app) the form is live; one
// decision is made on REQ-G60-US-PR-03 for the record only when TRACEPOINT_SHOTS_DECIDE=1 asks for
// it, because the backend keeps every decision. Otherwise the controls are disabled.
await shoot("34-log-us-g60-1440", desktop, async () => {}, { path: "/markets/us/g60/log" });
await shoot("35-requirement-us-g60-pr-03-decision-1440", desktop, async (page) => {
  await page.locator("#decision").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60/requirements/req-g60-us-pr-03" });
await shoot("36-requirement-us-g60-pr-03-decided-1440", desktop, async (page) => {
  const note = page.locator("textarea[name=note]");
  if (process.env.TRACEPOINT_SHOTS_DECIDE !== "1" || (await note.count()) === 0) return;
  await note.fill("Test decision from the frontend audit of step 19, to be reverted.");
  await page.getByRole("button", { name: "Defer" }).click();
  await page.waitForURL(/decision=defer/, { timeout: 15000 });
  await page.locator("#decision").scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
}, { path: "/markets/us/g60/requirements/req-g60-us-pr-03" });
await shoot("37-log-us-g60-after-1440", desktop, async (page) => {
  await page.locator(".timeline").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60/log" });
await shoot("38-log-eu-f70-1920", wide, async () => {}, { path: "/markets/eu/f70/log" });

// Step 19: the backend's briefs, the series across its regions, the market evidence.
const phone = { width: 375, height: 812 };
async function openFirst(page, selector) {
  await page.locator(selector).first().click();
  await page.waitForTimeout(250);
}
await shoot("39-brief-us-g60-1440", desktop, async (page) => {
  await page.locator("#brief-heading").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60/structure" });
await shoot("40-brief-us-g60-proposal-1440", desktop, async (page) => {
  await openFirst(page, ".brief-table .candidate-summary");
  await openFirst(page, ".brief-table .refs-summary");
  await page.locator(".brief-table .candidate-details[open]").first().scrollIntoViewIfNeeded();
}, { path: "/markets/us/g60/structure" });
await shoot("41-brief-us-g60-customers-1440", desktop, async (page) => {
  await page.getByRole("heading", { name: "What customers say" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60/structure" });
await shoot("42-regions-us-g60-1440", desktop, async () => {}, { path: "/markets/us/g60/regions" });
await shoot("43-regions-us-g60-decisions-1440", desktop, async (page) => {
  await openFirst(page, ".brief-table .candidate-summary");
  await page.getByRole("heading", { name: "Decisions" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60/regions" });
await shoot("44-regions-cn-g68-375", phone, async () => {}, { path: "/markets/cn/g68/regions" });
await shoot("45-market-cn-g68-1440", desktop, async () => {}, { path: "/markets/cn/g68/market" });
await shoot("46-dialog-cn-g68-software-1440", desktop, async (page) => openSubsystem(page, "Software/HMI"), { path: "/markets/cn/g68" });
await shoot("47-dialog-us-g60-seats-market-1440", desktop, async (page) => {
  await openSubsystem(page, "Seats");
  await page.locator("#cpm-market").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60" });
await shoot("48-vehicle-eu-g70-1440", desktop, async () => {}, { path: "/markets/eu/g70" });
await shoot("49-method-us-g60-rules-1440", desktop, async (page) => {
  await page.getByRole("heading", { name: "Rules of the engine" }).scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}, { path: "/markets/us/g60/priorities/method" });

// Step 20: the motion between the screens. The car on its way into the header's corner and back,
// a stage's content arriving under the header that stays, the corner car with keyboard focus,
// the header on a phone (no corner car there).
await shoot("50-dock-moving-us-g60-1440", desktop, async (page) => {
  await page.locator('.stage-link[href="/markets/us/g60/structure"]').click();
  await page.waitForTimeout(220);
}, { path: "/markets/us/g60" });
await shoot("51-undock-moving-us-g60-1440", desktop, async (page) => {
  await page.locator(".workspace-dock").click();
  await page.waitForTimeout(220);
}, { path: "/markets/us/g60/structure" });
await shoot("52-stage-arriving-us-g60-1440", desktop, async (page) => {
  await page.locator('.stage-link[href="/markets/us/g60/requirements"]').click();
  await page.waitForTimeout(120);
}, { path: "/markets/us/g60/structure" });
await shoot("53-dock-focus-us-g60-1440", desktop, async (page) => {
  await page.locator(".workspace-dock").focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await page.waitForTimeout(250);
}, { path: "/markets/us/g60/requirements" });
await shoot("54-structure-us-g60-375", phone, async () => {}, { path: "/markets/us/g60/structure" });

await browser.close();
