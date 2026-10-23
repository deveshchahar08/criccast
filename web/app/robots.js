// robots.txt — allow everything, point crawlers at the sitemap.
export default function robots() {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://criccast.vercel.app").replace(/\/$/, "");
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${base}/sitemap.xml`,
  };
}
