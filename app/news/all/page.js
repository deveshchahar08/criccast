// ALL NEWS — the complete news archive (trial-15, Hy's design):
// every story as the same full-size rows as /news, EIGHT per page,
// with a numbered pagination bar underneath (« ‹ 1 2 3 … › ») so
// readers step through the archive page by page and every page
// stays light. Pages are server-rendered slices (?page=N).
import Link from "next/link";
import { getLiveNewsPosts } from "@/lib/news";
import NewsListRows from "@/components/NewsListRows";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "All Cricket News | CricCast",
  description:
    "Every CricCast news story in one archive: squad announcements, player ins and outs, and official updates from the series we cover.",
};

const PER_PAGE = 8;

function pageHref(page) {
  return page <= 1 ? "/news/all" : `/news/all?page=${page}`;
}

// The numbers to show: all of them when there are few pages,
// otherwise the first, the last, and a window around the current
// page, with "…" filling the gaps.
function pageWindow(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const out = [];
  let prev = 0;
  for (const n of sorted) {
    if (prev && n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

const cellBase =
  "flex min-w-11 items-center justify-center px-3 py-2.5 text-[15px] font-semibold";

function Pagination({ current, total }) {
  if (total <= 1) return null;
  const last = total;
  const cell = (content, page, { disabled = false, active = false, label } = {}) =>
    disabled ? (
      <span
        key={label}
        aria-disabled="true"
        className={`${cellBase} cursor-not-allowed text-slate-300 dark:text-slate-600`}
      >
        {content}
      </span>
    ) : (
      <Link
        key={label}
        href={pageHref(page)}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`${cellBase} ${
          active
            ? "font-extrabold text-navy dark:text-white"
            : "text-sky-700 hover:bg-sky-50 dark:text-sky-300 dark:hover:bg-slate-800"
        }`}
      >
        {content}
      </Link>
    );

  return (
    <nav
      aria-label="News archive pages"
      className="mt-8 flex justify-center"
    >
      <div className="flex divide-x divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
        {cell("«", 1, { disabled: current === 1, label: "First page" })}
        {cell("‹", current - 1, { disabled: current === 1, label: "Previous page" })}
        {pageWindow(current, total).map((n, i) =>
          n === "…"
            ? cell("…", null, { disabled: true, label: `gap-${i}` })
            : cell(String(n), n, { active: n === current, label: `Page ${n}` })
        )}
        {cell("›", current + 1, { disabled: current === last, label: "Next page" })}
        {cell("»", last, { disabled: current === last, label: "Last page" })}
      </div>
    </nav>
  );
}

export default async function AllNewsPage({ searchParams }) {
  const sp = await searchParams;
  const posts = await getLiveNewsPosts();
  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const wanted = Number.parseInt(sp?.page, 10);
  const current = Number.isNaN(wanted) ? 1 : Math.min(Math.max(wanted, 1), totalPages);
  const pagePosts = posts.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6 md:max-w-4xl lg:max-w-6xl">
      <section className="pt-6">
        <p className="text-xs font-bold tracking-wide text-slate-400 dark:text-slate-500">
          <Link href="/news" className="text-sky-700 hover:underline dark:text-sky-300">
            News
          </Link>{" "}
          / All News
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-navy md:text-4xl dark:text-white">
          All News
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          Every story we have published — {posts.length} stories, newest
          first, {PER_PAGE} to a page.
        </p>
      </section>

      <div className="mt-6">
        {pagePosts.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            No news posts yet. Check back soon.
          </p>
        ) : (
          <NewsListRows posts={pagePosts} />
        )}
      </div>

      <Pagination current={current} total={totalPages} />
    </div>
  );
}
