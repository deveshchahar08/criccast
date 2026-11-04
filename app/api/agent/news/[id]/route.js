// app/api/agent/news/[id]/route.js — the per-post half of the news
// agent's door (trial-18; image attach Nov 3; full control added
// Nov 3 on Hy's order, so news fixes no longer need a code push).
// Every action here executes only on Hy's word — his approval is
// collected on the agent side; this route just executes it for the
// token holder. Four actions:
//  - POST {"action":"publish"} flips one draft to live and stamps
//    publishedAt. Re-publishing a live post is a no-op (idempotent),
//    so a repeated approval message can never corrupt anything.
//  - POST {"action":"image", "image":{...}} attaches a photo to a
//    post whose image is still EMPTY (draft or live). It can only
//    ever fill the image field — an existing photo is never
//    overwritten through this action (409).
//  - POST {"action":"update", "fields":{...}} edits the whitelisted
//    fields of an existing post (title, dek, dekExtra, tag, topic,
//    category, top, publishedAt, body, sources, related, image).
//    Here "image" DOES replace the photo — or clears it when sent
//    as null. slug, status and the ids are NOT in the whitelist and
//    can never change through this door.
//  - POST {"action":"delete"} removes the post for good.
//  - POST {"action":"upload", "data":<base64>, "filename":…,
//    "contentType":…, "image":{credit…}} stores the photo bytes in
//    Vercel Blob and REPLACES the post's photo with the stored URL
//    (same validation as update's image: credit is mandatory, alt
//    falls back to the post title).
import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { checkAgentToken } from '@/lib/agentAuth';
import { dbConnect, hasDb } from '@/lib/db';
import NewsPost from '@/models/NewsPost';
import { PHOTO_MAX_BYTES, PHOTO_TYPES, photoStorageReady, storeNewsPhoto } from '@/lib/photoStore';
import { bustSiteCache } from '@/lib/bustCache';

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

const CATEGORIES = ['Injury', 'Fitness', 'Squad', 'Match', 'Broadcast', 'Update'];

// Unknown or missing category falls back to "Update" (same rule as
// the create route: unsure → Update).
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

// Image picker for the "update" action, where the photo is being
// REPLACED (or, with image:null, cleared by the caller instead).
// Like pickDoorImage, but a site-relative path ("/news/…") is also
// valid here — the photo file can live on the site itself. A credit
// line is still mandatory. Returns null on anything invalid.
function pickReplaceImage(v, fallbackAlt) {
  if (!v || typeof v !== 'object') return null;
  const src = str(v.src) || str(v.url);
  if (!src) return null;
  if (src.startsWith('/')) {
    if (src.startsWith('//')) return null; // protocol-relative = off-site
  } else {
    let parsed;
    try {
      parsed = new URL(src);
    } catch {
      return null;
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
  }
  const credit = str(v.credit);
  if (!credit) return null;
  const img = { src, alt: str(v.alt) || fallbackAlt, credit };
  for (const k of ['caption', 'creditUrl', 'license', 'position']) {
    if (str(v[k])) img[k] = str(v[k]);
  }
  return img;
}

// The ONLY fields an "update" may touch. slug, status, _id and the
// timestamps are deliberately absent — they can never change here.
const UPDATE_FIELDS = [
  'title', 'dek', 'dekExtra', 'tag', 'topic', 'category',
  'top', 'publishedAt', 'body', 'sources', 'related', 'image',
];

// POST /api/agent/news/<id>  {"action":"publish"} | {"action":"image", "image":{…}}
//   | {"action":"update", "fields":{…}} | {"action":"delete"}
//   | {"action":"upload", "data":<base64>, "filename":…, "contentType":…, "image":{…}}
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
  if (action !== 'publish' && action !== 'image' && action !== 'update' && action !== 'delete' && action !== 'upload')
    return NextResponse.json(
      { error: 'Unsupported action. This door accepts {"action":"publish"}, {"action":"image"}, {"action":"update"}, {"action":"delete"} and {"action":"upload"}.' },
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
      bustSiteCache();
    }
    return NextResponse.json({ post: { ...doc.toObject(), id: String(doc._id) } });
  }
  if (action === 'delete') return deletePost(doc);
  if (action === 'update') return updatePost(doc, body);
  if (action === 'upload') return uploadPhoto(doc, body);
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
  bustSiteCache();
  return NextResponse.json({ ok: true, id: String(doc._id), slug: doc.slug, image });
}

async function deletePost(doc) {
  const id = String(doc._id);
  const slug = doc.slug;
  await doc.deleteOne();
  bustSiteCache();
  return NextResponse.json({ ok: true, id, slug, deleted: true });
}

