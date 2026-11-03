// app/api/agent/news/[id]/route.js — the per-post half of the news
// agent's door (trial-18; image attach added Nov 3). Two writes live
// here, and nothing else:
//  - POST {"action":"publish"} flips one draft to live and stamps
//    publishedAt. Publishing is only ever called after Hy's personal
//    approval, which is collected on the agent side; this route just
//    executes it for the token holder. Re-publishing a live post is
//    a no-op (idempotent), so a repeated approval message can never
//    corrupt anything.
//  - POST {"action":"image", "image":{...}} attaches a photo to a
//    post whose image is still EMPTY (draft or live). It can only
//    ever fill the image field — an existing photo is never
//    overwritten through this door (409), and no other field
//    (title, dek, body, status, …) can be touched here.
// There is deliberately no PUT/PATCH/DELETE on this door — the agent
// can never edit a post's content or remove one.
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAgentToken } from '@/lib/agentAuth';
import { dbConnect, hasDb } from '@/lib/db';
import NewsPost from '@/models/NewsPost';

function noDb() {
  return NextResponse.json(
    { error: 'No database connected. Set MONGODB_URI to use this route.' },
    { status: 503 }
  );
}

function guard(request) {
  const auth = checkAgentToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb()) return noDb();
  return null;
}

const str = (v) => (typeof v === 'string' ? v.trim() : '');

// The agent sends image.url; the model field is src (same mapping as
// the create route's pickImage). Returns null on anything invalid:
// no src, a non-http(s) src, or an empty credit line.
function pickDoorImage(v, fallbackAlt) {
  if (!v || typeof v !== 'object') return null;
  const src = str(v.src) || str(v.url);
  if (!src) return null;
  let parsed;
  try {
    parsed = new URL(src);
  } catch {
    return null;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  const credit = str(v.credit);
  if (!credit) return null;
  const img = { src, alt: str(v.alt) || fallbackAlt, credit };
  for (const k of ['caption', 'creditUrl', 'license', 'position']) {
    if (str(v[k])) img[k] = str(v[k]);
  }
  return img;
}

// POST /api/agent/news/<id>  {"action":"publish"} | {"action":"image", "image":{…}}
export async function POST(request, { params }) {
  const blocked = guard(request);
  if (blocked) return blocked;
  await dbConnect();
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const action = body?.action;
  if (action !== 'publish' && action !== 'image')
    return NextResponse.json(
      { error: 'Unsupported action. This door only accepts {"action":"publish"} or {"action":"image"}.' },
      { status: 400 }
    );
  // The param is normally the post's ObjectId — but a live post's id
  // is exposed nowhere public (pages and search expose only the
  // slug), so a non-ObjectId param is resolved as a slug instead.
  const doc = mongoose.isValidObjectId(id)
    ? await NewsPost.findById(id)
    : await NewsPost.findOne({ slug: id });
  if (!doc) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  if (action === 'publish') {
    if (doc.status === 'draft') {
      doc.status = 'live';
      doc.publishedAt = new Date();
      await doc.save();
    }
    return NextResponse.json({ post: { ...doc.toObject(), id: String(doc._id) } });
  }
  // action === 'image' — fill an EMPTY image only, touch nothing else.
  const image = pickDoorImage(body?.image, doc.title);
  if (!image)
    return NextResponse.json(
      { error: 'A valid image is required: an http(s) "src" (or "url") and a non-empty "credit".' },
      { status: 400 }
    );
  if (str(doc.image?.src))
    return NextResponse.json(
      { error: 'This post already has a photo. The door never overwrites an existing image.' },
      { status: 409 }
    );
  doc.image = image;
  await doc.save();
  return NextResponse.json({ ok: true, id: String(doc._id), slug: doc.slug, image });
}
