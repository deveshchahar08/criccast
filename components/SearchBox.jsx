"use client";

// SearchBox — header search that opens an overlay panel ON THE SAME
// PAGE (no navigation to /search unless the user asks for all
// results). Results come from /api/search (grouped: matches, series,
// news); the full results page stays at /search?q=…
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import SearchResultGroups from "./SearchResultGroups";

export default function SearchBox() {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 64, right: 16 });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const btnRef = useRef(null);
  const inputRef = useRef(null);
  const pathname = usePathname();

  const q = query.trim();

  function openPanel() {
    const r = btnRef.current?.getBoundingClientRect();
    if (r) {
      setAnchor({
        top: Math.round(r.bottom + 8),
        right: Math.max(8, Math.round(window.innerWidth - r.right)),
      });
    }
    setOpen(true);
  }

  function closePanel() {
    setOpen(false);
    setQuery("");
    setResults(null);
    setLoading(false);
  }

  // Close whenever navigation happens (row clicks close explicitly
  // too — this is the safety net).
  useEffect(() => {
    if (open) closePanel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Esc closes; a resize would strand the measured anchor, so close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closePanel();
    const onResize = () => closePanel();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    inputRef.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);

  // Debounced fetch (~250ms) once the query is long enough.
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

  function goToFullResults(e) {
    // Trial-12 (Hy's call): Enter stays on this page — results are
    // already live in the panel. Only the explicit "See all results →"
    // link below goes to the full /search page.
    e.preventDefault();
  }

  const hasResults =
    results &&
    (results.matches.length > 0 ||
      results.series.length > 0 ||
      results.news.length > 0);

  // Group lists (Matches → Series → News) are rendered by the shared
  // SearchResultGroups — same component the home hero bar uses.

  const panel = open ? (
    <>
      {/* Backdrop — click anywhere outside to close */}
      <div
        className="fixed inset-0 z-[60] bg-slate-950/40"
        onClick={closePanel}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-label="Search"
        className="fixed z-[70] w-[min(560px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900"
        style={{ top: anchor.top, right: anchor.right }}
      >
        <form onSubmit={goToFullResults} role="search">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find match, team, tournament…"
            autoComplete="off"
            className="w-full border-b border-slate-100 bg-transparent px-4 py-3.5 text-[15px] text-navy placeholder:text-slate-400 focus:outline-none dark:border-slate-800 dark:text-white"
          />
        </form>

        <div className="max-h-[60vh] overflow-y-auto pb-2">
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
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={openPanel}
        aria-label="Search"
        className="rounded-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
      </button>
      {panel && createPortal(panel, document.body)}
    </>
  );
}
