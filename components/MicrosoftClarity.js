// Microsoft Clarity — anonymous session behaviour (scrolls, clicks,
// heatmaps, recordings with text inputs masked) so we can see how real
// visitors actually use the pages, not just how many arrived.
//
// The Project ID is a public identifier (it prints in the page source),
// not a secret. It is read from NEXT_PUBLIC_CLARITY_ID so it can be set
// per-environment in Vercel without a code change; while the variable is
// empty this component renders nothing and the site is unaffected.
// Admin pages are excluded — Clarity never records the admin panel.
"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID;

export default function MicrosoftClarity() {
  const pathname = usePathname();
  if (!CLARITY_ID) return null;
  if (pathname?.startsWith("/admin")) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${CLARITY_ID}");
      `}
    </Script>
  );
}
