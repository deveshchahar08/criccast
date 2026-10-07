// app/api/admin/series/route.js — list + create series (token guarded)
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Series from '@/models/Series';
import Match from '@/models/Match';

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
  const counts = await Match.aggregate([
    { $group: { _id: "$series", n: { $sum: 1 } } },
  ]);
  const countMap = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  // Verified vs unverified counts — powers the DONE / progress badges in admin.
  const verifiedCounts = await Match.aggregate([
    { $match: { verifiedAt: { $ne: null } } },
    { $group: { _id: "$series", n: { $sum: 1 } } },
  ]);
  const verifiedMap = Object.fromEntries(verifiedCounts.map((c) => [String(c._id), c.n]));
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
  return NextResponse.json({ series: created }, { status: 201 });
}
