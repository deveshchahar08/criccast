import Link from "next/link";

// Series filter chips. Server-rendered links (?series=…) so filtering works
// with zero JS and stays SEO-friendly. Preserves the when/free filters.
export default function FilterChips({ series, activeSeriesId, freeOnly, when }) {
  const href = (params) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };
  const withWhen = (params) => href({ ...params, ...(when ? { when } : {}) });

  const chip = (active) =>
    `shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
      active
        ? "bg-navy text-white shadow-card dark:bg-sky-600"
        : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
    }`;

  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 py-3 md:px-0">
      <Link href={withWhen({})} className={chip(!activeSeriesId && !freeOnly)}>
        All Fixtures
      </Link>
      {series.map((s) => (
        <Link
          key={s.id}
          href={withWhen({ series: s.id })}
          className={chip(activeSeriesId === s.id)}
        >
          {s.name}
        </Link>
      ))}
      <Link
        href={withWhen(freeOnly ? {} : { free: "1" })}
        className={`${chip(freeOnly)} flex items-center gap-1.5`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
        Free to Watch
      </Link>
    </div>
  );
}
