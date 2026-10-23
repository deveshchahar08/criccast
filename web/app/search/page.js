// SEARCH — server-rendered results, no JS needed.
// Matches team names, series, venue or city.
import { getHomeMatches } from "@/lib/queries";
import CompactMatchRow from "@/components/CompactMatchRow";

export const metadata = { title: "Search matches — CricCast" };
export const revalidate = 60;

export default async function SearchPage({ searchParams }) {
  const sp = await searchParams;
  const raw = (sp?.q || "").trim();
  const q = raw.toLowerCase();

  const { matches } = await getHomeMatches({});
  const results = q
    ? matches.filter((m) =>
        [m.teams?.join(" "), m.seriesName, m.venue, m.city, m.matchNumber]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : [];

  return (
    <div className="mx-auto max-w-2xl px-4 pt-5 md:max-w-4xl">
      <h1 className="text-xl font-extrabold tracking-tight text-navy dark:text-white">Search</h1>

      {/* DESIGN.md search bar: pill, 1.5px border, sky focus ring */}
      <form method="GET" action="/search" className="mt-3 flex gap-2" role="search">
        <input
          name="q"
          defaultValue={raw}
          placeholder="Find match, team, tournament…"
          autoComplete="off"
          className="w-full rounded-full border-[1.5px] border-slate-200 bg-white px-4 py-2.5 text-sm text-navy placeholder:text-slate-400 focus:border-sky-600 focus:outline-none focus:shadow-[0_0_0_3px_rgba(2,132,199,0.15)] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
        />
        <button
          type="submit"
          className="shrink-0 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-700"
        >
          Search
        </button>
      </form>

      {raw !== "" && (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          {results.length === 0
            ? `No matches found for "${raw}".`
            : `${results.length} result${results.length > 1 ? "s" : ""} for "${raw}"`}
        </p>
      )}

      <div className="mt-3 grid gap-3 pb-4 md:grid-cols-2">
        {results.map((m) => (
          <CompactMatchRow key={m.id} match={m} />
        ))}
      </div>
    </div>
  );
}
