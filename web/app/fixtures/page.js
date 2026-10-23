// All fixtures, grouped by date. Simple list — no dead nav links.
import { getHomeMatches, getAllSeries } from "@/lib/queries";
import { istDateKey } from "@/lib/format";
import FilterChips from "@/components/FilterChips";
import DateStrip from "@/components/DateStrip";
import MatchCard from "@/components/MatchCard";
import CompactMatchRow from "@/components/CompactMatchRow";
import FixturesViewToggle from "@/components/FixturesViewToggle";

export const revalidate = 60;
export const metadata = { title: "All Cricket Fixtures — CricCast" };

function dayKey(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "Asia/Kolkata",
  });
}

export default async function Fixtures({ searchParams }) {
  const sp = await searchParams;
  const seriesId = sp?.series || undefined;
  const dateSel = sp?.date || undefined; // YYYY-MM-DD in IST
  const view = sp?.view === "series" ? "series" : "date"; // v61 toggle
  const [{ matches }, { series }] = await Promise.all([
    getHomeMatches({ seriesId }),
    getAllSeries(),
  ]);

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
      </div>
    </div>
  );
}
