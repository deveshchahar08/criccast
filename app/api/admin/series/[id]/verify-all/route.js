// app/api/admin/series/[id]/verify-all/route.js — token guarded
// One-click: verify ALL upcoming unverified matches of a series.
// This is the human-approval step for Option A (only verified matches go public).
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Series from '@/models/Series';
import Match from '@/models/Match';

export async function POST(request, { params }) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  const { id } = await params;
  await dbConnect();
  const series = await Series.findById(id);
  if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });
  const res = await Match.updateMany(
    {
      series: series._id,
      verifiedAt: null,
      startTime: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    },
    { $set: { verifiedAt: new Date() } }
  );
  return NextResponse.json({ ok: true, verified: res.modifiedCount || 0 });
}
