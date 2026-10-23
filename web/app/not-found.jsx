export const metadata = {
  title: "Page Not Found | CricCast",
  description:
    "The page you are looking for does not exist on CricCast. Find where to watch cricket matches on TV & OTT in India.",
};

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center md:py-28">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-extrabold tracking-widest text-sky-700 dark:bg-sky-950 dark:text-sky-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
        ERROR 404
      </span>
      <div className="mt-6 text-8xl font-extrabold tracking-tight text-navy dark:text-white md:text-9xl">
        4<span className="text-sky-600">0</span>4
      </div>
      <h1 className="mt-4 text-2xl font-extrabold text-navy dark:text-white">
        This page doesn&rsquo;t exist
      </h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-slate-600 dark:text-slate-300">
        The link you followed may be broken, or the page may have been removed.
        If you were looking for a match, it may have finished &mdash; check the
        fixtures for upcoming games.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <a
          href="/"
          className="rounded-full bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-sky-700"
        >
          Back to Home
        </a>
        <a
          href="/fixtures"
          className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-navy transition hover:border-sky-600 hover:text-sky-700 dark:border-slate-700 dark:text-slate-100 dark:hover:border-sky-500 dark:hover:text-sky-300"
        >
          View Fixtures
        </a>
      </div>
    </div>
  );
}
