// lib/queries.js
// All data access lives here. Pages AND API routes call these functions —
// never Mongoose directly. Two benefits:
// 1. One place to fix when the data logic changes.
// 2. Sample-data fallback in one place: with no MONGODB_URI set, everything
//    (pages, API routes, admin reads) runs on lib/sampleData.js so
//    `npm run dev` works on day one.
import { dbConnect, hasDb } from './db.js';
import Match, { resolveBroadcast } from '../models/Match.js';
import Series from '../models/Series.js';
import SyncMeta from '../models/SyncMeta.js';
import { sampleMatches, sampleSeries } from './sampleData.js';

// v65 — ONE place decides a match's public state (upcoming / live /
// finished): effectiveStatus below. The navbar pill, home cards, the
// /live page, fixtures and the admin list all read status through it,
// so the count can never disagree with the cards again (Oct 22: the
// pill said 7 LIVE while only 3 live cards were visible).
//
// Rules (Hy's design, Oct 22; ceilings tightened Oct 27 — finished
// matches were wearing the LIVE tag into the night, Hy's complaint):
// - The API's "finished" is final.
// - A started match is LIVE while either of these holds:
//   (a) its age is within the format ceiling — ceilings carry rain
//       buffers, they are NOT typical durations (T20 5h, T10 3.5h,
//       ODI 11h, Test/First Class 5 days, anything else 10h), or
//   (b) a sync has SEEN the match in the feed within the last 8h and
//       its age is under ceiling + 24h — a reserve-day final (Hy's
//       example: IPL 2023, washed out and finished two days later)
//       keeps renewing itself while the API keeps listing it. 8h is
//       deliberately longer than the widest gap between syncs (6.5h),
//       so a match the feed still carries can never go stale mid-play;
//       once the feed goes silent, the tag retires within hours.
// - Past both, the match counts as finished even if the API never said
//   so: the API drops finished matches silently, and a stale LIVE tag
//   is a lie to the visitor.
const LIVE_CEILING_MS = {
  T20: 5 * 3600 * 1000,
  T20I: 5 * 3600 * 1000,
  T10: 3.5 * 3600 * 1000,
  ODI: 11 * 3600 * 1000,
  Test: 5 * 24 * 3600 * 1000,
  "First Class": 5 * 24 * 3600 * 1000,
};
const DEFAULT_CEILING_MS = 10 * 3600 * 1000;
const SEEN_FRESH_MS = 8 * 3600 * 1000;
const SEEN_OUTER_MS = 24 * 3600 * 1000;

export function liveCeilingMs(format) {
  return LIVE_CEILING_MS[format] || DEFAULT_CEILING_MS;
}

export function effectiveStatus(m) {
  const s = m.status || 'scheduled';
  if (s === 'finished') return 'finished';
  if (!m.startTime) return s;
  const start = new Date(m.startTime).getTime();
  const now = Date.now();
  if (start > now) return 'scheduled';
  const format =
    m.format ||
    (m.series && typeof m.series === 'object' ? m.series.format : '') ||
    '';
  const ceiling = liveCeilingMs(format);
  const age = now - start;
  if (age <= ceiling) return 'live';
  const seen = m.lastSeenAt
    ? now - new Date(m.lastSeenAt).getTime()
    : Infinity;
  if (seen <= SEEN_FRESH_MS && age <= ceiling + SEEN_OUTER_MS) return 'live';
  return 'finished';
}

// Home-page note strip (v61, Hy's idea): a one-line announcement on the home
// page whose text Hy edits from the admin — no rebuild needed to change it.
// Stored in SyncMeta under 'homeNote'. Empty text = strip hidden.
export async function getHomeNote() {
  if (!hasDb()) return '';
  await dbConnect();
  const doc = await SyncMeta.findOne({ key: 'homeNote' }).lean();
  const text = doc && doc.data && typeof doc.data.text === 'string' ? doc.data.text : '';
  return text.trim();
}

