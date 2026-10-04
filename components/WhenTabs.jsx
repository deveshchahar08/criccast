import Link from "next/link";

// Live / Today / Tomorrow tabs (Hy's desktop design, right of the filter chips).
// Server-rendered links (?when=…) — zero JS, SEO-friendly.
export default function WhenTabs({ live, today, tomorrow, active, seriesId, freeOnly }) {
  const base = (params) => {
    const q = new URLSearchParams();
    if (seriesId) q.set("series", seriesId);
    if (freeOnly) q.set("free", "1");
    for (const [k, v] of Object.entries(params)) q.set(k, v);
    const s = q.toString();
    return s ? `/?${s}` : "/";
  };

  const tabs = [
    { id: "live", label: `Live (${live})`, dot: true },
    { id: "today", label: `Today (${today})` },
    { id: "tomorrow", label: `Tomorrow (${tomorrow})` },
  ];

  return (
    <div className="no-scrollbar flex shrink-0 gap-2 overflow-x-auto px-4 py-1 md:px-0 md:py-3">
      {tabs.map((t) => {
        const isActive = active === t.id;
        return (
          <Link
            key={t.id}
            href={isActive ? base({}) : base({ when: t.id })}
            className={`flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              isActive
                ? "bg-sky-600 text-white shadow-card"
                : "border border-slate-200 bg-white text-slate-600 hover:border-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {t.dot && (
              <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "animate-pulse bg-white" : "bg-red-500"}`} />
            )}
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
