/**
 * Copies the world topology used by the landing globe from the `world-atlas`
 * package into `public/globe/` so the browser can fetch it from our own
 * origin. Runs before `dev` and `build` (see package.json) so the file always
 * matches the installed package version; `public/globe/*.json` is git-ignored.
 *
 * Source: Natural Earth 1:110m admin-0 boundaries (public domain), packaged as
 * TopoJSON by world-atlas (ISC). The file carries both the `countries` and the
 * merged `land` geometry collections.
 */
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const source = join(root, "node_modules", "world-atlas", "countries-110m.json");
const target = join(root, "public", "globe", "countries-110m.json");
const manifest = join(root, "public", "globe", "README.txt");

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);

const { version } = JSON.parse(readFileSync(join(root, "node_modules", "world-atlas", "package.json"), "utf8"));
writeFileSync(
  manifest,
  [
    `countries-110m.json is copied from world-atlas@${version} by scripts/sync-globe-data.mjs.`,
    "Data: Natural Earth 1:110m cultural vectors (public domain). Packaging: ISC, Michael Bostock.",
    "Do not edit by hand; it is regenerated before every dev and build run.",
    "",
  ].join("\n"),
);

const kb = Math.round(statSync(target).size / 1024);
console.log(`globe data: world-atlas@${version} -> public/globe/countries-110m.json (${kb} KB)`);
