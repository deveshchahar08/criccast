// Sitemap — tells Google about every page so new matches get indexed fast.
// Set NEXT_PUBLIC_SITE_URL to the real domain at deploy time.
import { getHomeMatches, getAllSeries } from "@/lib/queries";
import { getLiveNewsPosts } from "@/lib/news";

export const revalidate = 3600;

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://criccast.vercel.app").replace(/\/$/, "");
  const now = new Date();

  const [{ matches }, { series }, newsPosts] = await Promise.all([
    getHomeMatches({ limit: 5000 }),
    getAllSeries(),
    getLiveNewsPosts(),
  ]);

  return [
    { url: base, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/live`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/fixtures`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/dth-codes`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/series`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/news`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/news/all`, lastModified: now, changeFrequency: "daily", priority: 0.6 },
    ...matches.map((m) => ({
      url: `${base}/match/${m.id}`,
      lastModified: m.updatedAt ? new Date(m.updatedAt) : now,
      changeFrequency: "hourly",
      priority: 0.9,
    })),
    ...series.map((s) => ({
      url: `${base}/series/${s.slug}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    })),
    ...(newsPosts || []).map((p) => ({
      url: `${base}/news/${p.slug}`,
      lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
      changeFrequency: "weekly",
      priority: 0.7,
    })),
    { url: `${base}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/privacy-policy`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/disclaimer`, lastModified: now, changeFrequency: "monthly", priority: 0.3 },
  ];
}
