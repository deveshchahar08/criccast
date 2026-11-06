// All fixtures, grouped by date. Simple list — no dead nav links.
import Link from "next/link";
import { getHomeMatches, getAllSeries, getFixturesPage } from "@/lib/queries";
import { istDateKey } from "@/lib/format";
import FilterChips from "@/components/FilterChips";
import DateStrip from "@/components/DateStrip";
import MatchCard from "@/components/MatchCard";
import CompactMatchRow from "@/components/CompactMatchRow";
import FixturesViewToggle from "@/components/FixturesViewToggle";

export const revalidate = 120;
export const metadata = { title: "All Cricket Fixtures — CricCast" };

function dayKey(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });
}

// Pagination bar, same pattern as /news/all (v67): first, last, and a
// window around the current page, "…" filling the gaps.
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

const cellBase =
  "flex min-w-11 items-center justify-center px-3 py-2.5 text-[15px] font-semibold";

function FixturesPagination({ current, total, view }) {
  if (total <= 1) return null;
  const last = total;
  const pageHref = (p) =>
    view === "series"
      ? p <= 1
        ? "/fixtures?view=series"
        : `/fixtures?view=series&page=${p}`
      : p <= 1
        ? "/fixtures"
        : `/fixtures?page=${p}`;
  const cell = (content, page, { disabled = false, active = false, label } = {}) =>
    disabled ? (
      <span
        key={label}
        aria-disabled="true"
        className={`${cellBase} cursor-not-allowed text-slate-300 dark:text-slate-600`}
      >
        {content}
      </span>
    ) : (
      <Link
        key={label}
        href={pageHref(page)}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`${cellBase} ${
          active
            ? "font-extrabold text-navy dark:text-white"
            : "text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-800"
        }`}
      >
        {content}
      </Link>
    );

  return (
    <nav aria-label="Fixtures pages" className="mt-8 flex justify-center">
      <div className="flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
        {cell("«", 1, { disabled: current === 1, label: "First page" })}
        {cell("‹", current - 1, { disabled: current === 1, label: "Previous page" })}
        {pageWindow(current, total).map((n, i) =>
          n === "…"
            ? cell("…", null, { disabled: true, label: `gap-${i}` })
            : cell(String(n), n, { active: n === current, label: `Page ${n}` })
        )}
        {cell("›", current + 1, { disabled: current === last, label: "Next page" })}
        {cell("»", last, { disabled: current === last, label: "Last page" })}
      </div>
    </nav>
  );
}

export default async function Fixtures({ searchParams }) {
  const sp = await searchParams;
  const seriesId = sp?.series || undefined;
  const dateSel = sp?.date || undefined; // YYYY-MM-DD in IST
  const view = sp?.view === "series" ? "series" : "date"; // v61 toggle
  const wanted = Number.parseInt(sp?.page, 10);
  const pageReq = Number.isFinite(wanted) && wanted > 0 ? wanted : 1;

  // v67: browse mode (no series or date picked) is paginated by whole
  // day/series groups via getFixturesPage, so far-future fixtures are
  // no longer cut by the home feed's 200 cap. A picked series or date
  // is a narrowed view — it keeps its full list, uncapped, no pages.
  const browse = !seriesId && !dateSel;
  const [{ series }, data] = await Promise.all([
    getAllSeries(),
    browse
      ? getFixturesPage({ page: pageReq, view })
      : getHomeMatches({ seriesId, limit: 5000 }),
  ]);
  const matches = data.matches;
  const pagination = browse ? { page: data.page, totalPages: data.totalPages } : null;

  const visible = dateSel
    ? matches.filter((m) => istDateKey(m.startTime) === dateSel)
    : matches;

  // Sections for the list: grouped by day (default) or by series (v61
  // toggle). Matches arrive soonest-first, so groups appear in the order
  // of their earliest match either way.
  let sections;
  if (view === "series") {
    const bySeries = new Map();
    visible.forEach((m) => {
      const key = m.seriesId || m.seriesName || "other";
      if (!bySeries.has(key))
        bySeries.set(key, { label: m.seriesName || "Other matches", list: [] });
      bySeries.get(key).list.push(m);
    });
    sections = [...bySeries.values()];
  } else {
    const groups = {};
    visible.forEach((m) => {
      const k = dayKey(m.startTime);
      (groups[k] ||= []).push(m);
    });
    sections = Object.entries(groups).map(([label, list]) => ({ label, list }));
  }

  // Pretty label for the selected date, e.g. "Thursday, 1 October"
  const selLabel = dateSel
    ? new Date(`${dateSel}T00:00:00+05:30`).toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: "Asia/Kolkata",
      })
    : null;

  return (
    <div className="mx-auto max-w-2xl md:max-w-4xl lg:max-w-6xl">
      <div className="flex items-center justify-between gap-3 px-4 pt-5">
        <h1 className="text-xl font-extrabold tracking-tight text-navy dark:text-white">
          Fixtures
        </h1>
        <FixturesViewToggle view={view} seriesId={seriesId} dateSel={dateSel} />
      </div>
      <DateStrip selected={dateSel} seriesId={seriesId} />
      <FilterChips series={series} activeSeriesId={seriesId} />
      <div className="space-y-5 px-4 pb-4">
        {dateSel && (
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {selLabel}
          </h2>
        )}
        {sections.map((sec) => (
          <section key={sec.label} className="space-y-3">
            {(view === "series" || !dateSel) && (
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {sec.label}
              </h2>
            )}
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {sec.list.map((m) =>
                m.status === "live" ? (
                  <div key={m.id} className="md:col-span-2">
                    <MatchCard match={m} />
                  </div>
                ) : (
                  <CompactMatchRow key={m.id} match={m} />
                )
              )}
            </div>
          </section>
        ))}
        {visible.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            {dateSel ? "No matches on this date." : "No fixtures found."}
          </p>
        )}
        {pagination && (
          <FixturesPagination current={pagination.page} total={pagination.totalPages} view={view} />
        )}
      </div>
    </div>
  );
}
