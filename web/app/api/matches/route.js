// app/api/matches/route.js — public feed: live + upcoming matches
import { NextResponse } from 'next/server';
import { getHomeMatches } from '@/lib/queries';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const { matches, sample } = await getHomeMatches({
    seriesId: searchParams.get('series') || undefined,
  });
  const res = NextResponse.json({ matches });
  if (sample) res.headers.set('x-data-source', 'sample');
  return res;
}
