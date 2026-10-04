// Sitemap — tells Google about every page so new matches get indexed fast.
// Set NEXT_PUBLIC_SITE_URL to the real domain at deploy time.
import { getHomeMatches, getAllSeries } from "@/lib/queries";

export default async function sitemap() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://criccast.vercel.app").replace(/\/$/, "");
  const now = new Date();

  const [{ matches }, { series }] = await Promise.all([
    getHomeMatches({}),
    getAllSeries(),
  ]);

  return [
    { url: base, lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/fixtures`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${base}/dth-codes`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/series`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    ...matches.map((m) => ({
      url: `${base}/match/${m.id}`,
      lastModified: m.updatedAt ? new Date(m.updatedAt) : now,
      changeFrequency: "hourly",
      priority: 0.9,
    })),
    ...series.map((s) => ({
      url: `${base}/?series=${s.id}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.6,
    })),
  ];
}
