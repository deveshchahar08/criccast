"use client";
// Fixtures view toggle (v61): Date wise (default) / Series wise.
// Link-based like the site's other filters; switching to Series wise fires
// a GA4 event so usage can be measured (Reports → Events in GA4).
import Link from "next/link";

export default function FixturesViewToggle({ view, seriesId, dateSel }) {
  const hrefFor = (v) => {
    const p = new URLSearchParams();
    if (seriesId) p.set("series", seriesId);
    if (dateSel) p.set("date", dateSel);
    if (v === "series") p.set("view", "series");
    const qs = p.toString();
    return qs ? `/fixtures?${qs}` : "/fixtures";
  };
  const cls = (active) =>
    `rounded-full px-3 py-1 text-xs font-bold ${
      active
        ? "bg-navy text-white"
        : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
    }`;
  return (
    <div className="flex shrink-0 rounded-full border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900">
      <Link href={hrefFor("date")} className={cls(view === "date")}>
        Date wise
      </Link>
      <Link
        href={hrefFor("series")}
        className={cls(view === "series")}
        onClick={() => {
          try {
            window.gtag?.("event", "fixtures_series_view");
          } catch {}
        }}
      >
        Series wise
      </Link>
    </div>
  );
}
