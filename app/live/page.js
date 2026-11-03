// LIVE — every match being played right now, as big cards (v65, Hy's
// design, Oct 22). Home shows at most four live cards and links here;
// this page never truncates. The list comes from getHomeMatches, so
// the count here always matches the navbar pill and the home cards —
// one status function (queries.effectiveStatus) decides what is live.
import { getHomeMatches } from "@/lib/queries";
import Link from "next/link";
import MatchCard from "@/components/MatchCard";

export const revalidate = 60;

export const metadata = {
  title: "Live Cricket Matches — Where to Watch on TV & OTT in India | CricCast",
  description:
    "Every cricket match live right now: the TV channel, DTH channel numbers and OTT app showing it in India. Verified broadcast info.",
};

export default async function LivePage() {
  const { matches } = await getHomeMatches({});
  const live = matches.filter((m) => m.status === "live");
  const upcoming = matches.filter((m) => m.status === "scheduled").slice(0, 4);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6 md:max-w-4xl lg:max-w-6xl">
      <section className="pt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[11px] font-extrabold tracking-widest text-red-600 dark:bg-red-950 dark:text-red-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
          LIVE NOW
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy md:text-4xl dark:text-white">
          Live Cricket Matches
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          {live.length > 0
            ? `${live.length} ${live.length === 1 ? "match is" : "matches are"} being played right now — here is where to watch each one in India.`
            : "No match is live at this moment. Here is what is coming up next."}
        </p>
      </section>

      {live.length > 0 ? (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {live.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      ) : (
        upcoming.length > 0 && (
          <section aria-label="Coming up next" className="mt-6">
            <h2 className="text-base font-extrabold tracking-tight text-navy md:text-lg dark:text-white">
              Coming Up Next
            </h2>
            <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
              {upcoming.map((m) => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              See every scheduled match on{" "}
              <Link href="/fixtures" className="font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400">
                Fixtures
              </Link>
              .
            </p>
          </section>
        )
      )}
    </div>
  );
}
