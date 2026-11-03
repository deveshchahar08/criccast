// app/api/admin/news/route.js — list + create news posts (token guarded)
// GET returns EVERY post (drafts and live), drafts first, then newest —
// the admin News Desk's working list. POST creates a post; new posts
// are drafts unless the desk explicitly sends status:"live".
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import NewsPost from '@/models/NewsPost';
import { pickNewsFields, slugify } from '@/lib/newsAdmin';

export async function GET(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  const docs = await NewsPost.find({}).sort({ publishedAt: -1 }).lean();
  const posts = docs.map((d) => ({ ...d, id: String(d._id), views: d.views || 0 }));
  // Drafts first (they are waiting on Hy), then live, newest first in each.
  posts.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'draft' ? -1 : 1;
    return new Date(b.publishedAt) - new Date(a.publishedAt);
  });
  return NextResponse.json({ posts });
}

export async function POST(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  await dbConnect();
  const body = await request.json().catch(() => ({}));
  const fields = pickNewsFields(body);
  if (!fields.title)
    return NextResponse.json({ error: 'A headline (title) is required.' }, { status: 400 });
  const slug = slugify(body.slug || fields.title);
  if (!slug)
    return NextResponse.json({ error: 'Could not make a URL slug from the headline.' }, { status: 400 });
  const existing = await NewsPost.findOne({ slug }).lean();
  if (existing)
    return NextResponse.json({ error: 'A post with this URL slug already exists.' }, { status: 409 });
  const doc = await NewsPost.create({
    ...fields,
    slug,
    status: fields.status === 'live' ? 'live' : 'draft',
    publishedAt: fields.publishedAt || new Date(),
  });
  return NextResponse.json({ post: { ...doc.toObject(), id: String(doc._id) } }, { status: 201 });
}
