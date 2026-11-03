// lib/search.js — shared site search matcher (server-side).
// One matcher behind both the /search page and the /api/search route
// that powers the header overlay, so results never disagree.
//
// TOKEN matching: the query is lowercased and split on whitespace; a
// record matches when EVERY token appears somewhere in its haystack.
// "new zealand" therefore finds records mentioning New + Zealand in
// any fields, while a single token behaves exactly like the old
// substring filter.
import { getHomeMatches, getAllSeries } from "@/lib/queries";
import { getLiveNewsPosts } from "@/lib/news";

export function tokenizeQuery(q) {
  return String(q || "")
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
}

export function haystackMatches(haystack, tokens) {
  if (tokens.length === 0) return false;
  const h = String(haystack || "").toLowerCase();
  return tokens.every((t) => h.includes(t));
}

function matchHaystack(m) {
  // Same fields the /search page has always matched against.
  return [m.teams?.join(" "), m.seriesName, m.venue, m.city, m.matchNumber]
    .filter(Boolean)
    .join(" ");
}

// Returns { matches, series, news } as the raw serialized records
// (matches = getHomeMatches shape, series = getAllSeries shape,
// news = live NewsPost records). Caps default to the API limits; pass
// Infinity (e.g. { matchLimit: Infinity }) where all results are
// wanted, as the /search page does for matches.
export async function searchSite(
  q,
  { matchLimit = 8, seriesLimit = 5, newsLimit = 5 } = {}
) {
  const tokens = tokenizeQuery(q);
  if (tokens.length === 0) return { matches: [], series: [], news: [] };

  const [{ matches }, { series }, liveNews] = await Promise.all([
    getHomeMatches({}),
    getAllSeries(),
    getLiveNewsPosts(),
  ]);

  return {
    matches: matches
      .filter((m) => haystackMatches(matchHaystack(m), tokens))
      .slice(0, matchLimit),
    series: series
      .filter((s) => haystackMatches(s.name, tokens))
      .slice(0, seriesLimit),
    news: liveNews
      .filter((p) =>
        haystackMatches([p.title, p.tag, p.dek].filter(Boolean).join(" "), tokens)
      )
      .slice(0, newsLimit),
  };
}
