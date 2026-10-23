// HOME — server component, revalidated every 60s.
// Responsive: phone = single column (Pic 2 scroll design), tablet = 2-col,
// desktop = hero + navbar + 2/3-col grids (Hy's approved Stitch design).
import { getHomeMatches, getAllSeries, getHomeNote, splitFeatured } from "@/lib/queries";
import { dayDiffIST } from "@/lib/format";
import Link from "next/link";
import DthSelector from "@/components/DthSelector";
import FilterChips from "@/components/FilterChips";
import WhenTabs from "@/components/WhenTabs";
import MatchCard from "@/components/MatchCard";
import CompactMatchRow from "@/components/CompactMatchRow";

export const revalidate = 60;

export const metadata = {
  title: "CricCast — Where to Watch Cricket Matches on TV & OTT in India",
  description:
    "Today's cricket matches: which TV channel and OTT app in India. Verified broadcast info with DTH channel numbers.",
};

export default async function Home({ searchParams }) {
  // Next.js 16: searchParams is a Promise — must await.
  const sp = await searchParams;
  const seriesId = sp?.series || undefined;
  const freeOnly = sp?.free === "1";
  const when = sp?.when || undefined; // live | today | tomorrow

  const [{ matches, sample }, { series }, homeNote] = await Promise.all([
    getHomeMatches({ seriesId }),
    getAllSeries(),
    getHomeNote(),
  ]);

  // Base list for tab counts (before the when-filter)
  let base = matches;
  if (freeOnly) {
    base = base.filter((m) => (m.broadcast?.ottPlatforms || []).some((p) => p.free));
  }

  const liveN = base.filter((m) => m.status === "live").length;
  const todayN = base.filter(
    (m) => m.status !== "finished" && dayDiffIST(m.startTime) === 0
  ).length;
  const tomorrowN = base.filter((m) => dayDiffIST(m.startTime) === 1).length;

  let list = base;
  if (when === "live") list = list.filter((m) => m.status === "live");
  else if (when === "today")
    list = list.filter((m) => m.status !== "finished" && dayDiffIST(m.startTime) === 0);
  else if (when === "tomorrow") list = list.filter((m) => dayDiffIST(m.startTime) === 1);

  const { featured, rest, liveCount } = splitFeatured(list);
  const shownLive = featured.filter((m) => m.status === "live").length;
  // Home stays compact: show max 8 compact rows. Full list lives on /fixtures
  // (Hy's call, Oct 5 — otherwise home gets endlessly long as series grow).
  // Exception (v61): when home is filtered to ONE series, the visitor came
  // for that series — show ALL its matches, no cap.
  const restPreview = seriesId ? rest : rest.slice(0, 8);

  // Home note strip: first sentence bold as the lead-in, rest regular.
  const noteDot = homeNote.indexOf(". ");
  const noteLead = noteDot > 0 ? homeNote.slice(0, noteDot + 1) : "";
  const noteTail = noteDot > 0 ? homeNote.slice(noteDot + 2) : homeNote;

  return (
    <div className="mx-auto max-w-2xl md:max-w-4xl lg:max-w-6xl">
      {/* Mobile: DTH selector stays on top (Pic 2). Desktop: hero instead. */}
      <div className="md:hidden">
        <DthSelector />
      </div>

      {/* Desktop hero — Hy's approved design */}
      <section className="hidden px-4 pt-8 text-center md:block">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-extrabold tracking-widest text-sky-700 dark:bg-sky-950 dark:text-sky-300">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
            <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.5-4.8 2.5.9-5.4L3.2 7.7l5.4-.8z" />
          </svg>
          CRICKET BROADCAST GUIDE · INDIA
        </span>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-navy lg:text-5xl dark:text-white">
          Where to Watch <span className="text-sky-600 dark:text-sky-400">Cricket</span> in India
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          Official TV channels &amp; streaming apps for every cricket match. 100%
          verified broadcast info — TV channels, DTH numbers, FreeDish &amp; OTT
          links in a single glance.
        </p>
        <form method="GET" action="/search" role="search" className="mx-auto mt-5 flex max-w-xl items-center gap-2 rounded-full border-[1.5px] border-slate-200 bg-white py-1.5 pl-5 pr-1.5 shadow-card focus-within:border-sky-600 dark:border-slate-700 dark:bg-slate-900">
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            name="q"
            autoComplete="off"
            placeholder="Search team (India, CSK, MI), tournament, or channel…"
            className="w-full bg-transparent text-sm text-navy placeholder:text-slate-400 focus:outline-none dark:text-white"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-700"
          >
            Search
          </button>
        </form>
      </section>

      {/* Home note strip (v61) — text edited from the admin; hidden when empty */}
      {homeNote && (
        <div className="mx-4 mt-4 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-100 px-3.5 py-2.5 dark:border-amber-800 dark:bg-amber-950">
          <span aria-hidden className="text-sm leading-snug">📢</span>
          <p className="text-[13px] font-medium leading-snug text-amber-900 dark:text-amber-200">
            {noteLead && <strong className="font-extrabold">{noteLead} </strong>}
            {noteTail}
          </p>
        </div>
      )}

      {sample && (
        <p className="mx-4 mt-3 rounded-lg bg-amber-50 px-3 py-2 text-[12px] font-medium text-amber-700 md:mx-4 dark:bg-amber-950 dark:text-amber-300">
          Sample data shown — connect MongoDB + enter real broadcast info in /admin
          before launch.
        </p>
      )}

      {/* Filters: chips left, Live/Today/Tomorrow right (desktop) */}
      <div className="md:mt-2 md:flex md:items-center md:justify-between md:gap-2 md:px-4">
        <FilterChips
          series={series}
          activeSeriesId={seriesId}
          freeOnly={freeOnly}
          when={when}
        />
        <WhenTabs
          live={liveN}
          today={todayN}
          tomorrow={tomorrowN}
          active={when}
          seriesId={seriesId}
          freeOnly={freeOnly}
        />
      </div>

      {/* Desktop DTH selector (mobile has it on top) */}
      <div className="hidden md:block">
        <DthSelector className="px-4 pt-1" />
      </div>

      {/* Featured: live + starting soon */}
      <section aria-label="Live and next matches" className="mt-2 px-4">
        <h2 className="pt-2 text-base font-extrabold tracking-tight text-navy md:text-lg dark:text-white">
          Live &amp; Next Matches
        </h2>
        {featured.length === 0 && (
          <p className="mt-2 rounded-xl bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            No live or upcoming matches right now. Check fixtures below.
          </p>
        )}
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
          {featured.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
        {liveCount > shownLive && (
          <p className="mt-3 text-center">
            <Link
              href="/live"
              className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
              See all {liveCount} live matches
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          </p>
        )}
      </section>

      {/* Compact rows */}
      <section aria-label="More matches" className="px-4 pb-4">
        <div className="flex items-center justify-between pt-5">
          <h2 className="text-base font-extrabold tracking-tight text-navy md:text-lg dark:text-white">
            More Matches
          </h2>
          <Link
            href="/fixtures"
            className="inline-flex items-center gap-1 text-sm font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
          >
            See all matches
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </div>
        {rest.length === 0 && (
          <p className="mt-2 rounded-xl bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            Nothing else scheduled. Try another filter.
          </p>
        )}
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {restPreview.map((m) => (
            <CompactMatchRow key={m.id} match={m} />
          ))}
        </div>
        {rest.length > restPreview.length && (
          <p className="mt-3 text-center text-sm text-slate-500 dark:text-slate-400">
            +{rest.length - restPreview.length} more on{" "}
            <Link href="/fixtures" className="font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400">
              Fixtures
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
