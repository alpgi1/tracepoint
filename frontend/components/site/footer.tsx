import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mx-auto flex max-w-(--container-site) flex-col gap-2 border-t border-line px-gutter py-6 text-sm text-chalk-3 md:flex-row md:items-baseline md:justify-between">
      <p>
        <span className="text-chalk-2">{site.name}</span> · {site.footer.line}
      </p>
      <p className="max-w-[60ch] text-pretty">{site.footer.data}</p>
    </footer>
  );
}
