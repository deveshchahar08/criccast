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
