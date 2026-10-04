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
import { sampleMatches, sampleSeries } from './sampleData.js';

// Auto-LIVE: a match whose start time has passed (but isn't marked finished)
// is treated as live for up to 10h — the LIVE badge appears the second the
// match starts, with zero API calls. The sync later corrects the status.
const AUTO_LIVE_WINDOW_MS = 10 * 3600 * 1000;

export function effectiveStatus(m) {
  const s = m.status || 'scheduled';
  if (s !== 'scheduled' || !m.startTime) return s;
  const start = new Date(m.startTime).getTime();
  const now = Date.now();
  if (start <= now && now - start < AUTO_LIVE_WINDOW_MS) return 'live';
  return 'scheduled';
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

function serializeSeries(s) {
  const plain = s.toObject ? s.toObject() : s;
  return {
    id: String(plain._id),
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
    // A "live" badge is trusted only within a sane window from start —
    // the API drops finished matches, so a stale "live" flag must not
    // linger. Tests get 5 days, everything else 12h.
    $or: [
      { status: "live", format: "Test", startTime: { $gte: new Date(now - 5 * 24 * 3600 * 1000) } },
      { status: "live", format: { $ne: "Test" }, startTime: { $gte: new Date(now - 12 * 3600 * 1000) } },
      { status: "scheduled", startTime: { $gte: new Date(now - 12 * 3600 * 1000) } },
      { status: "scheduled", format: "Test", startTime: { $gte: new Date(now - 5 * 24 * 3600 * 1000) } },
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
    return { matches, sample: true };
  }
  await dbConnect();
  const filter = liveUpcomingFilter(seriesId ? { series: seriesId } : {});
  const docs = await Match.find(filter)
    .populate('series')
    .sort({ startTime: 1 })
    .limit(200);
  // Big series first (series.priority desc), then soonest. Can't sort by a
  // populated field in Mongo, so sort in JS after populate.
  docs.sort(
    (a, b) =>
      (b.series?.priority || 0) - (a.series?.priority || 0) ||
      new Date(a.startTime) - new Date(b.startTime)
  );
  return { matches: docs.map(serializeMatch), sample: false };
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

// Lightweight live-match count for the navbar "N LIVE NOW" pill.
export async function getLiveCount() {
  const { matches } = await getHomeMatches({});
  return matches.filter((m) => m.status === 'live').length;
}

// Split the feed for the home layout: featured cards vs compact rows.
// Featured = live now + starting within ~6h (max 3). Rest = compact rows.
export function splitFeatured(matches) {
  const now = Date.now();
  const featured = [];
  const rest = [];
  for (const m of matches) {
    const startsSoon =
      m.status === 'scheduled' && new Date(m.startTime).getTime() - now < 6 * 3600 * 1000;
    if ((m.status === 'live' || startsSoon) && featured.length < 3) featured.push(m);
    else rest.push(m);
  }
  return { featured, rest };
}