// Mongoose docs can't cross the server->client boundary (ObjectIds, Dates),
// so everything is serialized to plain JSON-safe objects here.
function serializeMatch(m) {
  const plain = m.toObject ? m.toObject() : m;
  return {
    id: String(plain._id),
    seriesId: plain.series ? String(plain.series._id || plain.series) : null,
    seriesName: plain.series && plain.series.name ? plain.series.name : '',
    seriesFormat: plain.series && plain.series.format ? plain.series.format : '',
    teams: plain.teams || [],
    shortNames: plain.shortNames || [],
    format: plain.format || '',
    matchNumber: plain.matchNumber || '',
    startTime: plain.startTime ? new Date(plain.startTime).toISOString() : null,
    venue: plain.venue || '',
    city: plain.city || '',
    status: effectiveStatus(plain),
    resultText: plain.resultText || null,
    digitalOnly: !!plain.digitalOnly,
    digitalOnlyNote: plain.digitalOnlyNote || null,
    verifiedAt: plain.verifiedAt ? new Date(plain.verifiedAt).toISOString() : null,
    sourceUrl: plain.sourceUrl || null,
    broadcast: resolveBroadcast(plain),
  };
}

// URL slug for a series' own public page (/series/<slug>). Derived from the
// name deterministically — no stored field, no migration: the name IS the
// identity (sync already keys series by name). "Australia tour of South
// Africa, 2026" -> "australia-tour-of-south-africa-2026".
export function seriesSlug(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function serializeSeries(s) {
  const plain = s.toObject ? s.toObject() : s;
  return {
    id: String(plain._id),
    slug: seriesSlug(plain.name),
    name: plain.name,
    format: plain.format || '',
    season: plain.season || '',
    priority: plain.priority || 0,
    teams: plain.teams || [],
    broadcast: plain.broadcast || null,
  };
}

function liveUpcomingFilter(extra = {}) {
  const now = Date.now();
  return {
    // v65: this filter is a SUPERSET of what effectiveStatus can call
    // live — it fetches candidates generously, then getHomeMatches
    // drops whatever effectiveStatus marks finished, so the visible
    // list and the LIVE count always agree. Windows mirror the
    // ceilings: a live row can matter until ceiling + 24h (seen-alive
    // renewals), a scheduled row only until its ceiling passes.
    $or: [
      { status: "live", format: { $in: ["Test", "First Class"] }, startTime: { $gte: new Date(now - 6 * 24 * 3600 * 1000) } },
      { status: "live", startTime: { $gte: new Date(now - 40 * 3600 * 1000) } },
      { status: "scheduled", format: { $in: ["Test", "First Class"] }, startTime: { $gte: new Date(now - 5 * 24 * 3600 * 1000) } },
      { status: "scheduled", startTime: { $gte: new Date(now - 14 * 3600 * 1000) } },
    ],
    // OPTION A (Hy's call, Oct 2): only human-verified matches go public.
    // Unverified sync results stay in /admin as a candidate pool.
    verifiedAt: { $ne: null },
    ...extra,
  };
}

// Homepage feed: live + upcoming, soonest first.
export async function getHomeMatches({ seriesId } = {}) {
  if (!hasDb()) {
    let matches = sampleMatches().map((m) => ({ ...m, status: effectiveStatus(m) }));
    if (seriesId) matches = matches.filter((m) => m.seriesId === seriesId);
    return { matches: matches.filter((m) => m.status !== 'finished'), sample: true };
  }
  await dbConnect();
  const filter = liveUpcomingFilter(seriesId ? { series: seriesId } : {});
  const docs = await Match.find(filter)
    .populate('series')
    .sort({ startTime: 1 })
    .limit(200);
  // LIVE first, then soonest. (Hy's call, Oct 5: date-wise like big sites —
  // no priority sorting for matches. Priority still orders series chips/page.)
  docs.sort((a, b) => {
    const aLive = a.status === "live" ? 0 : 1;
    const bLive = b.status === "live" ? 0 : 1;
    return aLive - bLive || new Date(a.startTime) - new Date(b.startTime);
  });
  // v65: one state, everywhere — rows the single status function calls
  // finished never reach a public list, whatever the raw row says.
  const visible = docs
    .map(serializeMatch)
    .filter((m) => m.status !== 'finished');
  // Order by EFFECTIVE state: live first, then soonest (the raw sort
  // above cannot see auto-live promotions from 'scheduled').
  visible.sort((a, b) => {
    const aLive = a.status === 'live' ? 0 : 1;
    const bLive = b.status === 'live' ? 0 : 1;
    return aLive - bLive || new Date(a.startTime) - new Date(b.startTime);
  });
  return { matches: visible, sample: false };
}

export async function getMatchById(id) {
  if (!hasDb()) {
    const m = sampleMatches().find((x) => x.id === id);
    return { match: m || null, sample: true };
  }
  await dbConnect();
  const doc = await Match.findById(id).populate('series');
  // Unverified matches have no public page (they live only in /admin).
  if (!doc || !doc.verifiedAt) return { match: null, sample: false };
  return { match: serializeMatch(doc), sample: false };
}

export async function getAllSeries() {
  if (!hasDb()) return { series: sampleSeries().map(serializeSeries), sample: true };
  await dbConnect();
  // Only series with at least one verified, visible match (Hy's call, Oct 4).
  // API-sync junk series with no verified matches stay hidden everywhere:
  // Series page, home/fixtures filter chips, sitemap.
  const visibleSeriesIds = await Match.distinct("series", liveUpcomingFilter());
  const docs = await Series.find({ _id: { $in: visibleSeriesIds } }).sort({
    priority: -1,
    createdAt: -1,
  });
  return { series: docs.map(serializeSeries), sample: false };
}

// One series' own public page (/series/<slug>): the series (with its
// broadcast) + its verified, visible matches — same visibility rules as
// everywhere else, so a series page never exists without live content.
export async function getSeriesBySlug(slug) {
  const { series, sample } = await getAllSeries();
  const found = series.find((s) => s.slug === slug);
  if (!found) return { series: null, matches: [], sample };
  const { matches } = await getHomeMatches({ seriesId: found.id });
  return { series: found, matches, sample };
}

// Lightweight live-match count for the navbar "N LIVE NOW" pill.
export async function getLiveCount() {
  const { matches } = await getHomeMatches({});
  return matches.filter((m) => m.status === 'live').length;
}

// Split the feed for the home layout: featured cards vs compact rows.
// v65 (Hy's design, Oct 22): featured shows up to FOUR live matches as
// big cards; any live beyond four stay off home entirely — the section
// links to /live with the true count instead of burying live matches
// in compact rows. When fewer than four are live, starting-soon
// matches (within ~6h) fill the remaining big-card slots. The compact
// rows below never contain a live match.
// The series page passes its own options: there every match of the
// series must stay visible, so live is uncapped and nothing is hidden.
export function splitFeatured(
  matches,
  { liveCap = 4, fillCap = 4, hideOverflowLive = true } = {}
) {
  const now = Date.now();
  const live = matches.filter((m) => m.status === 'live');
  const featured = live.slice(0, liveCap);
  if (featured.length < fillCap) {
    for (const m of matches) {
      if (featured.length >= fillCap) break;
      if (m.status === 'live') continue;
      const startsAt = new Date(m.startTime).getTime();
      if (m.status === 'scheduled' && startsAt >= now && startsAt - now < 6 * 3600 * 1000)
        featured.push(m);
    }
  }
  const featuredIds = new Set(featured.map((m) => m.id));
  const rest = matches.filter(
    (m) => !featuredIds.has(m.id) && (!hideOverflowLive || m.status !== 'live')
  );
  return { featured, rest, liveCount: live.length };
}
