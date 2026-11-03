// News thumbnail + list row (trial, Oct 2026) — shared by the /news
// index and the home "Latest News" strip so both look identical.
// Photo only ever comes from the post's free-licence image (see
// the NewsPost record); posts without one get a navy brand block with a
// newspaper glyph instead — never a lifted press photo.
import Link from "next/link";
import { timeAgo } from "@/lib/format";

export function NewsThumb({ post, className = "" }) {
  if (post.image) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={post.image.src}
        alt={post.image.alt}
        loading="lazy"
        style={{ objectPosition: post.image.position || "50% 30%" }}
        className={`${className} object-cover`}
      />
    );
  }
  return (
    <div
      aria-hidden
      className={`${className} flex items-center justify-center bg-navy dark:bg-slate-800`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-8 w-8 text-sky-400"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path
          d="M4 22h15a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-4 0V9M10 6h7v4h-7zM10 14h7M10 18h4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export default function NewsRow({ post }) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="flex gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-card transition hover:border-sky-200 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-800"
    >
      <NewsThumb post={post} className="h-20 w-24 shrink-0 rounded-xl" />
      <div className="min-w-0">
        <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">
          <span className="font-extrabold tracking-wide text-sky-700 dark:text-sky-300">
            {post.tag}
          </span>
          <time dateTime={post.publishedAt}>{timeAgo(post.publishedAt)}</time>
        </p>
        <h3 className="mt-1 line-clamp-3 text-[15px] font-extrabold leading-snug tracking-tight text-navy dark:text-white">
          {post.title}
        </h3>
      </div>
    </Link>
  );
}

// Compact photo card (home, lg): photo on top, headline under it.
// Used for the three posts that follow the featured one in the sketch.
// Posts WITH a photo also carry a small story-type chip on the photo's
// top-left corner (Stitch design 3); imageless cards get no chip —
// the navy fallback block stands on its own.
export function NewsCard({ post }) {
  const chipLabel = post.image
    ? NEWS_CATEGORY_CHIP_LABELS[post.category]
    : null;
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <Link href={`/news/${post.slug}`} className="block">
        <div className="relative">
          <NewsThumb post={post} className="aspect-[16/9] w-full" />
          {chipLabel && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-navy/85 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
              {chipLabel}
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="flex flex-wrap items-center gap-x-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">
            <span className="font-extrabold tracking-wide text-sky-700 dark:text-sky-300">
              {post.tag}
            </span>
            <time dateTime={post.publishedAt}>{timeAgo(post.publishedAt)}</time>
          </p>
          <h3 className="mt-1 line-clamp-3 text-sm font-extrabold leading-snug tracking-tight text-navy dark:text-white">
            {post.title}
          </h3>
        </div>
      </Link>
    </article>
  );
}

