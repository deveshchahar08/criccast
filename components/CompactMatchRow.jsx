"use client";
// Compact match row for "More Matches" (Pic 2 lower section).
// One glance: when, who, where to watch. Tapping opens the detail page.
import Link from "next/link";
import { useDth } from "./DthProvider";
import { DTH_OPERATORS, teamColor } from "@/lib/dth";
import { formatDayTimeIST } from "@/lib/format";

export default function CompactMatchRow({ match }) {
  const { dth } = useDth();
  const operator = DTH_OPERATORS.find((o) => o.id === dth);
  const b = match.broadcast || { tvChannels: [], ottPlatforms: [] };
  const [t1, t2] = match.teams;
  const [s1, s2] =
    match.shortNames?.length === 2
      ? match.shortNames
      : [t1?.slice(0, 3).toUpperCase(), t2?.slice(0, 3).toUpperCase()];
  const firstOtt = (b.ottPlatforms || [])[0];
  // First TV channel number available on the selected operator
  const tvWithNum = (b.tvChannels || []).find((c) => c.numbers?.[dth]);
  const tvNames = (b.tvChannels || []).map((c) => c.name.replace(" HD", "")).join(" & ");

  return (
    <Link
      href={`/match/${match.id}`}
      className="block rounded-2xl border border-slate-100 bg-white p-3.5 shadow-card transition hover:border-sky-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-800"
    >
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-[11px] font-bold tracking-wide text-slate-500 dark:text-slate-400">
          {match.seriesName} {match.matchNumber ? `• ${match.matchNumber}` : ""}
        </p>
        <p className="text-[11px] font-extrabold text-sky-600 dark:text-sky-400">
          {formatDayTimeIST(match.startTime)}
        </p>
      </div>

      <div className="mb-1.5 flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-1.5 font-extrabold text-navy dark:text-white">
          <span
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white"
            style={{ backgroundColor: teamColor(s1) }}
          >
            {s1}
          </span>
          <span
            className="-ml-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-extrabold text-white ring-2 ring-white dark:ring-slate-900"
            style={{ backgroundColor: teamColor(s2) }}
          >
            {s2}
          </span>
          <span className="truncate">
            {t1} <span className="font-semibold text-slate-400">vs</span> {t2}
          </span>
        </p>
        {firstOtt && (
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M10 8.5l5 3.5-5 3.5v-7z" strokeLinejoin="round" />
            </svg>
            {firstOtt.name}
            {firstOtt.free ? " (Free)" : ""}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[13px]">
        <p className="truncate text-slate-500 dark:text-slate-400">
          {tvNames ? `TV: ${tvNames}` : match.venue || ""}
        </p>
        {tvWithNum && (
          <p className="shrink-0 pl-2 text-[12px] font-bold text-emerald-600 dark:text-emerald-400">
            {operator.label} Ch {tvWithNum.numbers[dth]}
          </p>
        )}
      </div>
    </Link>
  );
}
