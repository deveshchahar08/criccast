"use client";

// NewsPhoto — a news post's photo, served through the Next.js image
// optimizer whenever possible, with a browser-side self-heal so a
// photo can never stay broken (self-heal pass, Nov 2026).
//
// Why the optimizer: cards display photos at ≤ ~480px wide, but raw
// <img> tags ship the publishers' full-size originals (one stored
// photo alone was 149 KB). The optimizer resizes + recompresses per
// device.
//
// Why optimizer-first for EVERY https host (not an allowlist): an
// allowlist meant every new bad host was a code change + redeploy —
// production proved the class is real when cdn.vivasport.com started
// answering the optimizer 502 while its photos loaded fine directly.
// So the only hosts that skip the optimizer are the three in
// DIRECT_PHOTO_HOSTS, each empirically bad for the optimizer's own
// server-side fetch (no browser headers, no referer):
// - images.mykhel.com — 403, hotlink protection
// - st1.latestly.com — no server-side response at all
// - cdn.vivasport.com — optimizer 502 in production (2026-11-04)
// while its photos load fine straight from the browser.
//
// The safety net for every OTHER host, present or future: if the
// optimizer ever fails a photo — any host, any reason — the browser
// reports it through the image's onError and this component swaps
// that one photo to the plain direct <img> (identical markup to the
// direct path below). No code fix, no redeploy, ever. The failure is
// keyed to the src that failed, so a reused component instance given
// a new src tries the optimizer for it afresh. The direct <img>
// carries no onError, so a photo whose original is itself gone just
// stays broken — there is no retry loop.
//
// OPTIMIZED_PHOTO_HOSTS is kept as the record of hosts probed good
// on 2026-11-04 (bare server-side fetch: 200 + image content-type);
// the component's gating no longer consults it — DIRECT_PHOTO_HOSTS
// plus the self-heal decide — but the list stays exported and
// truthful for future tooling.
//
// Site-relative photos ("/news/…", the site's own files in public/)
// optimize too, under the same safety net. Non-https or unparseable
// srcs render direct, as they always have.
//
// First render is deterministic — optimized unless a rule above says
// direct — so server and client markup never disagree; the swap, if
// it happens, happens after the browser reports the failure.
//
// Rendering contract (unchanged; matches the <img> tags this
// replaced):
// - `className` is the photo box's classes (size / aspect / rounding),
//   exactly as the old <img> carried them. On the optimized path they
//   sit on a wrapper span and the image fills it; on the direct path
//   they sit on the <img> itself, unchanged.
// - `style.objectPosition` is honoured on both paths.
// - `imgClassName` holds classes that belong to the <img> element
//   itself (e.g. the spotlight's hover zoom): applied to the inner
//   image on the optimized path, merged onto the <img> on direct.
// - `loading` passes through ("lazy" stays lazy; heroes/spotlights
//   pass "eager").
import { useState } from "react";
import Image from "next/image";

export const OPTIMIZED_PHOTO_HOSTS = new Set([
  "assets-webp.khelnow.com",
  "assets.khelnow.com",
  "bik6vsqkrwq5dvf4.public.blob.vercel-storage.com",
  "cf-img-a-in.tosshub.com",
  "content.api.news",
  "cricketnamibia.com",
  "d2lnbwhcsmj8tp.cloudfront.net",
  "e0.365dm.com",
  "english.cdn.zeenews.com",
  "images.icc-cricket.com",
  "img-cdn.publive.online",
  "img.cricketnmore.com",
  "media.crictracker.com",
  "onecricketnews.akamaized.net",
  "resources.brisbane-heat.pulselive.com",
  "resources.cricket-australia.pulselive.com",
  "resources.perth-scorchers.pulselive.com",
  "revsportz.in",
  "static.cricbuzz.com",
  "www.bcci.tv",
  "www.geosuper.tv",
  "www.ipl.com",
  "www.tbsnews.net",
  "www.thenews.pk",
  "www.tribuneindia.com",
  "www.wisden.com",
]);

export const DIRECT_PHOTO_HOSTS = new Set([
  "cdn.vivasport.com",
  "images.mykhel.com",
  "st1.latestly.com",
]);

// "optimized" = try the Next.js image optimizer (with the self-heal
// net); "direct" = plain <img> from the start.
function routeFor(src) {
  if (!src) return "direct";
  if (src.startsWith("/")) return "optimized"; // the site's own photo files
  try {
    const u = new URL(src);
    if (u.protocol !== "https:") return "direct";
    if (DIRECT_PHOTO_HOSTS.has(u.hostname)) return "direct";
    return "optimized";
  } catch {
    return "direct";
  }
}

export default function NewsPhoto({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  style,
  loading,
  sizes = "(max-width: 768px) 100vw, 480px",
}) {
  // The src whose optimized load the browser reported as failed.
  // Keyed by value: a different src retries the optimizer.
  const [failedSrc, setFailedSrc] = useState(null);

  if (routeFor(src) === "direct" || failedSrc === src) {
    const cls = imgClassName ? `${className} ${imgClassName}` : className;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} loading={loading} style={style} className={cls} />
    );
  }
  const { objectPosition, ...restStyle } = style || {};
  // The spotlight passes an absolutely-positioned box; every other
  // caller passes an in-flow box that the wrapper must position.
  const selfPositioned = /(^|\s)(absolute|fixed)(\s|$)/.test(className);
  return (
    <span
      className={`${selfPositioned ? "" : "relative "}block overflow-hidden ${className}`}
      style={restStyle}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        loading={loading}
        onError={() => setFailedSrc(src)}
        style={{ objectFit: "cover", objectPosition: objectPosition || "50% 30%" }}
        className={imgClassName}
      />
    </span>
  );
}
