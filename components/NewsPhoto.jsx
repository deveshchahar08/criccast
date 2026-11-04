// NewsPhoto — a news post's photo, served through the Next.js image
// optimizer when the photo's host allows it (speed pass, Nov 2026).
//
// Why: cards display photos at ≤ ~480px wide, but the raw <img> tags
// shipped the publishers' full-size originals (one stored photo alone
// was 149 KB). The optimizer resizes + recompresses per device.
//
// The allowlist below is EMPIRICAL, not hopeful: on 2026-11-04 every
// live photo host was probed with a bare server-side fetch (no
// browser headers, no referer — the conditions the optimizer's own
// fetch faces), and only the hosts listed here answered 200 with an
// image content-type. Deliberately EXCLUDED after failing that probe:
// images.mykhel.com (403 — hotlink protection) and st1.latestly.com
// (no server-side response). Any other src — an excluded host, an
// http:// URL, or a source added later — falls back to a plain <img>
// with the identical classes, so a photo can never break because of
// this component; it can only stay unoptimized. Site-relative photos
// ("/news/…", the site's own files in public/) always optimize —
// they need no remote pattern.
//
// Rendering contract (matches the <img> tags this replaces):
// - `className` is the photo box's classes (size / aspect / rounding),
//   exactly as the old <img> carried them. On the optimized path they
//   sit on a wrapper span and the image fills it; on the fallback path
//   they sit on the <img> itself, unchanged.
// - `style.objectPosition` is honoured on both paths.
// - `imgClassName` holds classes that belong to the <img> element
//   itself (e.g. the spotlight's hover zoom): applied to the inner
//   image on the optimized path, merged onto the <img> on fallback.
// - `loading` passes through ("lazy" stays lazy; heroes/spotlights
//   pass "eager").
import Image from "next/image";

export const OPTIMIZED_PHOTO_HOSTS = new Set([
  "assets-webp.khelnow.com",
  "assets.khelnow.com",
  "bik6vsqkrwq5dvf4.public.blob.vercel-storage.com",
  "cdn.vivasport.com",
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

function isOptimized(src) {
  if (!src) return false;
  if (src.startsWith("/")) return true; // the site's own photo files
  try {
    const u = new URL(src);
    return u.protocol === "https:" && OPTIMIZED_PHOTO_HOSTS.has(u.hostname);
  } catch {
    return false;
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
  if (!isOptimized(src)) {
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
        style={{ objectFit: "cover", objectPosition: objectPosition || "50% 30%" }}
        className={imgClassName}
      />
    </span>
  );
}
