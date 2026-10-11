/**
 * The static showcase build (`pnpm export:static`, GitHub Pages): no request
 * time, no backend, the stored data only, every asset under the base path
 * the site is served from. Read at build time.
 */
// NEXT_PUBLIC_, so client components see it too.
export const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === "1";

/** A link's prefetch of its own URL; a static host has no server to answer it, so the default prefetch there. */
export const FULL_PREFETCH: true | undefined = STATIC_EXPORT ? undefined : true;

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** A file of public/ at the path the site is served from. */
export function asset(path: string): string {
  return path.startsWith("/") ? `${BASE_PATH}${path}` : path;
}

/** The query of a page; the static build has none. */
export async function pageQuery<T extends Record<string, string | string[] | undefined>>(searchParams: Promise<T>): Promise<Partial<T>> {
  return STATIC_EXPORT ? {} : searchParams;
}
