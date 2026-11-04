// PWA manifest — served by Next.js at /manifest.webmanifest.
// Purely additive: removing this file removes the install metadata cleanly.
export default function manifest() {
  return {
    name: "CricCast — Where to Watch Cricket in India",
    short_name: "CricCast",
    description:
      "Verified cricket broadcast info for India — TV channels, DTH channel numbers and OTT, for every match.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "en-IN",
    categories: ["sports"],
    background_color: "#E9F4FE",
    theme_color: "#0B2545",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
