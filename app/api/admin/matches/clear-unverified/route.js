// app/api/admin/matches/clear-unverified/route.js — bulk delete unverified matches (token guarded)
// Unverified matches are disposable: the next sync re-fetches any still relevant.
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Match from '@/models/Match';

export async function DELETE(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  const result = await Match.deleteMany({
    $or: [{ verifiedAt: null }, { verifiedAt: { $exists: false } }],
  });
  return NextResponse.json({ deleted: result.deletedCount || 0 });
}
