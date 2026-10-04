import Link from "next/link";
import { istDateKey } from "@/lib/format";

const IST = "Asia/Kolkata";

// 15-day horizontal date strip for the Fixtures page. Server-rendered links
// (?date=YYYY-MM-DD) so filtering works with zero JS and stays SEO-friendly.
// Continuous dates — empty days show "No matches on this date."
// Tapping the selected date again clears the filter.
export default function DateStrip({ selected, seriesId }) {
  const now = new Date();
  const days = [];
  for (let i = 0; i < 15; i++) {
    const d = new Date(now.getTime() + i * 86400000);
    days.push({
      key: istDateKey(d),
      dow: d
        .toLocaleDateString("en-IN", { weekday: "short", timeZone: IST })
        .toUpperCase(),
      num: d.toLocaleDateString("en-IN", { day: "numeric", timeZone: IST }),
      mon: d
        .toLocaleDateString("en-IN", { month: "short", timeZone: IST })
        .toUpperCase(),
      isToday: i === 0,
    });
  }

  const href = (date) => {
    const q = new URLSearchParams();
    if (date) q.set("date", date);
    if (seriesId) q.set("series", seriesId);
    const s = q.toString();
    return s ? `/fixtures?${s}` : "/fixtures";
  };

  const cell = (active) =>
    `flex w-14 shrink-0 flex-col items-center rounded-xl border py-2 transition ${
      active
        ? "border-sky-600 bg-sky-600 text-white shadow-card dark:border-sky-500 dark:bg-sky-600"
        : "border-slate-200 bg-white text-slate-600 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    }`;

  return (
    <div
      aria-label="Filter by date"
      className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-2 md:px-0"
    >
      {days.map((d) => {
        const active = selected === d.key;
        return (
          <Link
            key={d.key}
            href={href(active ? undefined : d.key)}
            aria-current={active ? "date" : undefined}
            className={cell(active)}
          >
            <span className="text-[10px] font-bold tracking-wide opacity-70">
              {d.isToday ? "TODAY" : d.dow}
            </span>
            <span className="text-lg font-extrabold leading-tight tabular-nums">
              {d.num}
            </span>
            <span className="text-[10px] font-semibold opacity-70">{d.mon}</span>
          </Link>
        );
      })}
    </div>
  );
}
