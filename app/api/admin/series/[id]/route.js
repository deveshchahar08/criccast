// app/api/admin/series/[id]/route.js — update + delete series
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Series from '@/models/Series';
import Match from '@/models/Match';
import SyncMeta from '@/models/SyncMeta';

export async function PUT(request, { params }) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  const { id } = await params;
  await dbConnect();
  const body = await request.json();
  const updated = await Series.findByIdAndUpdate(id, body, {
    new: true,
    runValidators: true, // without this, updates skip schema validation
  });
  if (!updated) return NextResponse.json({ error: 'Series not found' }, { status: 404 });
  return NextResponse.json({ series: updated });
}

export async function DELETE(request, { params }) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  const { id } = await params;
  await dbConnect();
  // Count matches BEFORE deleting — only blacklist series that HAD matches.
  // Empty series (0 matches) are not blacklisted: if the API later reports
  // matches for them, sync should re-create (Hy may want them then).
  const matchCount = await Match.countDocuments({ series: id });
  // Delete the series' matches too — orphans would render as broken cards.
  await Match.deleteMany({ series: id });
  const deleted = await Series.findByIdAndDelete(id);
  if (!deleted) return NextResponse.json({ error: 'Series not found' }, { status: 404 });
  // Blacklist the name so sync doesn't re-create it (Hy saw its matches and called it junk).
  // If Hy manually re-creates a series with the same name, it's un-blacklisted.
  const name = String(deleted.name || "").trim();
  if (name && matchCount > 0) {
    await SyncMeta.findOneAndUpdate(
      { key: "seriesBlacklist" },
      { $addToSet: { data: name } },
      { upsert: true }
    );
  }
  return NextResponse.json({ ok: true });
}
