/**
 * Page audit in a real browser (Chromium via Playwright): landmarks and
 * headings, accessible names, keyboard tour with visible focus, tap targets
 * measured (control or its label, whichever is larger), horizontal overflow
 * at 375 px, console errors, and a scan of the rendered text for the
 * forbidden-list items that can be measured. Ported from the sister
 * projects, whose logs name the false alarms this version avoids: measure
 * the larger of control and label, give every tab stop a unique mark, and
 * expect the focus ring only after a real Tab key press.
 *
 * Run against a built app started in another shell:
 *   pnpm build && pnpm start
 *   node tools/audit/page-audit.mjs http://localhost:3400 [/path ...]
 * Exit code 1 when anything is found.
 */
import pkg from "/opt/node22/lib/node_modules/playwright/index.js";

const { chromium } = pkg;
const [BASE = "http://localhost:3400", ...given] = process.argv.slice(2);
const PATHS = given.length > 0 ? given : ["/"];
const MIN_TAP = 44;

/** Measurable items of the forbidden list (docs/frontend/02-forbidden-list.md). */
const FORBIDDEN = [
  [/[—–]/, "em or en dash"],
  [/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u, "emoji"],
  [/!/, "exclamation mark"],
  [/\{|\}/, "unresolved placeholder"],
  [/\bundefined\b|\bNaN\b/, "undefined or NaN"],
  [/\*\*/, "raw markdown"],
  [/Lorem ipsum|John Doe|TODO|FIXME|Coming soon/i, "placeholder text"],
  [/\bsimply\b|\bseamless\b|\bcutting-edge\b|\beffortless\b|\bsupercharge\b|\bunleash\b|\belevate\b/i, "marketing filler"],
  [/SECTION 0\d/, "SECTION 01 label"],
];

async function auditPage(browser, path) {
  const findings = [];
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`);
  });
  const response = await page.goto(BASE + path, { waitUntil: "networkidle" });
  if (response?.status() !== 200) findings.push(`HTTP ${String(response?.status())}`);
  await page.waitForTimeout(500);

  findings.push(
    ...(await page.evaluate(() => {
      const out = [];
      const h1 = document.querySelectorAll("h1");
      if (h1.length !== 1) out.push(`h1 count ${String(h1.length)}`);
      const levels = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) out.push(`heading jump h${String(levels[i - 1])} to h${String(levels[i])}`);
      }
      // The landing page is the map alone: a main landmark is required, header and footer are not.
      if (!document.querySelector("main")) out.push("no <main>");
      if (document.documentElement.lang !== "en") out.push(`lang=${document.documentElement.lang}`);
      for (const img of document.querySelectorAll("img")) {
        if (img.getAttribute("alt") === null) out.push(`img without alt: ${img.getAttribute("src") ?? ""}`);
      }
      for (const canvas of document.querySelectorAll("canvas")) {
        if (!canvas.getAttribute("aria-label") && canvas.getAttribute("aria-hidden") !== "true") out.push("canvas without aria-label");
      }
      for (const el of document.querySelectorAll("a,button")) {
        const name = el.textContent?.trim() ?? "";
        const label = el.getAttribute("aria-label") ?? el.getAttribute("title") ?? "";
        if (name === "" && label === "") out.push(`no accessible name: <${el.tagName.toLowerCase()}>`);
      }
      for (const list of document.querySelectorAll("ul,ol")) {
        for (const child of list.children) {
          if (child.tagName !== "LI") out.push(`<${child.tagName.toLowerCase()}> inside a list`);
        }
      }
      return out;
    })),
  );

  // Tap targets: the larger of the control and its label.
  findings.push(
    ...(await page.evaluate((min) => {
      const out = [];
      const controls = document.querySelectorAll("a,button,input,select,textarea,[role=button]");
      for (const el of controls) {
        const rects = [el.getBoundingClientRect()];
        const label = el.id ? document.querySelector(`label[for="${el.id}"]`) : el.closest("label");
        if (label) rects.push(label.getBoundingClientRect());
        const w = Math.max(...rects.map((r) => r.width));
        const h = Math.max(...rects.map((r) => r.height));
        if (w === 0 && h === 0) continue; // hidden
        if (getComputedStyle(el).pointerEvents === "none") continue; // keyboard-only control, not a tap target
        if (w < min || h < min) {
          const name = (el.textContent?.trim() || el.getAttribute("aria-label") || el.tagName).slice(0, 40);
          out.push(`tap target ${String(Math.round(w))}x${String(Math.round(h))} < ${String(min)}: ${name}`);
        }
      }
      return out;
    }, MIN_TAP)),
  );

  // Forbidden text in the rendered page.
  const text = await page.evaluate(() => document.body.innerText);
  for (const [pattern, label] of FORBIDDEN) {
    const match = text.match(pattern);
    if (match) {
      const at = Math.max(0, (match.index ?? 0) - 30);
      findings.push(`forbidden text (${label}): …${text.slice(at, at + 70).replace(/\s+/g, " ")}…`);
    }
  }

  // Keyboard tour: every stop has a visible focus ring, measured after real Tab presses.
  const stops = [];
  await page.keyboard.press("Tab");
  for (let i = 0; i < 40; i++) {
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return null;
      const style = getComputedStyle(el);
      const ring = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
      const shadow = style.boxShadow !== "none";
      el.setAttribute("data-audit-stop", String(Date.now()) + Math.random());
      return {
        name: (el.textContent?.trim() || el.getAttribute("aria-label") || el.tagName).slice(0, 40),
        ring: ring || shadow,
        mark: el.getAttribute("data-audit-stop"),
      };
    });
    if (!info) break;
    if (stops.some((s) => s.mark === info.mark)) break;
    stops.push(info);
    if (!info.ring) findings.push(`no visible focus ring: ${info.name}`);
    await page.keyboard.press("Tab");
  }
  if (stops.length === 0) findings.push("keyboard tour found no stops");

  // Horizontal overflow at 375 px, loaded fresh at that width.
  const narrow = await browser.newContext({ viewport: { width: 375, height: 700 } });
  const narrowPage = await narrow.newPage();
  await narrowPage.goto(BASE + path, { waitUntil: "networkidle" });
  const overflow = await narrowPage.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 0) findings.push(`horizontal overflow at 375 px: ${String(overflow)} px`);
  await narrow.close();

  if (errors.length) findings.push(...errors.map((e) => `console: ${e}`));
  await context.close();
  return { path, findings, stops: stops.length };
}

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
let total = 0;
for (const path of PATHS) {
  const { findings, stops } = await auditPage(browser, path);
  total += findings.length;
  console.log(`${path}: ${String(findings.length)} finding(s), ${String(stops)} keyboard stop(s)`);
  for (const f of findings) console.log(`  - ${f}`);
}
await browser.close();
process.exit(total > 0 ? 1 : 0);
