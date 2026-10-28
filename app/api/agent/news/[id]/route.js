// app/api/agent/news/[id]/route.js — the publish half of the news
// agent's door (trial-18). POST {"action":"publish"} is the ONLY
// write here: it flips one draft to live and stamps publishedAt.
// There is deliberately no PUT/PATCH/DELETE on this door — the agent
// can never edit a post's content or remove one. Publishing is only
// ever called after Hy's personal approval, which is collected on
// the agent side; this route just executes it for the token holder.
// Re-publishing a live post is a no-op (idempotent), so a repeated
// approval message can never corrupt anything.
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

// POST /api/agent/news/<id>  {"action":"publish"}
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
  if (body?.action !== 'publish')
    return NextResponse.json(
      { error: 'Unsupported action. This door only accepts {"action":"publish"}.' },
      { status: 400 }
    );
  if (!mongoose.isValidObjectId(id))
    return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  const doc = await NewsPost.findById(id);
  if (!doc) return NextResponse.json({ error: 'Post not found.' }, { status: 404 });
  if (doc.status === 'draft') {
    doc.status = 'live';
    doc.publishedAt = new Date();
    await doc.save();
  }
  return NextResponse.json({ post: { ...doc.toObject(), id: String(doc._id) } });
}
