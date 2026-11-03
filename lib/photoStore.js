// lib/photoStore.js — the one place that puts a news photo into
// Vercel Blob and hands back its public URL. Both upload doors —
// the News Desk endpoint (app/api/admin/news/upload) and the agent
// door's "upload" action — go through here so the folder scheme,
// the size cap and the allowed types can never drift apart.
// The @vercel/blob SDK reads BLOB_READ_WRITE_TOKEN from the
// environment itself; photoStorageReady() lets callers answer a
// clean 503 when photo storage has not been set up yet.
import { put } from '@vercel/blob';

export const PHOTO_MAX_BYTES = 8 * 1024 * 1024;

// Content type → file extension. Anything outside this map is not
// an image the site will store.
export const PHOTO_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

export function photoStorageReady() {
  return !!process.env.BLOB_READ_WRITE_TOKEN;
}

// "Urvil Patel 200!!.JPG" → "urvil-patel-200": a URL-safe base name
// with no extension (storeNewsPhoto adds the real one back).
function sanitizeBase(filename) {
  const raw = String(filename || '').split(/[\\/]/).pop() || '';
  const noExt = raw.replace(/\.[a-z0-9]+$/i, '');
  const clean = noExt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/g, '');
  return clean || 'photo';
}

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

// Stores the photo under news/<yyyy>/<mm>/<base>-<suffix>.<ext>
// and returns { url, pathname }. `data` is anything @vercel/blob's
// put() accepts (a File from a form upload, a Buffer, …).
export async function storeNewsPhoto(data, filename, contentType) {
  const ext = PHOTO_TYPES[contentType] || 'bin';
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const pathname = `news/${yyyy}/${mm}/${sanitizeBase(filename)}-${randomSuffix()}.${ext}`;
  const blob = await put(pathname, data, { access: 'public', contentType });
  return { url: blob.url, pathname: blob.pathname };
}
