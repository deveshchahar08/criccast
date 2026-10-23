// app/series/[slug]/page.js — one public page per series (v62).
// Before v62 a series had no page of its own: the Series index linked to the
// home page with a filter applied, so Google had no stable URL to rank for
// "<series name> where to watch". This page is that URL: broadcast summary
// on top, every verified match of the series below.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeriesBySlug, splitFeatured } from "@/lib/queries";
import MatchCard from "@/components/MatchCard";
import CompactMatchRow from "@/components/CompactMatchRow";

export const revalidate = 300;

export async function generateMetadata({ params }) {
  const { slug } = await params; // Next.js 16: params is a Promise
  const { series } = await getSeriesBySlug(slug);
  if (!series) return { title: "Series not found — CricCast" };
  const b = series.broadcast || { tvChannels: [], ottPlatforms: [] };
  const where = [
    ...(b.tvChannels || []).map((c) => c.name),
    ...(b.ottPlatforms || []).map((o) => o.name),
  ].join(", ");
  return {
    title: `${series.name} — Where to Watch on TV & OTT | CricCast`,
    description: `Where to watch ${series.name} in India${where ? `: live on ${where}` : ""}. TV channels, OTT apps and DTH channel numbers for every match, verified by us.`,
  };
}

export default async function SeriesDetailPage({ params }) {
  const { slug } = await params;
  const { series, matches } = await getSeriesBySlug(slug);
  if (!series) notFound();

  const b = series.broadcast || { tvChannels: [], ottPlatforms: [] };
  const tvNames = (b.tvChannels || []).map((c) => c.name.replace(" HD", ""));
  const ottNames = (b.ottPlatforms || []).map((o) => o.name);
  const { featured, rest } = splitFeatured(matches, { liveCap: 99, fillCap: 3, hideOverflowLive: false });

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 md:max-w-4xl lg:max-w-5xl">
      <Link href="/series" className="text-sm font-bold text-sky-600 hover:underline">
        ← All series
      </Link>

      <h1 className="mt-3 text-xl font-extrabold tracking-tight text-navy dark:text-white">
        {series.name}
      </h1>
      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
        {series.format}
        {series.season ? ` · ${series.season}` : ""} · {matches.length}{" "}
        {matches.length === 1 ? "match" : "matches"}
      </p>

      {/* Broadcast summary — channel/app names only; the per-operator DTH
          numbers live on each match card and detail page below. */}
      {(tvNames.length > 0 || ottNames.length > 0) && (
        <section className="mt-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-extrabold text-navy dark:text-white">
            Where to watch this series in India
          </h2>
          {tvNames.length > 0 && (
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-bold text-navy dark:text-white">TV:</span> {tvNames.join(" · ")}
            </p>
          )}
          {ottNames.length > 0 && (
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-bold text-navy dark:text-white">Streaming:</span>{" "}
              {ottNames.join(" · ")}
            </p>
          )}
          <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
            Channel numbers for Tata Play, Airtel DTH, Dish TV, Videocon d2h, Sun Direct and DD
            FreeDish are on each match below — pick your operator once and every card follows.
          </p>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mt-4 space-y-3">
          {featured.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </section>
      )}

      {rest.length > 0 && (
        <section className="mt-4 pb-6">
          <h2 className="mb-2 text-base font-extrabold text-navy dark:text-white">
            {featured.length > 0 ? "More matches in this series" : "Matches in this series"}
          </h2>
          <div className="space-y-2.5">
            {rest.map((m) => (
              <CompactMatchRow key={m.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {matches.length === 0 && (
        <p className="mt-4 rounded-xl bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          No upcoming matches in this series right now.
        </p>
      )}
    </div>
  );
}
