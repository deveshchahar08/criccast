// app/api/admin/matches/recheck/route.js — list matches flagged for re-confirmation (token guarded)
// A recheck flag is an admin-only reminder: the match stays live on the site
// regardless. This list feeds the admin Recheck tab + its due-count badge.
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Match from '@/models/Match';

export async function GET(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  const docs = await Match.find({
    recheckAt: { $ne: null },
    status: { $ne: 'finished' },
  })
    .populate('series')
    .sort({ recheckAt: 1 })
    .lean();
  const matches = docs.map((d) => ({
    ...d,
    id: String(d._id),
    seriesId: d.series ? String(d.series._id || d.series) : '',
    seriesName: d.series?.name || '',
  }));
  return NextResponse.json({ matches });
}
