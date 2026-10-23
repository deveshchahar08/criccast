// app/api/admin/series/route.js — list + create series (token guarded)
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Series from '@/models/Series';
import Match from '@/models/Match';
import SyncMeta from '@/models/SyncMeta';

function noDb() {
  return NextResponse.json(
    { error: 'No database connected. Set MONGODB_URI to use the admin panel.' },
    { status: 503 }
  );
}

export async function GET(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb()) return noDb();
  await dbConnect();
  const docs = await Series.find().sort({ createdAt: -1 }).lean();
  // Counts cover ONLY the admin window (matches from the last 12h onward) —
  // the same scope Verify-all and the match lists use. A past match can never
  // be verified any more, so counting it would wedge the series in
  // "Action needed" forever (e.g. a finished 1st T20I blocking DONE at 5/6).
  const windowStart = new Date(Date.now() - 12 * 3600 * 1000);
  const counts = await Match.aggregate([
    { $match: { startTime: { $gte: windowStart } } },
    { $group: { _id: "$series", n: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  // Verified vs unverified counts — powers the DONE / progress badges in admin.
  const verifiedCounts = await Match.aggregate([
    { $match: { verifiedAt: { $ne: null }, startTime: { $gte: windowStart } } },
    { $group: { _id: "$series", n: { $sum: 1 } } },
  ]);
  const verifiedMap = Object.fromEntries(verifiedCounts.map((c) => [String(c._id), c.n]));
  // "New" matches per series — arrived in the last 3 days, unverified, not
  // skipped from the admin New box. Powers the Series tab's New section.
  const newMatchCounts = await Match.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
        dismissedNewAt: null,
        verifiedAt: null,
        startTime: { $gte: windowStart },
      },
    },
    { $group: { _id: "$series", n: { $sum: 1 } } },
  ]);
  const newMatchMap = Object.fromEntries(newMatchCounts.map((c) => [String(c._id), c.n]));
  // v65 action-queue fields: each series' next match time (inside the
  // admin window) and whether any of its matches has a recheck due.
  // The Series tab's Action-needed list is built from these two — a
  // series only asks for Hy's attention while its next match is within
  // 14 days or a recheck has come due.
  const nextMatches = await Match.aggregate([
    { $match: { startTime: { $gte: windowStart } } },
    { $group: { _id: "$series", next: { $min: "$startTime" } } },
  ]);
  const nextMap = Object.fromEntries(nextMatches.map((c) => [String(c._id), c.next]));
  const recheckDues = await Match.aggregate([
    {
      $match: {
        recheckAt: { $ne: null, $lte: new Date() },
        status: { $ne: "finished" },
        startTime: { $gte: windowStart },
      },
    },
    { $group: { _id: "$series", n: { $sum: 1 } } },
  ]);
  const recheckMap = Object.fromEntries(recheckDues.map((c) => [String(c._id), c.n]));
  // lean() docs have _id but no id virtual — the admin UI uses s.id.
  const series = docs.map((d) => {
    const total = countMap[String(d._id)] || 0;
    const verified = verifiedMap[String(d._id)] || 0;
    const hasBroadcast =
      (d.broadcast?.tvChannels || []).length > 0 ||
      (d.broadcast?.ottPlatforms || []).length > 0;
    return {
      ...d,
      id: String(d._id),
      matchCount: total,
      verifiedCount: verified,
      newMatchCount: newMatchMap[String(d._id)] || 0,
      nextMatchAt: nextMap[String(d._id)] || null,
      hasRecheckDue: (recheckMap[String(d._id)] || 0) > 0,
      // DONE = broadcast info added AND every match verified (and at least 1 match).
      isDone: hasBroadcast && total > 0 && verified >= total,
    };
  });
  return NextResponse.json({ series });
}

export async function POST(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb()) return noDb();
  await dbConnect();
  const body = await request.json();
  const created = await Series.create(body);
  // Un-blacklist: Hy manually re-created this series, so sync may manage it again.
  const name = String(created.name || "").trim();
  if (name) {
    await SyncMeta.findOneAndUpdate(
      { key: "seriesBlacklist" },
      { $pull: { data: name } }
    );
  }
  return NextResponse.json({ series: created }, { status: 201 });
}
