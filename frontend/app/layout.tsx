import type { Metadata, Viewport } from "next";
import { archivo, geistMono } from "./fonts";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: { default: site.title, template: `%s · ${site.name}` },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    title: site.title,
    description: site.description,
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: site.name,
  },
  twitter: { card: "summary", title: site.title, description: site.description },
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  colorScheme: "light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${geistMono.variable}`}>
      <body className="bg-paper text-ink">
        <main>{children}</main>
      </body>
    </html>
  );
}
