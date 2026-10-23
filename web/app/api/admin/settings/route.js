// app/api/admin/settings/route.js — tiny site settings (token guarded).
// Currently one setting: the home-page note strip text (v61). Stored in
// SyncMeta so it can be changed from the admin with no rebuild/redeploy.
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import SyncMeta from '@/models/SyncMeta';

const NOTE_KEY = 'homeNote';
const MAX_LEN = 300;

async function readNote() {
  const doc = await SyncMeta.findOne({ key: NOTE_KEY }).lean();
  const text = doc && doc.data && typeof doc.data.text === 'string' ? doc.data.text : '';
  return text;
}

export async function GET(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  return NextResponse.json({ homeNote: await readNote() });
}

export async function PUT(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  const body = await request.json().catch(() => ({}));
  const text = String(body.homeNote || '').trim().slice(0, MAX_LEN);
  await SyncMeta.findOneAndUpdate(
    { key: NOTE_KEY },
    { $set: { data: { text }, updatedAt: new Date() } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true, homeNote: text });
}
