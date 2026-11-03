// NEWS — short, original cricket news posts (trial, Oct 2026).
// Facts only, written in our own words, a source link in every post
// (the hard rules live in the news-desk brief). Mainly about the series
// CricCast covers, so every post links into its series/match pages.
//
// Layout (Hy's "Design 2" spotlight, trial-15 list design):
// 1) SPOTLIGHT cover banner for the latest post — the page's only dark
//    element; 2) a two-column block — "Latest News" full-size rows
//    (big photo + two-line summary + meta), SIX of them, with a SHORT
//    "Top Stories" box of FIVE beside them (curated posts flagged
//    `top` in the data, natural height — deliberately NOT stretched
//    to match the list, unlike the home rail); 3) a "See All News"
//    link to the paginated /news/all archive; 4) an "Official Board
//    Press Releases" strip (dummy data for now).
import Link from "next/link";
import { getLiveNewsPosts, dummyPressReleases } from "@/lib/news";
import { NewsSpotlight, NewsRailItem } from "@/components/NewsRow";
import NewsListRows from "@/components/NewsListRows";
import { timeAgo } from "@/lib/format";

// Dynamic on purpose (database phase): the News Desk's Make Live /
// Delete must show here at once — a cached listing once served a
// build-time "no news yet" snapshot while the database had posts.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cricket News — Squad Updates, Team News & Tour Updates | CricCast",
  description:
    "Short, factual cricket news from the series CricCast covers: squad announcements, player ins and outs, and official updates — with links to where to watch every match.",
};

function PressReleaseCard({ release }) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
      <p className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-extrabold tracking-wide text-sky-700 dark:text-sky-300">
          {release.board}
        </span>
        <span className="text-[10px] font-bold tracking-widest text-slate-400 dark:text-slate-500">
          OFFICIAL RELEASE
        </span>
      </p>
      <h3 className="mt-2 line-clamp-3 text-sm font-extrabold leading-snug tracking-tight text-navy dark:text-white">
        {release.title}
      </h3>
      <p className="mt-auto flex items-center justify-between gap-2 pt-3 text-xs font-medium text-slate-400 dark:text-slate-500">
        <time dateTime={release.publishedAt}>
          {timeAgo(release.publishedAt)}
        </time>
        <a
          href={release.href}
          className="font-bold text-sky-600 hover:text-sky-700 dark:text-sky-400"
        >
          Read at source ↗
        </a>
      </p>
    </article>
  );
}

export default async function NewsPage() {
  const posts = await getLiveNewsPosts();
  const [featured, ...rest] = posts;

  // Top Stories box: posts the editors flagged `top` first (the
  // spotlight post is excluded — it never repeats in the box), then
  // the newest remaining stories fill the box up to FIVE.
  const topStories = [
    ...rest.filter((p) => p.top),
    ...rest.filter((p) => !p.top),
  ].slice(0, 5);

  // The Latest News block shows the SIX newest stories after the
  // spotlight; everything lives in the paginated /news/all archive.
  const latestSix = rest.slice(0, 6);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-6 md:max-w-4xl lg:max-w-6xl">
      <section className="pt-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-[11px] font-extrabold tracking-widest text-sky-700 dark:bg-sky-950 dark:text-sky-300">
          CRICCAST NEWS
        </span>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-navy md:text-4xl dark:text-white">
          Cricket News
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-slate-500 dark:text-slate-400">
          Squad announcements, player ins and outs, and official updates from
          the series we cover — short, factual, and always linked to where
          you can watch the matches.
        </p>
      </section>

      {posts.length === 0 ? (
        <p className="mt-5 rounded-xl bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
          No news posts yet. Check back soon.
        </p>
      ) : (
        <>
          {/* 1) SPOTLIGHT cover story: the latest post as a full-bleed
              photo banner with the headline over it (Design 2). */}
          <div className="mt-5">
            <NewsSpotlight post={featured} />
          </div>

          {/* 2) Latest News rows + Top Stories box. The box is a
              SHORT, natural-height card (curated picks) — it ends
              where its stories end while the list runs on below it;
              it is deliberately NOT height-matched to the list
              (that rule belongs to the home rail only). */}
          {rest.length > 0 && (
            <div className="mt-8 lg:grid lg:grid-cols-3 lg:gap-6">
              <section aria-label="Latest news" className="lg:col-span-2">
                <h2 className="text-base font-extrabold tracking-tight text-navy md:text-lg dark:text-white">
                  Latest News
                </h2>
                <div className="mt-3">
                  <NewsListRows posts={latestSix} />
                </div>
              </section>
              {/* lg:mt-10 = the "Latest News" heading line (28px) +
                  its mt-3 gap (12px), so the box's top edge lines up
                  exactly with the first strip's card (Hy's call). */}
              <aside className="mt-8 lg:mt-10">
                <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
                  <h2 className="text-base font-extrabold tracking-tight text-navy dark:text-white">
                    Top Stories
                  </h2>
                  <div className="mt-2 flex flex-col gap-0.5">
                    {topStories.map((p) => (
                      <NewsRailItem key={p.slug} post={p} />
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </>
      )}

      {/* 3) See All News — sits ABOVE the press-releases box and
          opens the paginated archive of every story. */}
      {posts.length > 0 && (
        <div className="mt-8 text-center">
          <Link
            href="/news/all"
            className="inline-block rounded-full border-[1.5px] border-sky-600 px-6 py-2.5 text-sm font-bold text-sky-700 transition hover:bg-sky-600 hover:text-white dark:border-sky-500 dark:text-sky-300 dark:hover:bg-sky-600 dark:hover:text-white"
          >
            See All News →
          </Link>
        </div>
      )}

      {/* 4) Official Board Press Releases — dummy entries for the
          design preview; real board releases replace them in the
          database phase. */}
      <section className="mt-10">
        <h2 className="text-base font-extrabold tracking-tight text-navy md:text-lg dark:text-white">
          Official Board Press Releases
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Direct from the boards — BCCI, ICC and other official releases.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dummyPressReleases.map((r) => (
            <PressReleaseCard key={`${r.board}-${r.title}`} release={r} />
          ))}
        </div>
      </section>
    </div>
  );
}
