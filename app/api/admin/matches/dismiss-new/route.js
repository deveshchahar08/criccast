// app/api/admin/matches/dismiss-new/route.js — skip ALL matches in the admin "New" box (token guarded)
// "New" = arrived in the last 3 days, unverified, not skipped. Skipping only
// stamps dismissedNewAt — the matches stay in the Action needed list as usual.
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Match from '@/models/Match';

export async function POST(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  const res = await Match.updateMany(
    {
      createdAt: { $gte: new Date(Date.now() - 3 * 24 * 3600 * 1000) },
      dismissedNewAt: null,
      verifiedAt: null,
    },
    { $set: { dismissedNewAt: new Date() } }
  );
  return NextResponse.json({ ok: true, dismissed: res.modifiedCount || 0 });
}
