// lib/bustCache.js — instant cache bust for the cached list pages
// (speed pass, Nov 2026). Home, /fixtures, /series, /news and
// /news/all are served from a 120s ISR cache so navigation feels
// instant; every route that mutates content (admin verify / publish /
// update / delete / sync, the agent doors) calls bustSiteCache()
// after a successful write, so a change still shows on the public
// site at once — the cache only ever absorbs plain reads.
//
// Wrapped in try/catch on purpose: revalidatePath can only run inside
// a request/render scope, and a cache hiccup must NEVER fail the
// mutation itself — worst case the pages refresh on the 120s timer.
import { revalidatePath } from 'next/cache';

const CACHED_PATHS = ['/', '/fixtures', '/series', '/news', '/news/all'];

export function bustSiteCache() {
  try {
    for (const path of CACHED_PATHS) revalidatePath(path);
  } catch {
    /* never let a cache bust break the write that triggered it */
  }
}
