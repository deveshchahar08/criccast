"use client";
// The featured match card (Pic 2 design). Vertical, full broadcast info.
// Client component because the TV channel NUMBER depends on the selected
// DTH operator (context). Server still renders the first pass (default Tata Play).
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDth } from "./DthProvider";
import { DTH_OPERATORS } from "@/lib/dth";
import { teamColor } from "@/lib/dth";
import { formatTimeIST } from "@/lib/format";
import Countdown from "./Countdown";
import VerifiedBadge from "./VerifiedBadge";

function TeamCircle({ short }) {
  return (
    <span
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold text-white"
      style={{ backgroundColor: teamColor(short) }}
    >
      {short}
    </span>
  );
}

function StatusBadge({ match }) {
  if (match.status === "live") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-red-600 dark:bg-red-950 dark:text-red-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
        LIVE
      </span>
    );
  }
  if (match.status === "finished") {
    return (
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
        {match.resultText || "Finished"}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-bold text-sky-700 dark:bg-sky-950 dark:text-sky-300">
      <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 3" strokeLinecap="round" />
      </svg>
      {formatTimeIST(match.startTime)} IST
    </span>
  );
}

export default function MatchCard({ match }) {
  const { dth } = useDth();
  const router = useRouter();
  const operator = DTH_OPERATORS.find((o) => o.id === dth);
  const b = match.broadcast || { tvChannels: [], ottPlatforms: [] };
  const [t1, t2] = match.teams;
  const [s1, s2] = match.shortNames?.length === 2 ? match.shortNames : [t1?.slice(0, 3).toUpperCase(), t2?.slice(0, 3).toUpperCase()];

  // Whole card opens the detail page — except real links/buttons inside
  // (Watch buttons), which keep their own behaviour.
  const openDetail = (e) => {
    if (e.target.closest("a,button")) return;
    router.push(`/match/${match.id}`);
  };

  return (
    <article onClick={openDetail} className="cursor-pointer rounded-2xl border-2 border-dashed border-sky-200 bg-white p-4 shadow-card dark:border-slate-700 dark:bg-slate-900">
      {/* Header: series • number … status */}
      <div className="mb-3 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide text-slate-500 dark:text-slate-400">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 21h8M12 17v4M17 4H7v5a5 5 0 0010 0V4z" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M17 6h3a1 1 0 011 1c0 2.5-2 4-4 4" strokeLinecap="round" />
            <path d="M7 6H4a1 1 0 00-1 1c0 2.5 2 4 4 4" strokeLinecap="round" />
          </svg>
          {match.seriesName} {match.matchNumber ? `• ${match.matchNumber}` : ""}
        </p>
        <StatusBadge match={match} />
      </div>

      {/* Teams */}
      <div className="block">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <TeamCircle short={s1} />
            <div>
              <p className="font-extrabold text-navy dark:text-white">{t1}</p>
            </div>
          </div>
          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            VS
          </span>
          <div className="flex items-center gap-2.5 text-right">
            <div>
              <p className="font-extrabold text-navy dark:text-white">{t2}</p>
            </div>
            <TeamCircle short={s2} />
          </div>
        </div>

        <div className="mt-2 flex items-center justify-between text-[13px]">
          <p className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {match.city || match.venue}
          </p>
          <VerifiedBadge verifiedAt={match.verifiedAt} />
        </div>
      </div>

      {/* Countdown for upcoming */}
      {match.status === "scheduled" && (
        <p className="mt-2 flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 dark:text-slate-300">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 3" strokeLinecap="round" />
          </svg>
          <Countdown startTime={match.startTime} />
          <span className="ml-auto text-[11px] font-bold text-slate-400 dark:text-slate-500">4K HDR Live</span>
        </p>
      )}

      {/* Watch options */}
      <div className="mt-3 space-y-2.5 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
        {(b.ottPlatforms || []).map((ott) => (
          <div key={ott.name} className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy dark:bg-sky-600">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-1.5 text-sm font-bold text-navy dark:text-white">
                {ott.name}
                {ott.freeNote && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-extrabold ${
                      ott.free ? "bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-300" : "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-300"
                    }`}
                  >
                    {ott.freeNote}
                  </span>
                )}
              </p>
              {(ott.languages?.length > 0) && (
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">{ott.languages.join(", ")}</p>
              )}
            </div>
            {ott.url ? (
              <a
                href={ott.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 rounded-full bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
              >
                Watch ↗
              </a>
            ) : (
              <Link
                href={`/match/${match.id}`}
                className="shrink-0 rounded-full bg-sky-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-sky-700"
              >
                Watch ↗
              </Link>
            )}
          </div>
        ))}

        {(b.tvChannels || []).map((ch) => {
          const num = ch.numbers?.[dth];
          return (
            <div key={ch.name} className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="4" width="20" height="13" rx="2" />
                <path d="M8 21h8" strokeLinecap="round" />
              </svg>
              <p className="flex-1 text-sm font-semibold text-slate-700 dark:text-slate-200">{ch.name}</p>
              {num ? (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-600 dark:text-slate-300">{operator.label}</span>{" "}
                  Ch{" "}
                  <span className="tabular-nums rounded bg-white px-1.5 py-0.5 font-extrabold text-slate-800 shadow-card dark:bg-slate-700 dark:text-slate-100">
                    {num}
                  </span>
                </span>
              ) : (
                <span className="text-[11px] text-slate-400 dark:text-slate-500">{operator.label} N/A</span>
              )}
            </div>
          );
        })}

        {(b.tvChannels || []).length === 0 && (b.ottPlatforms || []).length === 0 && (
          <p className="text-[13px] text-slate-500 dark:text-slate-400">
            Broadcast info not mapped yet — check back soon.
          </p>
        )}
      </div>

      {/* Digital-only notice (e.g. FanCode exclusive, no TV telecast) */}
      {match.digitalOnly && (
        <p className="mt-2.5 flex items-start gap-2 rounded-xl bg-sky-100/70 p-3 text-[13px] leading-snug text-slate-700 dark:bg-sky-950 dark:text-slate-300">
          <svg viewBox="0 0 24 24" className="mt-0.5 h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8v.1" strokeLinecap="round" />
          </svg>
          <span>
            <strong>Digital Only:</strong> {match.digitalOnlyNote || "No linear TV telecast in India."}
          </span>
        </p>
      )}
    </article>
  );
}
