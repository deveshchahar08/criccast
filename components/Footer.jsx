import Link from "next/link";

const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "/live", label: "Live Matches" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/dth-codes", label: "DTH Codes" },
  { href: "/series", label: "Series" },
  { href: "/news", label: "News" },
];

const companyLinks = [
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact Us" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
];

function LinkGroup({ title, links }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="text-[13px] font-semibold text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-8 md:max-w-4xl md:py-10 lg:max-w-6xl">
        {/* Balanced grid: wide brand block, the two link columns, then
            the Get-the-App block. On mobile the brand spans the top,
            the link columns sit in a 2-column row, and the app block
            follows full-width. */}
        <div className="grid grid-cols-2 items-start gap-x-6 gap-y-8 md:grid-cols-[1.5fr_1fr_1fr_1.3fr] md:gap-x-10">
          <div className="col-span-2 md:col-span-1">
            <p className="flex items-center gap-2.5 text-[28px] font-extrabold tracking-tight text-navy dark:text-white">
              <img
                src="/logo.png"
                alt="CricCast logo"
                className="h-11 w-11 rounded-xl"
              />
              <span>
                Cric<span className="text-sky-600 dark:text-sky-400">Cast</span>
              </span>
            </p>
            <p className="mt-2.5 max-w-sm text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              Which TV channel and OTT app is showing the cricket match? Verified broadcast
              guide for India — TV channels, streaming apps, and DTH channel numbers.
            </p>
          </div>

          <LinkGroup title="Explore" links={exploreLinks} />
          <LinkGroup title="CricCast" links={companyLinks} />

          <div className="col-span-2 md:col-span-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Get the App
            </p>
            <p className="mt-3 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              CricCast on your home screen. No app store needed.
            </p>
            <a
              href="/install"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-white transition hover:bg-primary-dark"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download App
            </a>
            <p className="mt-3.5">
              <a
                href="https://x.com/CricCast_in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-600 hover:text-sky-600 dark:text-slate-300 dark:hover:text-sky-400"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                Follow @CricCast_in
              </a>
            </p>
          </div>
        </div>

        {/* Bottom bar: copyright left, the curated line right. */}
        <div className="mt-9 flex flex-col gap-1.5 border-t border-slate-100 pt-4 md:flex-row md:items-center md:justify-between md:gap-6 dark:border-slate-800">
          <p className="shrink-0 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            © 2026 CricCast — Where to watch cricket in India
          </p>
          <p className="text-[11px] text-slate-400 md:max-w-xl md:text-right dark:text-slate-500">
            Broadcast info is curated and verified by us. Channel numbers vary by DTH
            operator and region — confirm on your set-top box guide.
          </p>
        </div>
      </div>
    </footer>
  );
}
