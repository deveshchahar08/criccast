// app/api/search/route.js — grouped search for the header overlay.
// Display-shaped results: matches / series / news (see lib/search.js
// for the matcher). Queries under 2 chars return empty groups.
import { NextResponse } from 'next/server';
import { searchSite } from '@/lib/search';
import { formatDayTimeIST } from '@/lib/format';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 2) {
    return NextResponse.json({ matches: [], series: [], news: [] });
  }
  const { matches, series, news } = await searchSite(q);
  return NextResponse.json({
    matches: matches.map((m) => ({
      id: m.id,
      title: (m.teams || []).join(' vs '),
      sub: [m.seriesName, m.startTime ? formatDayTimeIST(m.startTime) : '']
        .filter(Boolean)
        .join(' · '),
    })),
    series: series.map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name,
      sub: [s.format, s.season].filter(Boolean).join(' · '),
    })),
    news: news.map((p) => ({
      slug: p.slug,
      title: p.title,
      sub: p.tag || '',
    })),
  });
}
