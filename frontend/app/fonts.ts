import localFont from "next/font/local";

/*
 * Self-hosted subsets shared with the sister projects (OFL texts alongside).
 * Nothing on the landing page shows text, so neither face is preloaded; they
 * download on first use (the focused market label, later surfaces).
 */
export const archivo = localFont({
  src: "./fonts/archivo-var.woff2",
  weight: "400 900",
  variable: "--font-archivo",
  display: "swap",
  preload: false,
  declarations: [{ prop: "font-stretch", value: "62% 100%" }],
  fallback: ["Arial", "Helvetica", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const geistMono = localFont({
  src: "./fonts/geist-mono.woff2",
  weight: "400 600",
  variable: "--font-geist-mono",
  display: "swap",
  preload: false,
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  adjustFontFallback: false,
});