async function updatePost(doc, body) {
  const fields = body?.fields;
  if (!fields || typeof fields !== 'object' || Array.isArray(fields))
    return NextResponse.json(
      { error: 'The "update" action needs a "fields" object.' },
      { status: 400 }
    );
  const keys = UPDATE_FIELDS.filter((k) => fields[k] !== undefined);
  if (keys.length === 0)
    return NextResponse.json(
      { error: 'Nothing to update: "fields" held no editable field.' },
      { status: 400 }
    );
  // Validate and normalise EVERYTHING before touching the doc, so a
  // bad value can never leave an update half-applied.
  const patch = {};
  for (const k of keys) {
    switch (k) {
      case 'title': {
        const t = str(fields.title);
        if (!t)
          return NextResponse.json({ error: 'The title cannot be empty.' }, { status: 400 });
        patch.title = t;
        break;
      }
      case 'dek':
      case 'dekExtra':
      case 'tag':
      case 'topic':
        patch[k] = str(fields[k]);
        break;
      case 'category':
        patch.category = pickCategory(fields.category);
        break;
      case 'top':
        patch.top = fields.top === true;
        break;
      case 'publishedAt': {
        const d = new Date(fields.publishedAt);
        if (Number.isNaN(d.getTime()))
          return NextResponse.json(
            { error: '"publishedAt" is not a valid date.' },
            { status: 400 }
          );
        patch.publishedAt = d;
        break;
      }
      case 'body':
        patch.body = pickBody(fields.body);
        break;
      case 'sources':
        patch.sources = pickSources(fields.sources);
        break;
      case 'related': {
        if (fields.related === null) {
          patch.related = null;
          break;
        }
        const href = str(fields.related?.href);
        patch.related = href ? { label: str(fields.related?.label), href } : null;
        break;
      }
      case 'image': {
        if (fields.image === null) {
          patch.image = null; // clear → the header falls back to the brand block
          break;
        }
        const img = pickReplaceImage(fields.image, patch.title || doc.title);
        if (!img)
          return NextResponse.json(
            {
              error:
                'A valid image is required: an http(s) or site-relative ("/…") "src" (or "url") and a non-empty "credit" — or null to clear the photo.',
            },
            { status: 400 }
          );
        patch.image = img;
        break;
      }
    }
  }
  Object.assign(doc, patch);
  await doc.save();
  bustSiteCache();
  return NextResponse.json({
    ok: true,
    id: String(doc._id),
    slug: doc.slug,
    post: { ...doc.toObject(), id: String(doc._id) },
  });
}

// POST {"action":"upload", "data":<base64>, "filename":…,
// "contentType":…, "image":{credit…}} — the photo bytes arrive in
// the body (this door speaks JSON only), are stored in Vercel Blob,
// and the stored URL REPLACES the post's photo with exactly the
// update action's image semantics (pickReplaceImage: credit is
// mandatory, alt falls back to the post title).
async function uploadPhoto(doc, body) {
  if (!photoStorageReady())
    return NextResponse.json(
      { error: 'Photo storage is not set up yet. Add a Vercel Blob store to enable uploads.' },
      { status: 503 }
    );
  const contentType = str(body?.contentType);
  if (!PHOTO_TYPES[contentType])
    return NextResponse.json(
      { error: 'A valid "contentType" is required: image/jpeg, image/png, image/webp or image/gif.' },
      { status: 400 }
    );
  let data = typeof body?.data === 'string' ? body.data.replace(/\s+/g, '') : '';
  if (data.startsWith('data:')) data = data.split(',', 2)[1] || ''; // tolerate a data: URL
  if (!data)
    return NextResponse.json(
      { error: 'The image "data" (base64) is missing.' },
      { status: 400 }
    );
  // Base64 inflates bytes by ~4/3 — reject an oversize body before
  // decoding it, then check the real byte count as well.
  if (data.length > Math.ceil(PHOTO_MAX_BYTES / 3) * 4 + 4)
    return NextResponse.json(
      { error: 'That photo is over the 8 MB upload limit.' },
      { status: 400 }
    );
  const bytes = Buffer.from(data, 'base64');
  if (bytes.length === 0)
    return NextResponse.json(
      { error: 'The image "data" did not decode to any bytes.' },
      { status: 400 }
    );
  if (bytes.length > PHOTO_MAX_BYTES)
    return NextResponse.json(
      { error: 'That photo is over the 8 MB upload limit.' },
      { status: 400 }
    );
  // Credit is mandatory — check BEFORE uploading so a bad request
  // never leaves an orphan file sitting in storage.
  if (!str(body?.image?.credit))
    return NextResponse.json(
      { error: 'A valid image is required: a non-empty "credit" (alt falls back to the post title).' },
      { status: 400 }
    );
  let stored;
  try {
    stored = await storeNewsPhoto(bytes, str(body?.filename) || 'photo', contentType);
  } catch {
    return NextResponse.json(
      { error: 'The photo upload failed. Please try again.' },
      { status: 502 }
    );
  }
  const image = pickReplaceImage({ ...(body?.image || {}), src: stored.url }, doc.title);
  if (!image)
    return NextResponse.json(
      { error: 'A valid image is required: a non-empty "credit" (alt falls back to the post title).' },
      { status: 400 }
    );
  doc.image = image;
  await doc.save();
  bustSiteCache();
  return NextResponse.json({ ok: true, id: String(doc._id), slug: doc.slug, image });
}
