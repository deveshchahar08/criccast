// lib/runSync.js — the fixture-sync core, shared by the admin "Sync Now"
// button (POST /api/admin/sync, token-guarded) and Vercel Cron
// (GET /api/cron/sync, CRON_SECRET bearer-guarded).
//
// Costs ~21 CricAPI requests per normal run (1 currentMatches + up to 20
// /matches pages). The /series id->name map is cached in MongoDB (SyncMeta)
// and only re-fetched (~48 hits) when matches reference a series id not in
// the cache — new series are announced rarely, so most syncs stay cheap.
//
// New matches arrive UNVERIFIED — Hy enters per-series broadcast info once
// in the admin Series tab, then presses Verify. Sync never touches
// verifiedAt or broadcastOverride on existing matches.
import { dbConnect, hasDb } from "@/lib/db";
import Match from "@/models/Match";
import Series from "@/models/Series";
import SyncMeta from "@/models/SyncMeta";
import { fetchUpcomingMatches, fetchSeriesMap, normalizeMatch } from "@/lib/cricapi";

// Series ids live for months; re-fetch the full map at most every 14 days
// even if nothing looks new (guards against renames / a partial cache).
const SERIES_MAP_TTL_MS = 14 * 24 * 3600 * 1000;

async function getSeriesMap(key, neededIds) {
  const doc = await SyncMeta.findOne({ key: "seriesMap" }).lean();
  let map = doc && doc.data ? doc.data : null;
  const stale = !doc || Date.now() - new Date(doc.updatedAt).getTime() > SERIES_MAP_TTL_MS;
  const missing = (neededIds || []).filter((id) => id && !(map && map[id]));
  if (!map || stale || missing.length > 0) {
    map = await fetchSeriesMap(key);
    await SyncMeta.findOneAndUpdate(
      { key: "seriesMap" },
      { $set: { data: map, updatedAt: new Date() } },
      { upsert: true }
    );
  }
  return map;
}

function syncError(status, error) {
  const e = new Error(error);
  e.statusCode = status;
  return e;
}

