/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Every remote host a live news photo is served from (home + /news
    // crawled 2026-11-04), plus a wildcard so a photo host added later
    // is optimizer-eligible without a config change. Listing a host
    // here only PERMITS the Next.js image optimizer to fetch from it —
    // components/NewsPhoto.jsx sends its few known-bad hosts direct
    // and self-heals in the browser (plain <img>) any photo the
    // optimizer cannot actually fetch.
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
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
