import Link from "next/link";

const exploreLinks = [
  { href: "/", label: "Home" },
  { href: "/fixtures", label: "Fixtures" },
  { href: "/dth-codes", label: "DTH Codes" },
  { href: "/series", label: "Series" },
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
      <ul className="mt-2 space-y-1.5">
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
      <div className="mx-auto max-w-2xl px-4 py-8 md:max-w-4xl lg:max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-navy dark:text-white">
              <img
                src="/logo.png"
                alt="CricCast logo"
                className="h-7 w-7 rounded-lg"
              />
              <span>
                Cric<span className="text-sky-600 dark:text-sky-400">Cast</span>
              </span>
            </p>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              Which TV channel and OTT app is showing the cricket match? Verified broadcast
              guide for India — TV channels, streaming apps, and DTH channel numbers.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-6 md:gap-12">
            <LinkGroup title="Explore" links={exploreLinks} />
            <LinkGroup title="CricCast" links={companyLinks} />
          </div>
        </div>
        <p className="mt-6 border-t border-slate-100 pt-4 text-[11px] text-slate-400 dark:border-slate-800 dark:text-slate-500">
          Broadcast info is curated and verified by us. Channel numbers vary by DTH
          operator and region — confirm on your set-top box guide.
        </p>
      </div>
    </footer>
  );
}