export async function runSync() {
  if (!hasDb()) throw syncError(503, "No database connected.");
  const key = process.env.CRICAPI_KEY;
  if (!key)
    throw syncError(
      503,
      "CRICAPI_KEY is not set. Add it to the environment and redeploy."
    );

  await dbConnect();

  let raw;
  try {
    raw = await fetchUpcomingMatches(key);
  } catch (e) {
    throw syncError(502, `CricAPI error: ${e.message}`);
  }

  // Hy's rule (Oct 3): finished matches are never stored — no series is
  // created for them and their old rows get pruned. Only matches with
  // something still to come matter (site shows live/upcoming only).
  const live = raw.filter((m) => !(m && m.matchEnded));

  // Resolve series names via the cached map — a full /series re-fetch only
  // happens when matches point at a series id we haven't seen before.
  const neededIds = [...new Set(live.map((m) => m && m.series_id).filter(Boolean))];
  let seriesMap;
  try {
    seriesMap = await getSeriesMap(key, neededIds);
  } catch (e) {
    throw syncError(502, `CricAPI error: ${e.message}`);
  }

  const seriesCache = {};
  async function seriesFor(name) {
    const clean = String(name || "").trim() || "Other Matches";
    if (seriesCache[clean]) return seriesCache[clean];
    let s = await Series.findOne({ name: clean });
    if (!s) s = await Series.create({ name: clean, broadcast: {} });
    seriesCache[clean] = s;
    return s;
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  // Track which matches the API reported in THIS sync. A match the API
  // still calls "live" is trusted — UNLESS it's absurdly old (API stale
  // data; e.g. a T20 "live" 7h after start). Absolute caps: T20 6h,
  // ODI 12h, Test 6d. Only matches the API went silent on (dropped from
  // feed = ended) get auto-finished below the caps.
  const apiLiveIds = new Set();
  const now = Date.now();
  const maxLiveAge = (format) => {
    if (format === "Test") return 6 * 24 * 3600 * 1000;
    if (format === "T20" || format === "T20I") return 6 * 3600 * 1000;
    return 12 * 3600 * 1000; // ODI and others
  };

  for (const m of live) {
    const n = normalizeMatch(m, seriesMap[m.series_id]);
    if (n.teams.length !== 2 || !n.startTime || Number.isNaN(n.startTime.getTime())) {
      skipped++;
      continue;
    }
    // API says live but match is older than any realistic duration?
    // API data is stale — treat as finished.
    if (n.status === "live" && now - new Date(n.startTime).getTime() > maxLiveAge(n.format)) {
      n.status = "finished";
    }
    if (n.externalId && n.status === "live") apiLiveIds.add(String(n.externalId));
    const series = await seriesFor(n.seriesName);
    let existing = await Match.findOne({ externalId: n.externalId });
    if (!existing && n.teams.length === 2 && n.startTime) {
      // Manual-add dedup (Oct 4): Hy hand-creates matches the API missed
      // (no externalId). If the API returns them later, link to the manual
      // row — same series + teams + startTime within 12h — instead of
      // creating a duplicate.
      const t = new Date(n.startTime).getTime();
      existing = await Match.findOne({
        series: series._id,
        teams: { $all: n.teams },
        startTime: {
          $gte: new Date(t - 12 * 3600 * 1000),
          $lte: new Date(t + 12 * 3600 * 1000),
        },
      });
      if (existing) existing.externalId = n.externalId;
    }
    if (existing) {
      existing.teams = n.teams;
      existing.shortNames = n.shortNames;
      if (n.format) existing.format = n.format;
      if (n.matchNumber) existing.matchNumber = n.matchNumber;
      existing.startTime = n.startTime;
      if (n.venue) existing.venue = n.venue;
      existing.status = n.status;
      if (n.resultText) existing.resultText = n.resultText;
      // Re-link series: a match created while its series name was
      // unresolvable ("Other Matches") gets fixed once the name resolves.
      // Only when we have a real name — never overwrite with a blank.
      if (n.seriesName) {
        const rs = await seriesFor(n.seriesName);
        existing.series = rs._id;
      }
      await existing.save();
      updated++;
    } else {
      await Match.create({
        series: series._id,
        externalId: n.externalId,
        teams: n.teams,
        shortNames: n.shortNames,
        format: n.format,
        matchNumber: n.matchNumber,
        startTime: n.startTime,
        venue: n.venue,
        status: n.status,
        resultText: n.resultText,
      });
      added++;
    }
  }

  // Prune matches older than 7 days (finished or stale-scheduled) and
  // series left with no matches — keeps the admin pool to what matters.
  // Series created in the last 24h are spared (Hy may be prepping one).
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const prunedMatches =
    (await Match.deleteMany({ startTime: { $lt: cutoff } })).deletedCount || 0;

  // Auto-finish stale "live" matches. The API drops finished matches from
  // its feed, so we'd otherwise never learn they ended and they'd show as
  // LIVE forever. Only matches the API went SILENT on get finished —
  // if the API still reports a match as live (rain delay etc.), we trust
  // it no matter how old. T20: 6h, ODI/others: 24h, Tests: 6 days.
  const staleLive = await Match.updateMany(
    {
      status: "live",
      externalId: { $nin: [...apiLiveIds] },
      $or: [
        { format: "Test", startTime: { $lt: new Date(Date.now() - 6 * 24 * 3600 * 1000) } },
        { format: { $in: ["T20", "T20I"] }, startTime: { $lt: new Date(Date.now() - 6 * 3600 * 1000) } },
        { startTime: { $lt: new Date(Date.now() - 24 * 3600 * 1000) } },
      ],
    },
    { $set: { status: "finished" } }
  );
  const autoFinished = staleLive.modifiedCount || 0;
  const usedSeries = await Match.distinct("series");
  const prunedSeries =
    (
      await Series.deleteMany({
        _id: { $nin: usedSeries },
        createdAt: { $lt: new Date(Date.now() - 24 * 3600 * 1000) },
      })
    ).deletedCount || 0;

  // Visibility: how many series exist and where the matches sit.
  const seriesTotal = await Series.countDocuments();
  const perSeries = await Match.aggregate([
    { $match: { startTime: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) } } },
    { $group: { _id: "$series", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 12 },
  ]);
  const sDocs = await Series.find({
    _id: { $in: perSeries.map((x) => x._id).filter(Boolean) },
  }).lean();
  const nameOf = Object.fromEntries(sDocs.map((d) => [String(d._id), d.name]));
  const breakdown = perSeries.map(
    (x) => `${nameOf[String(x._id)] || "Unknown series"}: ${x.count}`
  );

  return {
    ok: true,
    added,
    updated,
    skipped,
    total: raw.length,
    prunedMatches,
    autoFinished,
    prunedSeries,
    seriesTotal,
    breakdown,
  };
}
