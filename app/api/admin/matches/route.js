// app/api/admin/matches/route.js — list + create matches (token guarded)
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Match from '@/models/Match';
import Series from '@/models/Series';

export async function GET(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  // Admin is for verifying UPCOMING matches — show those first (soonest),
  // not the 50 oldest. Finished matches need no verification.
  const docs = await Match.find({
    startTime: { $gte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
  })
    .populate('series')
    .sort({ startTime: 1 })
    .limit(200)
    .lean();
  // lean() docs have _id but no id virtual — the admin UI uses m.id
  // (list keys, Verify/Delete). Map it explicitly.
  const matches = docs.map((d) => ({
    ...d,
    id: String(d._id),
    seriesName: d.series?.name || '',
  }));
  return NextResponse.json({ matches });
}

export async function POST(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  const body = await request.json();
  // The admin form sends seriesId; the Match model requires `series` (ObjectId).
  const { seriesId, ...rest } = body;
  if (!seriesId) return NextResponse.json({ error: 'Series is required.' }, { status: 400 });
  try {
    // Manual matches inherit the series format (e.g. "Test") so multi-day
    // visibility rules apply even when the form leaves format blank.
    const seriesDoc = await Series.findById(seriesId).lean();
    const created = await Match.create({
      format: seriesDoc?.format || '',
      ...rest,
      series: seriesId,
    });
    return NextResponse.json({ match: created }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || 'Create failed.' }, { status: 400 });
  }
}
