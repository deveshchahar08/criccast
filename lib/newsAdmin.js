// lib/newsAdmin.js
// Shared helpers for the admin news API routes (list/create in
// app/api/admin/news/route.js, update/delete in its [id] route).

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

// The editable fields. Anything else in a request body is ignored
// on purpose, so a stray key can never reach the model.
export const NEWS_FIELDS = [
  'title', 'dek', 'dekExtra', 'tag', 'topic', 'category', 'top',
  'status', 'publishedAt', 'image', 'body', 'related', 'sources',
];

export function pickNewsFields(body) {
  const out = {};
  for (const key of NEWS_FIELDS) {
    if (body[key] === undefined) continue;
    out[key] = body[key];
  }
  // The desk edits the body as one textarea: blank line = new paragraph.
  if (typeof out.body === 'string') {
    out.body = out.body.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  }
  if (out.publishedAt) out.publishedAt = new Date(out.publishedAt);
  if (out.image && !out.image.src) out.image = null;
  if (out.related && !out.related.href) out.related = null;
  return out;
}
