/**
 * The static showcase: `pnpm export:static [basePath]` builds the app as
 * plain files into ../dist for GitHub Pages (default base path /tracepoint,
 * the repository's Pages address; pass "" for a root domain). The stored
 * data only, no backend; the two download routes of stage 5 are written as
 * files from the stored exports, since a static site has no route handlers.
 */
import { execSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const base = process.argv[2] ?? "/tracepoint";
const root = process.cwd();
const dist = join(root, "..", "dist");
const parked = join(root, ".static-parked");
const routes = ["requirements.csv", "requirements.md"].map((name) => join(root, "app", "markets", "[market]", "[vehicle]", "log", name));

rmSync(parked, { recursive: true, force: true });
mkdirSync(parked);
routes.forEach((dir, i) => renameSync(dir, join(parked, String(i))));
try {
  execSync("next build", { stdio: "inherit", env: { ...process.env, STATIC_EXPORT: "1", NEXT_PUBLIC_STATIC_EXPORT: "1", NEXT_PUBLIC_BASE_PATH: base } });
} finally {
  routes.forEach((dir, i) => renameSync(join(parked, String(i)), dir));
  rmSync(parked, { recursive: true, force: true });
}

rmSync(dist, { recursive: true, force: true });
cpSync(join(root, "out"), dist, { recursive: true });
writeFileSync(join(dist, ".nojekyll"), "");
for (const file of readdirSync(join(root, "content", "workspace"))) {
  const snapshot = JSON.parse(readFileSync(join(root, "content", "workspace", file), "utf8"));
  if (!snapshot.exports) continue;
  const dir = join(dist, "markets", snapshot.market.toLowerCase(), snapshot.vehicle.toLowerCase(), "log");
  for (const format of ["csv", "md"]) {
    if (!snapshot.exports[format]) continue;
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `requirements.${format}`), snapshot.exports[format]);
  }
}
console.log(`static showcase in ${dist} (base path "${base}")${existsSync(join(dist, "index.html")) ? "" : " WITHOUT index.html"}`);
