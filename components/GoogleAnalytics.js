// Google Analytics 4 (gtag.js) — loaded once in the root layout.
// Measurement ID is a public identifier (it prints in the page source),
// not a secret. Page views are sent from the route-change effect below
// (send_page_view is off in the initial config so the first view is not
// double-counted). Admin pages are excluded — Hy's own admin visits
// should not pollute the visitor stats.
"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

const GA_ID = "G-2DN7LES4EG";

function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    const query = searchParams?.toString();
    window.gtag("config", GA_ID, {
      page_path: query ? `${pathname}?${query}` : pathname,
    });
  }, [pathname, searchParams]);

  return null;
}

export default function GoogleAnalytics() {
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${GA_ID}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
    </>
  );
}
