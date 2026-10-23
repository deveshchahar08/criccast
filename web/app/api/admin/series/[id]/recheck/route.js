// app/api/admin/series/[id]/recheck/route.js — flag all upcoming matches of a series for recheck (token guarded)
// Each match gets recheckAt = its own startTime minus 3 days, so it surfaces in
// the admin Recheck tab shortly before the match. Admin-only reminder — the
// public site is unaffected whether Hy confirms or not.
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Series from '@/models/Series';
import Match from '@/models/Match';

const THREE_DAYS = 3 * 24 * 3600 * 1000;

export async function POST(request, { params }) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  const { id } = await params;
  await dbConnect();
  const series = await Series.findById(id);
  if (!series) return NextResponse.json({ error: 'Series not found' }, { status: 404 });
  const body = await request.json().catch(() => ({}));
  const note = String(body.note || '').trim();
  const matches = await Match.find({
    series: series._id,
    status: { $ne: 'finished' },
    startTime: { $gte: new Date(Date.now() - 12 * 3600 * 1000) },
  }).select('_id startTime');
  let flagged = 0;
  for (const m of matches) {
    await Match.findByIdAndUpdate(m._id, {
      recheckAt: new Date(new Date(m.startTime).getTime() - THREE_DAYS),
      recheckNote: note,
      recheckAlertedAt: null, // v62: re-flagging re-arms the Telegram bell
    });
    flagged++;
  }
  return NextResponse.json({ ok: true, flagged });
}
