import Link from "next/link";
import { getLiveCount } from "@/lib/queries";
import ThemeToggle from "./ThemeToggle";
import NavLinks from "./NavLinks";

export default async function TopBar() {
  const liveCount = await getLiveCount();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4 md:max-w-4xl lg:max-w-6xl">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2">
            <img
              src="/logo.png"
              alt="CricCast logo"
              className="h-8 w-8 rounded-lg"
            />
            <span className="text-lg font-extrabold tracking-tight text-navy dark:text-white">
              Cric<span className="text-sky-600 dark:text-sky-400">Cast</span>
            </span>
          </Link>
          {liveCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-red-600 dark:bg-red-950 dark:text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              {liveCount} LIVE NOW
            </span>
          )}
        </div>

        {/* Desktop nav — mobile uses the bottom bar instead */}
        <NavLinks />

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link
            href="/search"
            aria-label="Search"
            className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  );
}
