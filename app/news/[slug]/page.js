// app/news/[slug]/page.js — one news post (trial, Oct 2026).
// If the post carries a free-licence photo (Wikimedia Commons, see
// the NewsPost record) it leads the article with a credit line under it;
// otherwise the header is a styled navy brand block — the news rules
// ban lifted press/board images, so one of these two IS the graphic.
// Every post ends with a "Where to watch" box into the related series
// page and a Sources list — both are part of the format, not extras.
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLiveNewsPost, getLiveNewsPosts } from "@/lib/news";
import { timeAgo } from "@/lib/format";
import { NewsRail } from "@/components/NewsRow";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { slug } = await params; // Next.js 16: params is a Promise
  const post = await getLiveNewsPost(slug);
  if (!post) return { title: "News post not found — CricCast" };
  return {
    title: `${post.title} | CricCast News`,
    description: post.dek,
  };
}

function formatDateIST(iso) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default async function NewsPostPage({ params }) {
  const { slug } = await params;
  const post = await getLiveNewsPost(slug);
  if (!post) notFound();

  // Latest News rail: every other post, newest first — the rail's list
  // area scrolls (shared NewsRail), so there is no item cap. If this is
  // the only post in the data, the rail shows its own row instead of
  // sitting empty.
  const railOthers = (await getLiveNewsPosts()).filter((p) => p.slug !== post.slug);
  const railPosts = railOthers.length > 0 ? railOthers : [post];

  return (
    <div className="mx-auto max-w-2xl px-4 pt-4 pb-6 md:max-w-3xl lg:max-w-6xl">
      <div className="lg:grid lg:grid-cols-[minmax(0,42rem)_340px] lg:justify-between lg:gap-8">
        <div>
      <Link href="/news" className="text-sm font-bold text-sky-600 hover:underline">
        ← All news
      </Link>

      {post.image ? (
        <>
          {/* Photo header — free-licence image only, credit underneath */}
          <figure className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.image.src}
              alt={post.image.alt}
              style={{ objectPosition: post.image.position || "50% 30%" }}
              className="aspect-[16/9] w-full rounded-2xl object-cover shadow-card"
            />
            <figcaption className="mt-1.5 text-[11px] font-medium text-slate-400 dark:text-slate-500">
              {post.image.caption && <>{post.image.caption} · </>}
              Photo:{" "}
              <a
                href={post.image.creditUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-sky-600 hover:underline dark:text-sky-400"
              >
                {post.image.credit}
              </a>{" "}
              · {post.image.license}
            </figcaption>
          </figure>
          <header className="mt-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-sky-700 dark:bg-sky-950 dark:text-sky-300">
                {post.tag}
              </span>
              <time
                dateTime={post.publishedAt}
                className="text-xs font-medium text-slate-400 dark:text-slate-500"
              >
                {formatDateIST(post.publishedAt)} · {timeAgo(post.publishedAt)}
              </time>
              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                👁 {post.views || 0} views
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-navy md:text-3xl dark:text-white">
              {post.title}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
              {post.dek}
            </p>
          </header>
        </>
      ) : (
        /* Brand header block — fallback graphic when no free photo exists */
        <header className="mt-3 overflow-hidden rounded-2xl bg-navy shadow-card">
          <div className="h-1.5 bg-sky-500" />
          <div className="px-5 py-6 md:px-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-sky-200">
                {post.tag}
              </span>
              <time
                dateTime={post.publishedAt}
                className="text-xs font-medium text-slate-300"
              >
                {formatDateIST(post.publishedAt)} · {timeAgo(post.publishedAt)}
              </time>
              <span className="text-xs font-medium text-slate-300">
                👁 {post.views || 0} views
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-white md:text-3xl">
              {post.title}
            </h1>
            <p className="mt-2 text-[15px] leading-relaxed text-slate-300">
              {post.dek}
            </p>
            <p className="mt-4 text-[11px] font-extrabold tracking-widest text-sky-400">
              CRICCAST NEWS
            </p>
          </div>
        </header>
      )}

      {/* Body */}
      <article className="mt-5 space-y-4">
        {post.body.map((para, i) => (
          <p
            key={i}
            className="text-[15px] leading-relaxed text-slate-600 dark:text-slate-300"
          >
            {para}
          </p>
        ))}
      </article>

      {/* Where to watch — every post links into the fixtures it talks about */}
      {post.related && (
        <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-base font-extrabold text-navy dark:text-white">
            Where to watch
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            TV channels, OTT apps and DTH channel numbers for this series —
            verified by us.
          </p>
          <Link
            href={post.related.href}
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700"
          >
            {post.related.label}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </Link>
        </section>
      )}

      {/* Sources — every post names where its facts came from */}
      {post.sources?.length > 0 && (
        <section className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-800">
          <h2 className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Sources
          </h2>
          <ul className="mt-2 space-y-1.5">
            {post.sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-semibold text-sky-600 hover:text-sky-700 hover:underline dark:text-sky-400"
                >
                  {s.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
        </div>

        {/* Latest News rail — beside the article on lg, below it on
            mobile. Scrollable list (shared NewsRail); the "More news"
            link stays outside the scroll area. */}
        <aside className="mt-8 lg:mt-0">
          <NewsRail
            posts={railPosts}
            className="lg:sticky lg:top-20"
            footer={
              <Link
                href="/news"
                className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
              >
                More news
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </Link>
            }
          />
        </aside>
      </div>
    </div>
  );
}
