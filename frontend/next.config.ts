import type { NextConfig } from "next";

// `pnpm export:static` builds the static showcase (GitHub Pages): no server, the stored data only.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  // Partial prerendering has no place in a static export: there every page is prerendered whole.
  cacheComponents: !staticExport,
  partialPrefetching: !staticExport,
  ...(staticExport ? { output: "export" as const, basePath, trailingSlash: true, images: { unoptimized: true } } : {}),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
    ...(staticExport ? { resolveAlias: { "@/app/actions/decide": "./lib/static-decide.ts" } } : {}),
  },
};

export default nextConfig;
