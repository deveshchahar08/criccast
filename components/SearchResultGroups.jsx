// SearchResultGroups — the grouped result lists (Matches → Series →
// News) shared by the header SearchBox overlay and the home hero
// search bar, so both in-page search surfaces look and behave the
// same. Input is the /api/search response shape; onNavigate fires
// when a row is chosen (callers close their panel).
import Link from "next/link";

const groupLabel =
  "px-4 pb-1 pt-3 text-left text-[11px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500";
const rowCls = "block px-4 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60";

function Row({ href, title, sub, onNavigate }) {
  return (
    <Link href={href} onClick={onNavigate} className={rowCls}>
      <span className="block truncate text-sm font-bold text-navy dark:text-white">
        {title}
      </span>
      {sub && (
        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
          {sub}
        </span>
      )}
    </Link>
  );
}

export default function SearchResultGroups({ results, onNavigate }) {
  if (!results) return null;
  return (
    <>
      {results.matches?.length > 0 && (
        <div>
          <p className={groupLabel}>Matches</p>
          {results.matches.map((m) => (
            <Row
              key={m.id}
              href={`/match/${m.id}`}
              title={m.title}
              sub={m.sub}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
      {results.series?.length > 0 && (
        <div>
          <p className={groupLabel}>Series</p>
          {results.series.map((s) => (
            <Row
              key={s.id}
              href={`/series/${s.slug}`}
              title={s.name}
              sub={s.sub}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
      {results.news?.length > 0 && (
        <div>
          <p className={groupLabel}>News</p>
          {results.news.map((n) => (
            <Row
              key={n.slug}
              href={`/news/${n.slug}`}
              title={n.title}
              sub={n.sub}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </>
  );
}