// Featured story card — SPLIT layout (Fix Round 2, Oct 2026; balance
// pass in trial-13, Hy's point: the 50/50 split made the photo a tall
// slab and left the short text floating in white space). Now: photo
// LEFT ~42%, text RIGHT ~58% on a soft sky-tinted panel; the text
// column carries more matter (dek up to 4 lines + an optional
// dekExtra "detail" line with a sky accent bar) and a bottom meta
// row (category label + Read more) pinned via mt-auto, so the panel
// reads full at any headline length. Mobile stacks: 16:9 photo on
// top, tinted text below. No image → the left block is the navy
// brand block. Total desktop height stays modest (~280–320px via
// sm:min-h-[280px]).
export function NewsFeatured({ post }) {
  const chipLabel = NEWS_CATEGORY_CHIP_LABELS[post.category];
  return (
    <article className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-card dark:border-slate-800 dark:bg-slate-900">
      <Link href={`/news/${post.slug}`} className="block sm:flex sm:min-h-[280px]">
        <NewsThumb
          post={post}
          className="aspect-[16/9] w-full sm:aspect-auto sm:w-[42%] sm:shrink-0"
        />
        <div className="flex flex-col bg-gradient-to-br from-sky-50 via-white to-white p-4 sm:w-[58%] md:p-6 dark:from-sky-950/40 dark:via-slate-900 dark:to-slate-900">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-sky-700 shadow-sm dark:bg-sky-950 dark:text-sky-300 dark:shadow-none">
              {post.tag}
            </span>
            <time
              dateTime={post.publishedAt}
              className="shrink-0 text-xs font-medium text-slate-400 dark:text-slate-500"
            >
              {timeAgo(post.publishedAt)}
            </time>
          </div>
          <h3 className="mt-2.5 text-xl font-extrabold leading-snug tracking-tight text-navy md:text-2xl dark:text-white">
            {post.title}
          </h3>
          <p className="mt-1.5 line-clamp-4 text-sm leading-relaxed text-slate-500 md:text-[15px] dark:text-slate-400">
            {post.dek}
          </p>
          {post.dekExtra && (
            <p className="mt-2.5 border-l-2 border-sky-500 pl-2.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
              {post.dekExtra}
            </p>
          )}
          <div className="mt-auto flex items-center justify-between gap-2 pt-3">
            {chipLabel ? (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-navy dark:text-sky-300">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-sky-600 dark:bg-sky-400" />
                {chipLabel}
              </span>
            ) : (
              <span />
            )}
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-sky-600 dark:text-sky-400">
              Read more
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}

// Spotlight cover story (/news index only, Design 2 in the site's own
// light theme): the latest post as a magazine-style cover banner —
// full-bleed photo, bottom-to-top dark gradient, white headline and a
// sky "Read Full Story" button anchored bottom-left. This is the ONLY
// dark element on the page; everything around it stays light. No photo
// → navy gradient block with a large newspaper glyph behind the same
// overlay. The whole banner is one Link.
export function NewsSpotlight({ post }) {
  return (
    <article className="shadow-card">
      <Link
        href={`/news/${post.slug}`}
        className="group relative block h-[400px] overflow-hidden rounded-2xl md:h-[460px]"
      >
        {post.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image.src}
            alt={post.image.alt}
            style={{ objectPosition: post.image.position || "50% 30%" }}
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy via-navy to-sky-900 dark:from-slate-900 dark:to-slate-800"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-28 w-28 text-sky-400/50"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            >
              <path
                d="M4 22h15a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-4 0V9M10 6h7v4h-7zM10 14h7M10 18h4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-sky-600 px-2.5 py-1 text-[11px] font-extrabold tracking-widest text-white">
              SPOTLIGHT
            </span>
            <span className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white">
              {post.tag}
            </span>
            <time
              dateTime={post.publishedAt}
              className="text-xs font-medium text-white/70"
            >
              {timeAgo(post.publishedAt)}
            </time>
          </div>
          <h2 className="mt-3 max-w-3xl text-2xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
            {post.title}
          </h2>
          <p className="mt-2 hidden max-w-2xl text-[15px] leading-relaxed text-white/85 line-clamp-2 sm:block">
            {post.dek}
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white transition group-hover:bg-sky-500">
            Read Full Story
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </article>
  );
}

// Post category → photo-corner chip label (NewsCard only, Stitch
// design 3 — Hy's call Oct 26): a small story-type chip sits on the
// card photo's top-left corner. The rail keeps its photo thumbnails
// (an icon rail was tried and dropped by the owner the same day).
export const NEWS_CATEGORY_CHIP_LABELS = {
  Injury: "INJURY ALERT",
  Fitness: "FITNESS UPDATE",
  Squad: "SQUAD UPDATE",
  Match: "MATCH REPORT",
  Broadcast: "BROADCAST",
  Update: "UPDATE",
};

// One compact headline row inside the Latest News rail: small thumb,
// two-line headline, time. Deliberately chrome-less (no card border of
// its own) — rows live inside the rail's white card.
export function NewsRailItem({ post }) {
  return (
    <Link
      href={`/news/${post.slug}`}
      className="group flex items-start gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-50 dark:hover:bg-slate-800/60"
    >
      <NewsThumb post={post} className="h-16 w-16 shrink-0 rounded-lg" />
      <div className="min-w-0 pt-0.5">
        <h3 className="line-clamp-2 text-[13px] font-extrabold leading-snug tracking-tight text-navy group-hover:text-sky-700 dark:text-white dark:group-hover:text-sky-300">
          {post.title}
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[11px] font-bold text-slate-400 dark:text-slate-500">
          <span className="font-extrabold tracking-wide text-sky-700 dark:text-sky-300">
            {post.tag}
          </span>
          <time dateTime={post.publishedAt}>{timeAgo(post.publishedAt)}</time>
        </p>
      </div>
    </Link>
  );
}

// The shared "Latest News" rail, two variants:
// - "scroll" (default): a white card whose list area has a fixed max
//   height and scrolls MANUALLY (thin scrollbar + a soft fade at the
//   bottom as the scroll hint) — no auto-scroll, by Hy's call. Used on
//   the post page, where the article is long. `footer` (e.g. a
//   "More news →" link) renders OUTSIDE the scroll area.
// - "drawer" (Fix Round 2, home only): ONE full-height drawer — the
//   card stretches to the full height of its grid area, NO sticky, NO
//   inner scroll, NO fade; the latest 10 posts are listed and a
//   "View all news →" footer is pinned to the bottom via mt-auto. The
//   sticky + inner-scroll combo on home felt short and stuck.
export function NewsRail({ posts, footer = null, className = "", variant = "scroll" }) {
  if (!posts || posts.length === 0) return null;
  if (variant === "fill") {
    // "fill" (home, Hy's call Oct 26): the card is EXACTLY as tall as
    // the left column — never longer, never shorter, NOT sticky.
    // Mechanism (trial-10, restored in trial-13 after trial-12's
    // regression): on lg the card is ABSOLUTELY positioned
    // (lg:absolute lg:inset-0) inside the relative aside, so it is
    // OUT of the grid's flow — its long list contributes NOTHING to
    // the row height, the row is set by the left column alone, and
    // the card is stretched over exactly that height. An in-flow
    // h-full card does NOT work here: a CSS grid row sizes to the
    // tallest item's content, so the rail stretches the row to its
    // own full height (the trial-8/9 + trial-12 failure, measured).
    // The list inside takes the remaining height (flex-1 + min-h-0)
    // and scrolls manually with the soft bottom fade; the footer
    // sits below the scroll area, pinned. On mobile the card is
    // in-flow and the list is capped (max-h-[540px] below).
    return (
      <div
        className={`flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-card lg:absolute lg:inset-0 dark:border-slate-800 dark:bg-slate-900 ${className}`}
      >
        <h2 className="text-base font-extrabold tracking-tight text-navy dark:text-white">
          Latest News
        </h2>
        <div className="relative mt-2 min-h-0 flex-1">
          <div className="thin-scrollbar max-h-[540px] h-full overflow-y-auto pr-1.5 lg:max-h-none">
            <div className="flex flex-col gap-0.5 pb-6">
              {posts.map((p) => (
                <NewsRailItem key={p.slug} post={p} />
              ))}
            </div>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-slate-900"
          />
        </div>
        <div className="pt-3">
          {footer ?? (
            <Link
              href="/news"
              className="inline-flex items-center gap-1 text-sm font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
            >
              View all news
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    );
  }
  if (variant === "drawer") {
    const shown = posts.slice(0, 10);
    return (
      <div
        className={`flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 ${className}`}
      >
        <h2 className="text-base font-extrabold tracking-tight text-navy dark:text-white">
          Latest News
        </h2>
        <div className="mt-2 flex flex-col gap-0.5">
          {shown.map((p) => (
            <NewsRailItem key={p.slug} post={p} />
          ))}
        </div>
        <div className="mt-auto pt-3">
          {footer ?? (
            <Link
              href="/news"
              className="inline-flex items-center gap-1 text-sm font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
            >
              View all news
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    );
  }
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      <h2 className="text-base font-extrabold tracking-tight text-navy dark:text-white">
        Latest News
      </h2>
      <div className="relative mt-2">
        <div className="thin-scrollbar max-h-[560px] overflow-y-auto pr-1.5">
          <div className="flex flex-col gap-0.5 pb-6">
            {posts.map((p) => (
              <NewsRailItem key={p.slug} post={p} />
            ))}
          </div>
        </div>
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent dark:from-slate-900"
        />
      </div>
      {footer}
    </div>
  );
}
