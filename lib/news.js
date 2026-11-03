// lib/news.js
// The news data layer (database phase, Oct 27) — replaces the old
// file-based lib/newsData.js. Public reads return LIVE posts only,
// newest first, as plain objects in exactly the shape the news
// components have always consumed (publishedAt as an ISO string).
// When no database is connected the reads return empty lists, so
// pages render their "no news yet" states instead of crashing.
import { dbConnect, hasDb } from '@/lib/db';
import NewsPost from '@/models/NewsPost';

function toPlain(doc) {
  if (!doc) return null;
  const plain = { ...doc };
  delete plain._id;
  delete plain.__v;
  delete plain.createdAt;
  delete plain.updatedAt;
  plain.publishedAt = doc.publishedAt
    ? new Date(doc.publishedAt).toISOString()
    : null;
  return plain;
}

export async function getLiveNewsPosts() {
  if (!hasDb()) return [];
  await dbConnect();
  const docs = await NewsPost.find({ status: 'live' })
    .sort({ publishedAt: -1 })
    .lean();
  return docs.map(toPlain);
}

export async function getLiveNewsPost(slug) {
  if (!hasDb()) return null;
  await dbConnect();
  const doc = await NewsPost.findOne({ slug, status: 'live' }).lean();
  return toPlain(doc);
}

// ===== REAL board press releases for the "Official Board Press
// Releases" strip on /news — launch set (Nov 2026), each one opened
// and verified against the board/club's own site before inclusion.
// (Export name kept as dummyPressReleases for a minimal launch
// delta; the contents are real.) Later sets are refreshed with the
// news-desk agent's board-release collection. =====
export const dummyPressReleases = [
  {
    board: "BCCI",
    title: "India and India A squad updates for New Zealand Tour",
    publishedAt: "2026-10-30T15:30:00+05:30",
    href: "https://www.bcci.tv/news/article/india-and-india-a-squad-updates-for-new-zealand-tour",
  },
  {
    board: "Mumbai Indians",
    title:
      "Mumbai Indians thank Malinga, Mhambrey and Hopkinson for their contributions",
    publishedAt: "2026-10-29T17:00:00+05:30",
    href: "https://www.mumbaiindians.com/news/mumbai-indians-thank-lasith-malinga-paras-mhambrey-and-carl-hopkinson-for-their-contributions",
  },
  {
    board: "ICC",
    title: "Neck injury confirmed as New Zealand the focus for Smith",
    publishedAt: "2026-10-29T09:20:00+05:30",
    href: "https://www.icc-cricket.com/news/neck-injury-confirmed-as-new-zealand-the-focus-for-smith",
  },
  {
    board: "Cricket Ireland",
    title: "Replacement called up",
    publishedAt: "2026-10-28T21:06:00+05:30",
    href: "https://cricketireland.ie/news/replacement-called-up/",
  },
];
