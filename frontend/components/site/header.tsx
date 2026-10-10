import Link from "next/link";
import { site } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="mx-auto flex h-16 max-w-(--container-site) items-center justify-between px-gutter">
      <Link href="/" className="wordmark tap inline-flex items-center text-[1.35rem] leading-none text-chalk" aria-label={`${site.name}, home`}>
        {site.name}
      </Link>
      <p className="eyebrow text-chalk-3">
        {site.header.status} · {site.header.year}
      </p>
    </header>
  );
}
