import type { Metadata, Viewport } from "next";
import { archivo, archivoDisplay, geistMono } from "./fonts";
import "./globals.css";
import { site } from "@/lib/site";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";

const TITLE = `${site.name}, ${site.tagline.toLowerCase()}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: { default: TITLE, template: `%s · ${site.name}` },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: site.description,
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: site.name,
  },
  twitter: { card: "summary_large_image", title: TITLE, description: site.description },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0e1013",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`no-js ${archivoDisplay.variable} ${archivo.variable} ${geistMono.variable}`}>
      <head>
        {/* Entrance animations only when JS is present: the class flips before first paint, so without JS everything is simply visible. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "document.documentElement.classList.replace('no-js','js')",
          }}
        />
      </head>
      <body className="bg-night text-chalk">
        <a
          href="#main"
          className="eyebrow tap fixed left-4 top-4 z-50 inline-flex -translate-y-24 items-center rounded-full bg-chalk px-4 text-night focus:translate-y-0"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
