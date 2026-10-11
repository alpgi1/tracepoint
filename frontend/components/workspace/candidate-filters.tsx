import Link from "next/link";
import { site } from "@/lib/site";
import type { CandidateFilter, CandidateView } from "@/lib/workspace/candidates";

/*
 * Stage 2: the view switch and the filter row. Both work without script:
 * the views are links that keep the filters, the filters are a GET form
 * with four selects and an Apply control (no submit on change, which would
 * navigate under a keyboard user stepping through the options). Method
 * after the tabs with a count of the 21st.dev survey (coss "tabs with
 * count badge", Origin UI "tabs with line"; research notes 6.3): the count
 * is text beside the name, not a badge; the current view carries the one
 * blue rule and aria-current. A view or a cleared filter is the same
 * screen with a new query: its content swaps at once, without the arrival
 * of a new screen (Reveal, step 20).
 */
export interface FilterOption {
  value: string;
  label: string;
}

export interface CandidateFiltersProps {
  pathname: string;
  view: CandidateView;
  filter: CandidateFilter;
  counts: Record<CandidateView, number>;
  options: { domain: FilterOption[]; subsystem: FilterOption[]; horizon: FilterOption[]; status: FilterOption[] };
}

const FIELDS: (keyof CandidateFilter)[] = ["domain", "subsystem", "horizon", "status"];

export function viewHref(pathname: string, view: CandidateView, filter: CandidateFilter): string {
  const params = new URLSearchParams();
  if (view !== "inbox") params.set("view", view);
  for (const field of FIELDS) {
    const value = filter[field];
    if (value) params.set(field, value);
  }
  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}

export function CandidateFilters({ pathname, view, filter, counts, options }: CandidateFiltersProps) {
  const copy = site.structure;
  const active = FIELDS.some((field) => Boolean(filter[field]));
  const views: CandidateView[] = ["inbox", "all", "excluded"];
  return (
    <>
      <nav className="view-tabs" aria-label={copy.viewsLabel}>
        {views.map((v) => (
          <Link key={v} href={viewHref(pathname, v, filter)} className="view-tab" aria-current={v === view ? "page" : undefined}>
            {copy.views[v]}
            <span className="view-count">{String(counts[v])}</span>
          </Link>
        ))}
      </nav>
      {view !== "excluded" ? (
        <form className="filter-form" method="get" action={pathname} aria-label={copy.filters.label}>
          {view !== "inbox" ? <input type="hidden" name="view" value={view} /> : null}
          {FIELDS.map((field) => (
            <label key={field} className="filter-field">
              {copy.filters[field]}
              <select name={field} defaultValue={filter[field] ?? ""}>
                <option value="">{copy.filters.any}</option>
                {options[field].map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button type="submit" className="filter-apply">
            {copy.filters.apply}
          </button>
          {active ? (
            <Link href={viewHref(pathname, view, {})} className="filter-clear">
              {copy.filters.clear}
            </Link>
          ) : null}
        </form>
      ) : null}
    </>
  );
}
