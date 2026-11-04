// app/api/admin/news/seed/route.js — one-time starter seed (token guarded)
// Fills an EMPTY NewsPost collection with the five hand-written
// starter posts (lib/newsSeed.js), all as live. Refuses to run when
// any post already exists, so it can never duplicate or overwrite
// the desk's real content. The trial dummy posts are not in the
// seed — they were design filler and are gone for good.
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import NewsPost from '@/models/NewsPost';
import { newsSeedPosts } from '@/lib/newsSeed';
import { bustSiteCache } from '@/lib/bustCache';

export async function POST(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  const count = await NewsPost.countDocuments();
  if (count > 0)
    return NextResponse.json(
      { error: `News already has ${count} post(s) — seed only runs on an empty collection.` },
      { status: 409 }
    );
  const docs = newsSeedPosts.map((p) => ({
    ...p,
    status: 'live',
    publishedAt: new Date(p.publishedAt),
  }));
  await NewsPost.insertMany(docs);
  bustSiteCache();
  return NextResponse.json({ ok: true, seeded: docs.length });
}
