"use client";

// HeroSearch — the big search bar in the home hero (trial-12, Hy's
// call): searching happens RIGHT HERE in a dropdown panel under the
// bar — grouped Matches → Series → News from /api/search — and never
// navigates to a separate search window while typing. Enter/Search
// just opens (or keeps) the panel; only the explicit "See all
// results →" footer goes to the full /search page.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchResultGroups from "./SearchResultGroups";

export default function HeroSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const pathname = usePathname();

  const q = query.trim();

  function closePanel() {
    setOpen(false);
  }

  // Close whenever navigation happens (row clicks close explicitly
  // too — this is the safety net).
  useEffect(() => {
    if (open) closePanel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Esc closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closePanel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  // Debounced fetch (~250ms) once the query is long enough — the
  // panel opens as soon as there is something to search for.
  useEffect(() => {
    if (!open) return;
    if (q.length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        setResults(data);
      } catch {
        // aborted or offline — keep whatever is on screen
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q, open]);

  const hasResults =
    results &&
    (results.matches.length > 0 ||
      results.series.length > 0 ||
      results.news.length > 0);

  return (
    <div className="relative mx-auto mt-5 max-w-xl">
      <form
        role="search"
        onSubmit={(e) => {
          // Search stays on this page — Enter never leaves home.
          e.preventDefault();
          setOpen(true);
          inputRef.current?.focus();
        }}
        className="relative z-50 flex items-center gap-2 rounded-full border-[1.5px] border-slate-200 bg-white py-1.5 pl-5 pr-1.5 shadow-card focus-within:border-sky-600 dark:border-slate-700 dark:bg-slate-900"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          autoComplete="off"
          placeholder="Search team (India, CSK, MI), tournament, or channel…"
          aria-label="Search matches, series and news"
          className="w-full bg-transparent text-left text-sm text-navy placeholder:text-slate-400 focus:outline-none dark:text-white"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults(null);
              inputRef.current?.focus();
            }}
            className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        )}
        <button
          type="submit"
          className="shrink-0 rounded-full bg-sky-600 px-5 py-2 text-sm font-bold text-white hover:bg-sky-700"
        >
          Search
        </button>
      </form>

      {open && (
        <>
          {/* Backdrop — click anywhere outside to close */}
          <div
            className="fixed inset-0 z-40 cursor-default bg-slate-950/30"
            onClick={closePanel}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Search results"
            className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-2xl dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="max-h-[55vh] overflow-y-auto pb-2">
              {q.length < 2 && (
                <p className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                  Type a team, series or player name
                </p>
              )}
              {q.length >= 2 && loading && !results && (
                <p className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                  Searching…
                </p>
              )}
              {q.length >= 2 && results && !hasResults && (
                <p className="px-4 py-4 text-sm text-slate-500 dark:text-slate-400">
                  No results for &ldquo;{q}&rdquo;
                </p>
              )}
              <SearchResultGroups results={results} onNavigate={closePanel} />
            </div>
            {q.length >= 2 && (
              <Link
                href={`/search?q=${encodeURIComponent(q)}`}
                onClick={closePanel}
                className="block border-t border-slate-100 px-4 py-3 text-sm font-bold text-sky-600 hover:bg-slate-50 dark:border-slate-800 dark:text-sky-400 dark:hover:bg-slate-800/60"
              >
                See all results →
              </Link>
            )}
          </div>
        </>
      )}
    </div>
  );
}
