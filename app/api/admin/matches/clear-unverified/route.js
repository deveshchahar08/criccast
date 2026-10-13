// app/api/admin/matches/clear-unverified/route.js — bulk delete unverified matches (token guarded)
// Unverified matches are disposable: the next sync re-fetches any still relevant.
// Also prunes series left with no matches (except created in last 24h — Hy may be prepping one).
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Match from '@/models/Match';
import Series from '@/models/Series';

export async function DELETE(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  const result = await Match.deleteMany({
    $or: [{ verifiedAt: null }, { verifiedAt: { $exists: false } }],
  });
  // Prune now-empty series immediately (don't wait for sync)
  const usedSeries = await Match.distinct("series");
  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000);
  const pruned = await Series.deleteMany({
    _id: { $nin: usedSeries },
    createdAt: { $lt: dayAgo },
  });
  return NextResponse.json({
    deleted: result.deletedCount || 0,
    prunedSeries: pruned.deletedCount || 0,
  });
}
