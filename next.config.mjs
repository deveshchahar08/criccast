/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Every remote host a live news photo is served from (home + /news
    // crawled 2026-11-04). Listing them here only PERMITS the Next.js
    // image optimizer to fetch from them — components/NewsPhoto.jsx
    // keeps its own, empirically verified allowlist and falls back to
    // a plain <img> for any host the optimizer cannot actually fetch.
    remotePatterns: [
      { protocol: "https", hostname: "assets-webp.khelnow.com" },
      { protocol: "https", hostname: "assets.khelnow.com" },
      { protocol: "https", hostname: "bik6vsqkrwq5dvf4.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "cdn.vivasport.com" },
      { protocol: "https", hostname: "cf-img-a-in.tosshub.com" },
      { protocol: "https", hostname: "content.api.news" },
      { protocol: "https", hostname: "cricketnamibia.com" },
      { protocol: "https", hostname: "d2lnbwhcsmj8tp.cloudfront.net" },
      { protocol: "https", hostname: "e0.365dm.com" },
      { protocol: "https", hostname: "english.cdn.zeenews.com" },
      { protocol: "https", hostname: "images.icc-cricket.com" },
      { protocol: "https", hostname: "images.mykhel.com" },
      { protocol: "https", hostname: "img-cdn.publive.online" },
      { protocol: "https", hostname: "img.cricketnmore.com" },
      { protocol: "https", hostname: "img.ipl.com" },
      { protocol: "https", hostname: "media.crictracker.com" },
      { protocol: "https", hostname: "onecricketnews.akamaized.net" },
      { protocol: "https", hostname: "resources.brisbane-heat.pulselive.com" },
      { protocol: "https", hostname: "resources.cricket-australia.pulselive.com" },
      { protocol: "https", hostname: "resources.perth-scorchers.pulselive.com" },
      { protocol: "https", hostname: "revsportz.in" },
      { protocol: "https", hostname: "st1.latestly.com" },
      { protocol: "https", hostname: "static.cricbuzz.com" },
      { protocol: "https", hostname: "www.bcci.tv" },
      { protocol: "https", hostname: "www.geosuper.tv" },
      { protocol: "https", hostname: "www.ipl.com" },
      { protocol: "https", hostname: "www.tbsnews.net" },
      { protocol: "https", hostname: "www.thenews.pk" },
      { protocol: "https", hostname: "www.tribuneindia.com" },
      { protocol: "https", hostname: "www.wisden.com" },
    ],
  },
};

export default nextConfig;
