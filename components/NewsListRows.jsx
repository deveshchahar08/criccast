// NewsListRows — the news index list (trial-14/15, Hy's design):
// full-size rows in ONE white card separated by hairlines — big 16:9
// photo on the left (~45% of the row), headline, the FULL two-line
// summary (dek, clamped at 2 lines — never more), and a meta line
// (series • time) on the right. Nothing is shrunk versus the
// ESPNcricinfo proportions Hy approved. Server-rendered: the caller
// decides how many posts to pass (6 on /news, one page of 8 on
// /news/all) — pagination keeps every page light.
import Link from "next/link";
import { NewsThumb, ViewsCount } from "./NewsRow";
import { timeAgo } from "@/lib/format";

function NewsListRow({ post }) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group flex flex-col gap-4 p-4 sm:flex-row sm:gap-5 sm:p-5"
    >
      <NewsThumb
        post={post}
        className="aspect-[16/9] w-full shrink-0 rounded-xl sm:w-[290px] lg:w-[320px]"
      />
      <div className="min-w-0">
        <h3 className="text-[17px] font-extrabold leading-snug tracking-tight text-navy group-hover:text-sky-700 lg:text-lg dark:text-white dark:group-hover:text-sky-300">
          {post.title}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-slate-500 lg:text-[15px] dark:text-slate-400">
          {post.dek}
        </p>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-2 text-xs font-bold text-slate-400 dark:text-slate-500">
          <span className="font-extrabold tracking-wide text-sky-700 dark:text-sky-300">
            {post.tag}
          </span>
          <span aria-hidden>•</span>
          <time dateTime={post.publishedAt}>{timeAgo(post.publishedAt)}</time>
          <span aria-hidden>•</span>
          <ViewsCount views={post.views} />
        </p>
      </div>
    </Link>
  );
}

export default function NewsListRows({ posts }) {
  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
      {posts.map((p) => (
        <NewsListRow key={p.slug} post={p} />
      ))}
    </div>
  );
}
