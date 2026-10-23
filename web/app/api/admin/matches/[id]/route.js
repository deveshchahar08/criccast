// app/api/admin/matches/[id]/route.js — update + delete match
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Match from '@/models/Match';

export async function PUT(request, { params }) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  const { id } = await params;
  await dbConnect();
  const body = await request.json();
  // v62: setting a fresh recheck flag (any admin path) re-arms the Telegram
  // bell for it — otherwise a match flagged twice would only ring once.
  if (body.recheckAt) body.recheckAlertedAt = null;
  // v66 start-time lock + v67 verified-stamp refresh. Both watch for a
  // MEANINGFUL edit — a change to what viewers rely on (the start time
  // or the broadcast). Cosmetic edits trigger neither: the lock guards
  // Hy's time correction from sync (an explicit startTimeLocked:false
  // is the Edit form's unlock path, respected as sent), and the
  // "Verified by us" stamp may only move when the info was actually
  // re-checked — a fresh stamp on unchecked info would be a lie.
  const bcastEmpty = (b) =>
    !b || ((b.tvChannels || []).length === 0 && (b.ottPlatforms || []).length === 0);
  const bcastChanged = (a, b) =>
    bcastEmpty(a) && bcastEmpty(b)
      ? false
      : bcastEmpty(a) !== bcastEmpty(b) ||
        JSON.stringify(a || {}) !== JSON.stringify(b || {});
  if (body.startTime || body.broadcastOverride !== undefined) {
    const current = await Match.findById(id)
      .select('startTime verifiedAt broadcastOverride')
      .lean();
    if (current) {
      const timeChanged =
        !!body.startTime &&
        new Date(body.startTime).getTime() !== new Date(current.startTime).getTime();
      if (timeChanged && body.startTimeLocked !== false) body.startTimeLocked = true;
      if (
        current.verifiedAt &&
        body.verifiedAt === undefined &&
        (timeChanged ||
          (body.broadcastOverride !== undefined &&
            bcastChanged(current.broadcastOverride, body.broadcastOverride)))
      ) {
        body.verifiedAt = new Date();
      }
    }
  }
  const updated = await Match.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true,
  });
  if (!updated) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  return NextResponse.json({ match: updated });
}

export async function DELETE(request, { params }) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  const { id } = await params;
  await dbConnect();
  const deleted = await Match.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
