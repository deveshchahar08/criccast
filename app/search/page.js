// SEARCH — server-rendered results, no JS needed.
// One unified search (trial-12, Hy's call): the same shared matcher
// (lib/search.js — every word in the query must appear somewhere)
// feeds this page and the in-page overlay/hero panels, and this page
// shows ALL groups in the same order — Matches first, then Series,
// then News — so a query like "India" lists India matches first and
// the related news right below them.
import Link from "next/link";
import { searchSite } from "@/lib/search";
import CompactMatchRow from "@/components/CompactMatchRow";
import NewsRow from "@/components/NewsRow";

export const metadata = { title: "Search matches, series and news — CricCast" };
export const revalidate = 60;

const sectionTitle =
  "pt-5 text-base font-extrabold tracking-tight text-navy md:text-lg dark:text-white";

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const raw = (sp?.q || "").trim();

  const { matches, series, news } = raw
    ? await searchSite(raw, {
        matchLimit: Infinity,
        seriesLimit: Infinity,
        newsLimit: Infinity,
      })
    : { matches: [], series: [], news: [] };

  const total = matches.length + series.length + news.length;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-5 md:max-w-4xl">
      <h1 className="text-xl font-extrabold tracking-tight text-navy dark:text-white">Search</h1>

      {/* DESIGN.md search bar: pill, 1.5px border, sky focus ring */}
      <form method="GET" action="/search" className="mt-3 flex gap-2" role="search">
        <input
          name="q"
          defaultValue={raw}
          placeholder="Find match, team, tournament…"
          autoComplete="off"
          className="w-full rounded-full border-[1.5px] border-slate-200 bg-white px-4 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:shadow-[0_0_0_3px_rgba(2,132,199,0.15)] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-700"
        >
          Search
        </button>
      </form>

      {raw !== "" && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {total === 0
            ? `No results found for "${raw}".`
            : `${total} result${total > 1 ? "s" : ""} for "${raw}"`}
        </p>
      )}

      {matches.length > 0 && (
        <section aria-label="Matching matches">
          <h2 className={sectionTitle}>Matches</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {matches.map((m) => (
              <CompactMatchRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {series.length > 0 && (
        <section aria-label="Matching series">
          <h2 className={sectionTitle}>Series</h2>
          <div className="mt-3 flex flex-col gap-2">
            {series.map((s) => (
              <Link
                key={s.id}
                href={`/series/${s.slug}`}
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-card transition hover:border-sky-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-800"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold tracking-tight text-navy dark:text-white">
                    {s.name}
                  </span>
                  {[s.format, s.season].filter(Boolean).length > 0 && (
                    <span className="block text-xs font-bold text-slate-400 dark:text-slate-500">
                      {[s.format, s.season].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-sky-600 dark:text-sky-400">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </section>
      )}

      {news.length > 0 && (
        <section aria-label="Matching news" className="pb-4">
          <h2 className={sectionTitle}>News</h2>
          <div className="mt-3 flex flex-col gap-3">
            {news.map((p) => (
              <NewsRow key={p.slug} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* Bottom breathing room when the last section isn't News */}
      {news.length === 0 && <div className="pb-4" />}
    </div>
  );
}
