// app/api/admin/news/upload/route.js — News Desk photo upload
// (token guarded, exactly like every other admin route). Receives
// one photo file as multipart form data, stores it in Vercel Blob
// and returns the public URL. The desk then puts that URL in the
// post's Image field and the normal Save persists it — this route
// never touches a post itself.
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { PHOTO_MAX_BYTES, PHOTO_TYPES, photoStorageReady, storeNewsPhoto } from '@/lib/photoStore';
import { bustSiteCache } from '@/lib/bustCache';

export async function POST(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!photoStorageReady())
    return NextResponse.json(
      { error: 'Photo storage is not set up yet. Add a Vercel Blob store to enable uploads.' },
      { status: 503 }
    );
  let form;
  try {
    form = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected a multipart form upload with a "file" field.' },
      { status: 400 }
    );
  }
  const file = form.get('file');
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function')
    return NextResponse.json({ error: 'No photo file was uploaded.' }, { status: 400 });
  if (!PHOTO_TYPES[file.type])
    return NextResponse.json(
      { error: 'Only JPG, PNG, WebP or GIF images can be uploaded.' },
      { status: 400 }
    );
  if (file.size === 0)
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });
  if (file.size > PHOTO_MAX_BYTES)
    return NextResponse.json(
      { error: 'That photo is over the 8 MB upload limit.' },
      { status: 400 }
    );
  try {
    const { url, pathname } = await storeNewsPhoto(file, file.name, file.type);
    bustSiteCache();
    return NextResponse.json({ ok: true, url, pathname });
  } catch {
    return NextResponse.json(
      { error: 'The photo upload failed. Please try again.' },
      { status: 502 }
    );
  }
}
