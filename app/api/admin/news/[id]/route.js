// app/api/admin/news/[id]/route.js — update + delete one news post
// (token guarded). PUT is how the News Desk edits a post and flips
// its status: draft → live is THE publish action, live → draft
// unpublishes. DELETE removes the post for good (the desk's Clear).
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import NewsPost from '@/models/NewsPost';
import { pickNewsFields, slugify } from '@/lib/newsAdmin';

export async function PUT(request, { params }) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  const { id } = await params;
  await dbConnect();
  const body = await request.json().catch(() => ({}));
  const fields = pickNewsFields(body);
  if (body.slug) {
    const slug = slugify(body.slug);
    const clash = await NewsPost.findOne({ slug, _id: { $ne: id } }).lean();
    if (clash)
      return NextResponse.json({ error: 'Another post already uses this URL slug.' }, { status: 409 });
    fields.slug = slug;
  }
  if (fields.status && fields.status !== 'draft' && fields.status !== 'live')
    return NextResponse.json({ error: 'Status must be draft or live.' }, { status: 400 });
  const doc = await NewsPost.findByIdAndUpdate(id, fields, { new: true }).lean();
  if (!doc) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  return NextResponse.json({ post: { ...doc, id: String(doc._id) } });
}

export async function DELETE(request, { params }) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb())
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  const { id } = await params;
  await dbConnect();
  const doc = await NewsPost.findByIdAndDelete(id).lean();
  if (!doc) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
