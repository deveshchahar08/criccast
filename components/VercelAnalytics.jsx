// Vercel Web Analytics — page-view counts from Vercel's own dashboard, an
// independent second meter next to Google Analytics (GA stays the main
// one; this cross-checks it and is near-real-time). No cookies are set.
// Admin pages are excluded, same rule as GoogleAnalytics — Hy's own admin
// visits should not pollute the visitor stats.
"use client";

import { Analytics } from "@vercel/analytics/next";
import { usePathname } from "next/navigation";

export default function VercelAnalytics() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;
  return <Analytics />;
}
