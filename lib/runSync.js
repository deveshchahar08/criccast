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
import { runOpsNotifications } from "@/lib/opsNotify";

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
  // Load the blacklist once — series Hy deleted (junk) are never re-created by sync.
  let blacklist = new Set();
  try {
    const blDoc = await SyncMeta.findOne({ key: "seriesBlacklist" }).lean();
    if (blDoc && Array.isArray(blDoc.data)) blacklist = new Set(blDoc.data.map(String));
  } catch {}
  let skippedBlacklisted = 0;
  // Same shield, one level down: individual matches Hy deleted as junk
  // (Oct 27: a wrong "Kuwait vs PNG, 44th Match" that the feed kept
  // insisting on, resurrected after every delete) are tombstoned by
  // CricAPI id in SyncMeta "matchBlacklist" — sync never re-creates them.
  let matchBlacklist = new Set();
  try {
    const mbDoc = await SyncMeta.findOne({ key: "matchBlacklist" }).lean();
    if (mbDoc && Array.isArray(mbDoc.data)) matchBlacklist = new Set(mbDoc.data.map(String));
  } catch {}
  let skippedMatchBlacklisted = 0;
  const newSeriesNames = []; // v62: feeds the Telegram "new series" bell
  async function seriesFor(name) {
    const clean = String(name || "").trim() || "Other Matches";
    if (blacklist.has(clean)) { skippedBlacklisted++; return null; }
    if (seriesCache[clean]) return seriesCache[clean];
    let s = await Series.findOne({ name: clean });
    if (!s) {
      s = await Series.create({ name: clean, broadcast: {} });
      newSeriesNames.push(clean);
    }
    seriesCache[clean] = s;
    return s;
  }

  let added = 0;
  let updated = 0;
  let skipped = 0;

  // Track which matches the API reported in THIS sync, and stamp every
  // carried match with lastSeenAt. v65: the READ side (queries.js
  // effectiveStatus) owns staleness now — a match the API still lists
  // is trusted as live (rain marathons, reserve days renew themselves
  // through these stamps), and only matches the API went silent on get
  // auto-finished below. There is deliberately no age-based
  // force-finish at ingest any more: the API's word stands while it
  // speaks, and effectiveStatus retires silent matches by ceiling.
  const apiLiveIds = new Set();
  const now = Date.now();

  for (const m of live) {
    const n = normalizeMatch(m, seriesMap[m.series_id]);
    if (n.teams.length !== 2 || !n.startTime || Number.isNaN(n.startTime.getTime())) {
      skipped++;
      continue;
    }
    if (n.externalId && matchBlacklist.has(String(n.externalId))) {
      skippedMatchBlacklisted++;
      continue; // Hy deleted this exact match as junk — never resurrect it
    }
    if (n.externalId && n.status === "live") apiLiveIds.add(String(n.externalId));
    const series = await seriesFor(n.seriesName);
    if (!series) { skipped++; continue; } // blacklisted — Hy deleted this series as junk
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
      // v63: the API sometimes sends no matchType (both SA-AUS Tests
      // arrived format-less) — inherit the series format so the match
      // gets its multi-day visibility/live windows. Heals on next sync.
      else if (!existing.format && series.format) existing.format = series.format;
      if (n.matchNumber) existing.matchNumber = n.matchNumber;
      // v66: never overwrite a startTime Hy locked by hand in admin —
      // the feed's wrong time is exactly what he corrected.
      if (!existing.startTimeLocked) existing.startTime = n.startTime;
      if (n.venue) existing.venue = n.venue;
      existing.status = n.status;
      existing.lastSeenAt = new Date();
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
        format: n.format || series.format || '',
        matchNumber: n.matchNumber,
        startTime: n.startTime,
        venue: n.venue,
        status: n.status,
        resultText: n.resultText,
        lastSeenAt: new Date(),
      });
      added++;
    }
  }

  // Prune dead matches and series left with no matches — keeps the admin
  // pool to what matters. Two speeds (Hy's ask, Oct 11):
  // - FINISHED matches: gone 2 days after start. They're invisible on the
  //   site and can never be verified, so lingering only pollutes counts.
  // - Anything not finished: 7-day buffer. A Test runs 5 days (plus rain
  //   delays), so a shorter blanket window could delete a live Test.
  // Series created in the last 24h are spared (Hy may be prepping one).
  // VERIFIED matches are NEVER pruned (the verifiedAt: null filter on
  // both deletes below) — a verified page is a public asset that Google
  // ranks and keeps sending visitors to. The Oct 11 wording assumed
  // finished = unverified junk; that assumption silently deleted
  // verified pages once they finished (IND-NZ 1st T20I and INDW-ZIMW
  // 1st ODI, found Oct 26). Do NOT remove the verifiedAt filter.
  const finishedCutoff = new Date(Date.now() - 2 * 24 * 3600 * 1000);
  const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const prunedMatches =
    ((await Match.deleteMany({ status: "finished", startTime: { $lt: finishedCutoff }, verifiedAt: null })).deletedCount || 0) +
    ((await Match.deleteMany({ startTime: { $lt: cutoff }, verifiedAt: null })).deletedCount || 0);

  // Auto-finish stale "live" matches. The API drops finished matches from
  // its feed, so we'd otherwise never learn they ended and they'd show as
  // LIVE forever. Only matches the API went SILENT on get finished —
  // if the API still reports a match as live (rain delay etc.), we trust
  // it. Thresholds tightened Oct 27 to match the read-side ceilings in
  // queries.js (T20 5h, ODI/others 12h, Tests 6 days) so the stored
  // status and the public display retire the LIVE tag together.
  const staleLive = await Match.updateMany(
    {
      status: "live",
      externalId: { $nin: [...apiLiveIds] },
      $or: [
        { format: { $in: ["Test", "First Class"] }, startTime: { $lt: new Date(Date.now() - 6 * 24 * 3600 * 1000) } },
        { format: { $in: ["T20", "T20I"] }, startTime: { $lt: new Date(Date.now() - 5 * 3600 * 1000) } },
        { format: { $nin: ["Test", "First Class"] }, startTime: { $lt: new Date(Date.now() - 12 * 3600 * 1000) } },
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

  // v62: Telegram ops bells (new series / recheck due / unverified & close).
  // Best-effort by design — a notification failure must never fail the sync.
  let opsAlerts = 0;
  try {
    const ops = await runOpsNotifications({ newSeriesNames });
    opsAlerts = ops.sent || 0;
  } catch {}

  return {
    ok: true,
    added,
    updated,
    skipped,
    skippedBlacklisted,
    skippedMatchBlacklisted,
    total: raw.length,
    prunedMatches,
    autoFinished,
    prunedSeries,
    seriesTotal,
    breakdown,
    opsAlerts,
  };
}
