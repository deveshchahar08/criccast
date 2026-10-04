// Series list — each card links to the home page filtered to that series.
import Link from "next/link";
import { getAllSeries } from "@/lib/queries";

export const revalidate = 300;
export const metadata = { title: "Cricket Series & Broadcast Rights — CricCast" };

export default async function SeriesPage() {
  const { series } = await getAllSeries();

  return (
    <div className="mx-auto max-w-2xl px-4 pt-5 md:max-w-4xl lg:max-w-6xl">
      <h1 className="text-xl font-extrabold tracking-tight text-navy dark:text-white">Series</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Broadcast rights are per-series — pick one to see where its matches air.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {series.map((s) => {
          const ott = (s.broadcast?.ottPlatforms || []).map((o) => o.name).join(" · ");
          const tv = (s.broadcast?.tvChannels || []).map((c) => c.name.replace(" HD", "")).join(" · ");
          return (
            <Link
              key={s.id}
              href={`/?series=${s.id}`}
              className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card transition hover:border-sky-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-800"
            >
              <p className="font-extrabold text-navy dark:text-white">{s.name}</p>
              <p className="mt-0.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {s.format}{s.season ? ` · ${s.season}` : ""}
              </p>
              {(ott || tv) && (
                <p className="mt-2 text-[13px] text-slate-600 dark:text-slate-300">
                  {[ott, tv].filter(Boolean).join("  |  ")}
                </p>
              )}
              <p className="mt-2 text-xs font-bold text-sky-600 dark:text-sky-400">View fixtures →</p>
            </Link>
          );
        })}
        {series.length === 0 && (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            No series yet.
          </p>
        )}
      </div>
    </div>
  );
}
