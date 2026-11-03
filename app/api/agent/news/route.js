// app/api/agent/news/route.js — the news agent's door (trial-18).
//
// Why this exists: the news-desk agent scans sources around the clock
// and writes finished posts, but on CricCast publishing is Hy's
// personal call. This door lets the agent do exactly two things:
// leave a finished post as a DRAFT in the NewsPost collection, and
// (via the [id] route) flip a draft to live once Hy has personally
// approved it — that approval is collected on the agent side (his
// WhatsApp "publish" reply); this door only executes it. Nothing
// here can edit a post's content or delete anything.
//
// Hard limits, by design:
//  - Guarded by AGENT_SECRET (lib/agentAuth), the same x-agent-token
//    header as the coverage agent's ingest door — a separate
//    credential from ADMIN_TOKEN that can only do what these routes
//    allow.
//  - status is FORCED to "draft" on create. A status sent in the
//    request body is ignored, so this door can never create a post
//    that is already live.
//  - GET lists drafts only — the agent's pending-approval list.
import { NextResponse } from 'next/server';
import { checkAgentToken } from '@/lib/agentAuth';
import { dbConnect, hasDb } from '@/lib/db';
import NewsPost from '@/models/NewsPost';
import { slugify } from '@/lib/newsAdmin';

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

const CATEGORIES = ['Injury', 'Fitness', 'Squad', 'Match', 'Broadcast', 'Update'];
const str = (v) => (typeof v === 'string' ? v.trim() : '');

// Unknown or missing category falls back to "Update" (the brief's
// rule: unsure → Update — a wrong label is worse than a plain one).
function pickCategory(v) {
  const wanted = str(v).toLowerCase();
  return CATEGORIES.find((c) => c.toLowerCase() === wanted) || 'Update';
}

function pickBody(v) {
  if (Array.isArray(v)) return v.map((p) => String(p || '').trim()).filter(Boolean);
  if (typeof v === 'string') return v.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  return [];
}

function pickSources(v) {
  if (!Array.isArray(v)) return [];
  return v
    .map((s) => ({ name: str(s?.name), url: str(s?.url) }))
    .filter((s) => s.name || s.url);
}

// The agent sends image.url; the model field is src (same mapping the
// desk's rules use: no src → no image at all).
function pickImage(v) {
  if (!v || typeof v !== 'object') return null;
  const src = str(v.src) || str(v.url);
  if (!src) return null;
  const img = { src, alt: str(v.alt), credit: str(v.credit) };
  for (const k of ['caption', 'creditUrl', 'license', 'position']) {
    if (str(v[k])) img[k] = str(v[k]);
  }
  return img;
}

// GET /api/agent/news — drafts awaiting Hy's approval, newest first.
export async function GET(request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  await dbConnect();
  const docs = await NewsPost.find({ status: 'draft' })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({
    drafts: docs.map((d) => ({
      id: String(d._id),
      slug: d.slug,
      title: d.title,
      category: d.category || 'Update',
      topic: d.topic || '',
      createdAt: d.createdAt,
    })),
  });
}

// POST /api/agent/news — create a DRAFT post. Body: {
//   title (required), dek?, dekExtra?, tag?, topic?,
//   category? (Injury/Fitness/Squad/Match/Broadcast/Update),
//   top?, image?: { url|src, alt, credit }, body?: [paragraphs],
//   sources?: [{ name, url }], slug? (defaults to slugified title)
// }
export async function POST(request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  await dbConnect();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const title = str(body?.title);
  if (!title)
    return NextResponse.json({ error: 'A headline (title) is required.' }, { status: 400 });
  const slug = slugify(body?.slug || title);
  if (!slug)
    return NextResponse.json({ error: 'Could not make a URL slug from the headline.' }, { status: 400 });
  const existing = await NewsPost.findOne({ slug }).lean();
  if (existing)
    return NextResponse.json({ error: 'A post with this URL slug already exists.' }, { status: 409 });
  const doc = await NewsPost.create({
    slug,
    title,
    dek: str(body?.dek),
    dekExtra: str(body?.dekExtra),
    tag: str(body?.tag),
    topic: str(body?.topic),
    category: pickCategory(body?.category),
    top: body?.top === true,
    // FORCED — a status in the body is deliberately never read.
    status: 'draft',
    image: pickImage(body?.image),
    body: pickBody(body?.body),
    sources: pickSources(body?.sources),
  });
  return NextResponse.json(
    { post: { ...doc.toObject(), id: String(doc._id) } },
    { status: 201 }
  );
}
