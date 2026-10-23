// app/api/admin/series/[id]/dismiss-new/route.js — skip a series from the admin "New" box (token guarded)
// Stamps the series itself AND any of its matches still counting as new, so
// the series leaves the New section in one tap. Nothing is deleted or
// verified — the series stays in the Action needed list as usual.
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
  const series = await Series.findByIdAndUpdate(id, { dismissedNewAt: new Date() });
  if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });
  const res = await Match.updateMany(
    {
      series: series._id,
      createdAt: { $gte: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
      dismissedNewAt: null,
      verifiedAt: null,
    },
    { $set: { dismissedNewAt: new Date() } }
  );
  return NextResponse.json({ ok: true, dismissedMatches: res.modifiedCount || 0 });
}
