// app/api/matches/[id]/route.js — public match detail
import { NextResponse } from 'next/server';
import { getMatchById } from '@/lib/queries';

// NOTE: in this Next.js version `params` is a Promise — must await it.
export async function GET(request, { params }) {
  const { id } = await params;
  const { match } = await getMatchById(id);
  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
  return NextResponse.json({ match });
}
