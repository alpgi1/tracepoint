import localFont from "next/font/local";

/*
 * Self-hosted subsets, shared with the sister projects (built by their font
 * pipeline; OFL texts alongside). Archivo variable carries width 62 to 100
 * and weight 400 to 900 in one file, the display cut is the condensed
 * uppercase wordmark, Geist Mono carries the labels.
 */
export const archivoDisplay = localFont({
  src: "./fonts/archivo-display.woff2",
  weight: "800",
  variable: "--font-archivo-display",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62%" }],
  fallback: ["Arial Narrow", "Arial", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const archivo = localFont({
  src: "./fonts/archivo-var.woff2",
  weight: "400 900",
  variable: "--font-archivo",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "62% 100%" }],
  fallback: ["Arial", "Helvetica", "sans-serif"],
  adjustFontFallback: "Arial",
});

export const geistMono = localFont({
  src: "./fonts/geist-mono.woff2",
  weight: "400 600",
  variable: "--font-geist-mono",
  display: "swap",
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
  adjustFontFallback: false,
});
