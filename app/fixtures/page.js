// All fixtures, grouped by date. Simple list — no dead nav links.
import { getHomeMatches, getAllSeries } from "@/lib/queries";
import { istDateKey } from "@/lib/format";
import FilterChips from "@/components/FilterChips";
import DateStrip from "@/components/DateStrip";
import MatchCard from "@/components/MatchCard";
import CompactMatchRow from "@/components/CompactMatchRow";

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
  const [{ matches }, { series }] = await Promise.all([
    getHomeMatches({ seriesId }),
    getAllSeries(),
  ]);

  const visible = dateSel
    ? matches.filter((m) => istDateKey(m.startTime) === dateSel)
    : matches;

  const groups = {};
  visible.forEach((m) => {
    const k = dayKey(m.startTime);
    (groups[k] ||= []).push(m);
  });

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
      <h1 className="px-4 pt-5 text-xl font-extrabold tracking-tight text-navy dark:text-white">
        Fixtures
      </h1>
      <DateStrip selected={dateSel} seriesId={seriesId} />
      <FilterChips series={series} activeSeriesId={seriesId} />
      <div className="space-y-5 px-4 pb-4">
        {dateSel && (
          <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {selLabel}
          </h2>
        )}
        {Object.entries(groups).map(([day, list]) => (
          <section key={day} className="space-y-3">
            {!dateSel && (
              <h2 className="text-sm font-extrabold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {day}
              </h2>
            )}
            <div className="grid gap-3 md:grid-cols-2">
              {list.map((m) =>
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
