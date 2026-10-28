"use client";
// ADMIN — token-gated (x-admin-token, stored in sessionStorage).
// Real login before launch; token is the Phase-1 gate.
import { useCallback, useEffect, useRef, useState } from "react";

const TOKEN_KEY = "kd-admin-token";

function useAdminApi() {
  const [token, setToken] = useState("");
  useEffect(() => {
    try {
      setToken(sessionStorage.getItem(TOKEN_KEY) || "");
    } catch {}
  }, []);

  const saveToken = (t) => {
    setToken(t);
    try {
      sessionStorage.setItem(TOKEN_KEY, t);
    } catch {}
  };

  const call = useCallback(
    async (path, opts = {}) => {
      const res = await fetch(path, {
        ...opts,
        headers: {
          "Content-Type": "application/json",
          "x-admin-token": token,
          ...(opts.headers || {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, status: res.status, data };
    },
    [token]
  );

  return { token, saveToken, call };
}

const inputCls =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-sky-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const btnCls =
  "rounded-lg bg-sky-600 px-4 py-2 text-sm font-bold text-white hover:bg-sky-700 disabled:opacity-50";
const dangerCls =
  "rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:border-rose-900 dark:hover:bg-rose-950";

// NEW badge: series created in the last 3 days (by sync or by hand) get a NEW
// tag in the Series tab — new series are the ones to check, verify or manual-add.
const isNewSeries = (createdAt) => {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 3 * 24 * 3600 * 1000;
};

// RECHECK: a flagged match surfaces in the Recheck tab 3 days before its
// start (Hy's call: enough buffer for a side-hustle admin rhythm, and TV
// listings are only final 1-2 days out anyway). Purely an admin reminder —
// it never changes what the public site shows.
const RECHECK_LEAD_MS = 3 * 24 * 3600 * 1000;
const recheckDateFor = (startTime) =>
  new Date(new Date(startTime).getTime() - RECHECK_LEAD_MS);
const fmtDay = (d) =>
  new Date(d).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" });

function LivePill() {
  return (
    <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-red-600 dark:bg-red-950 dark:text-red-400">
      ● LIVE
    </span>
  );
}

// Set or remove a match's recheck flag (asks for an optional note when
// setting). Returns true when the flag actually changed.
// Acting on a match also takes it out of the admin "New" box (dismissedNewAt).
async function toggleMatchRecheck(call, m) {
  if (m.recheckAt) {
    if (!confirm(`Recheck is set for ${fmtDay(m.recheckAt)}${m.recheckNote ? ` — "${m.recheckNote}"` : ""}. Remove it?`)) return false;
    const { ok } = await call(`/api/admin/matches/${m.id}`, {
      method: "PUT",
      body: JSON.stringify({ recheckAt: null, recheckNote: "", dismissedNewAt: new Date().toISOString() }),
    });
    return ok;
  }
  const note = prompt("Why does this match need a recheck? (optional note)", "");
  if (note === null) return false;
  const { ok } = await call(`/api/admin/matches/${m.id}`, {
    method: "PUT",
    body: JSON.stringify({ recheckAt: recheckDateFor(m.startTime).toISOString(), recheckNote: note.trim(), dismissedNewAt: new Date().toISOString() }),
  });
  return ok;
}

// "NEW" box: an item is new for 3 days after it appears in the admin
// (createdAt), unless Hy skips it (dismissedNewAt). After 3 days it simply
// moves down into the Action needed list — never lost, never stuck.
const NEW_WINDOW_MS = 3 * 24 * 3600 * 1000;
const isNewItem = (item) =>
  !!item &&
  !item.dismissedNewAt &&
  !!item.createdAt &&
  Date.now() - new Date(item.createdAt).getTime() < NEW_WINDOW_MS;

function SeriesTab({ call, refresh, editSeriesRequest, onEditMatch }) {
  const [series, setSeries] = useState([]);
  const [form, setForm] = useState({ name: "", format: "", season: "", priority: "", broadcastJson: "" });
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [seriesMatches, setSeriesMatches] = useState({});
  const [loadingMatches, setLoadingMatches] = useState({});
  const [actionOnly, setActionOnly] = useState(true);
  const formRef = useRef(null);

  const load = useCallback(async () => {
    const { ok, data } = await call("/api/admin/series");
    if (ok) setSeries(data.series || []);
  }, [call]);
  useEffect(() => { load(); }, [load, refresh]);

  const toggleMatches = async (s) => {
    if (expandedId === s.id) { setExpandedId(null); return; }
    setExpandedId(s.id);
    if (!(s.id in seriesMatches)) {
      setLoadingMatches((prev) => ({ ...prev, [s.id]: true }));
      const { ok, data } = await call(`/api/admin/matches?seriesId=${s.id}&limit=200`);
      if (ok) setSeriesMatches((prev) => ({ ...prev, [s.id]: data.matches || [] }));
      setLoadingMatches((prev) => ({ ...prev, [s.id]: false }));
    }
  };
  const verifyMatch = async (mid, sid) => {
    const { ok, data } = await call(`/api/admin/matches/${mid}/verify`, { method: "POST" });
    if (ok) {
      setSeriesMatches((prev) => ({
        ...prev,
        [sid]: (prev[sid] || []).map((m) => (m.id === mid ? { ...m, verifiedAt: new Date().toISOString() } : m)),
      }));
      load();
    } else setMsg(data.error || "Verify failed.");
  };
  const removeMatch = async (mid, sid) => {
    if (!confirm("Delete this match?")) return;
    const { ok, data } = await call(`/api/admin/matches/${mid}`, { method: "DELETE" });
    if (ok) {
      setSeriesMatches((prev) => ({ ...prev, [sid]: (prev[sid] || []).filter((m) => m.id !== mid) }));
      load();
    } else setMsg(data.error || "Delete failed.");
  };
  const markFinishedSeries = async (mid, sid) => {
    if (!confirm("Mark this match as finished? It will disappear from the site.")) return;
    const { ok, data } = await call(`/api/admin/matches/${mid}`, {
      method: "PUT",
      body: JSON.stringify({ status: "finished" }),
    });
    if (ok) {
      setSeriesMatches((prev) => ({
        ...prev,
        [sid]: (prev[sid] || []).map((m) => (m.id === mid ? { ...m, status: "finished" } : m)),
      }));
      load();
      setMsg("Match marked as finished.");
    } else setMsg(data.error || "Update failed.");
  };
  const toggleRecheckSeriesMatch = async (m, sid) => {
    const changed = await toggleMatchRecheck(call, m);
    if (changed) {
      const { ok, data } = await call(`/api/admin/matches?seriesId=${sid}&limit=200`);
      if (ok) setSeriesMatches((prev) => ({ ...prev, [sid]: data.matches || [] }));
    }
  };
  const recheckSeries = async (series) => {
    const note = prompt(`Flag ALL upcoming matches of "${series.name}" for recheck (each surfaces 3 days before its match)? Optional note:`, "");
    if (note === null) return;
    const { ok, data } = await call(`/api/admin/series/${series.id}/recheck`, {
      method: "POST",
      body: JSON.stringify({ note: note.trim() }),
    });
    if (ok) setMsg(`${data.flagged} match(es) of "${series.name}" flagged for recheck.`);
    else setMsg(data.error || "Recheck flag failed.");
  };

  const startEdit = (s) => {
    setEditing(s.id);
    setForm({
      name: s.name,
      format: s.format || "",
      season: s.season || "",
      priority: s.priority ?? "",
      broadcastJson: JSON.stringify(s.broadcast || {}, null, 2),
    });
    // The form sits below the (long) series list — bring it into view.
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };
  // Cross-tab jump: the Recheck tab's Edit button sets editSeriesRequest —
  // when this tab mounts/loads, open that series' edit form directly.
  const handledEditNonce = useRef(0);
  useEffect(() => {
    if (!editSeriesRequest || editSeriesRequest.nonce === handledEditNonce.current) return;
    const s = series.find((x) => x.id === editSeriesRequest.id);
    if (s) {
      handledEditNonce.current = editSeriesRequest.nonce;
      startEdit(s);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editSeriesRequest, series]);
  const reset = () => {
    setEditing(null);
    setForm({ name: "", format: "", season: "", priority: "", broadcastJson: "" });
  };

  const save = async (e) => {
    e.preventDefault();
    let broadcast = {};
    try {
      broadcast = form.broadcastJson.trim() ? JSON.parse(form.broadcastJson) : {};
    } catch {
      setMsg("Broadcast JSON is invalid.");
      return;
    }
    const body = { name: form.name, format: form.format, season: form.season, priority: form.priority === "" ? 0 : Number(form.priority), broadcast };
    const { ok, data } = editing
      ? await call(`/api/admin/series/${editing}`, { method: "PUT", body: JSON.stringify(body) })
      : await call("/api/admin/series", { method: "POST", body: JSON.stringify(body) });
    if (ok) { setMsg("Saved."); reset(); load(); }
    else setMsg(data.error || "Save failed.");
  };

  const remove = async (series) => {
    if (!confirm(`Delete "${series.name}" and ALL its matches? This cannot be undone.`)) return;
    const { ok, data } = await call(`/api/admin/series/${series.id}`, { method: "DELETE" });
    if (ok) load(); else setMsg(data.error || "Delete failed.");
  };
  const clearJunkSeries = async () => {
    // Junk = no verified matches AND not new (older than 3 days).
    // These are API-created series Hy never cared about.
    const junk = series.filter(
      (s) => !s.isDone && (s.verifiedCount ?? 0) === 0 && !isNewSeries(s.createdAt)
    );
    if (!junk.length) { setMsg("No junk series to clear."); return; }
    if (!confirm(`Delete ${junk.length} junk series (no verified matches, older than 3 days)? Their unverified matches go too. Cannot be undone.`)) return;
    let deleted = 0;
    for (const s of junk) {
      const { ok } = await call(`/api/admin/series/${s.id}`, { method: "DELETE" });
      if (ok) deleted++;
    }
    setMsg(`Cleared ${deleted} junk series.`);
    load();
  };

  const verifyAll = async (series) => {
    const hasBroadcast =
      (series.broadcast?.tvChannels || []).length > 0 ||
      (series.broadcast?.ottPlatforms || []).length > 0;
    const warn = hasBroadcast
      ? ""
      : " WARNING: this series has no broadcast info yet — its matches will show with no channel/OTT details.";
    if (!confirm(`Verify all upcoming matches of "${series.name}"?${warn}`)) return;
    const { ok, data } = await call(`/api/admin/series/${series.id}/verify-all`, { method: "POST" });
    if (ok) {
      setMsg(`${data.verified} match(es) verified.`);
      const now = new Date().toISOString();
      setSeriesMatches((prev) => ({
        ...prev,
        [series.id]: (prev[series.id] || []).map((m) => ({ ...m, verifiedAt: m.verifiedAt || now })),
      }));
      load();
    }
    else setMsg(data.error || "Verify-all failed.");
  };

  const dismissSeriesNew = async (s) => {
    const { ok, data } = await call(`/api/admin/series/${s.id}/dismiss-new`, { method: "POST" });
    if (ok) load(); else setMsg(data.error || "Skip failed.");
  };

  // v65 ACTION QUEUE (Hy's design, Oct 22): the Action-needed list is a
  // queue, not a swamp. A series belongs here only while it can still
  // need Hy soon — its next match starts within 14 days, or one of its
  // matches has a recheck due. Everything else waits quietly in the
  // full list (Show all). Nothing is deleted, nothing is lost.
  const QUEUE_WINDOW_MS = 14 * 24 * 3600 * 1000;
  const inQueue = (s) =>
    !s.isDone &&
    (s.hasRecheckDue ||
      (!!s.nextMatchAt &&
        new Date(s.nextMatchAt).getTime() - Date.now() <= QUEUE_WINDOW_MS));

  // NEW box membership: brand-new series (last 3 days, not skipped) plus any
  // series holding brand-new matches — minus ones already DONE. Box members
  // are kept out of the list below so nothing shows twice.
  const isInNew = (s) =>
    !s.isDone && (isNewItem(s) || (s.newMatchCount ?? 0) > 0);
  // Oct 27 (Hy's ask, v68 queue item 1): the SAME expandable match list
  // the main series list has, shared as one helper so the ✨ New box cards
  // — which used to have no dropdown at all — expand identically.
  const expandedMatches = (s) => (
    <div className="border-t border-slate-100 px-3 py-2 dark:border-slate-800">
      {loadingMatches[s.id] ? (
        <p className="py-2 text-xs text-slate-400">Loading matches…</p>
      ) : (seriesMatches[s.id] || []).length === 0 ? (
        <p className="py-2 text-xs text-slate-400">No upcoming matches in this series.</p>
      ) : (
        <div className="space-y-1.5">
          {seriesMatches[s.id].map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold dark:text-white">
                  {(m.teams || []).join(" vs ")}
                  {m.verifiedAt ? (
                    <span className="ml-2 rounded bg-emerald-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">VERIFIED</span>
                  ) : (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-amber-700 dark:bg-amber-950 dark:text-amber-400">UNVERIFIED</span>
                  )}
                  {m.status === "live" && <LivePill />}
                  {m.recheckAt && (
                    <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-amber-700 dark:bg-amber-950 dark:text-amber-400" title={m.recheckNote || "Flagged for recheck"}>
                      🔁 {fmtDay(m.recheckAt)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {m.matchNumber ? `${m.matchNumber} · ` : ""}{m.startTime ? new Date(m.startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""}
                  {m.venue ? ` · ${m.venue}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                {!m.verifiedAt && (
                  <button onClick={() => verifyMatch(m.id, s.id)} className="rounded-lg bg-sky-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-sky-700">Verify</button>
                )}
                <button
                  onClick={() => toggleRecheckSeriesMatch(m, s.id)}
                  title={m.recheckAt ? `Recheck set for ${fmtDay(m.recheckAt)} — tap to remove` : "Flag for recheck (3 days before match)"}
                  className={`rounded-lg border px-2.5 py-1 text-xs font-bold ${m.recheckAt ? "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400" : "border-slate-200 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700"}`}
                >
                  🔁
                </button>
                {m.status === "live" && (
                  <button onClick={() => markFinishedSeries(m.id, s.id)} title="Mark as finished (hides from site)" className="rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950">Finish</button>
                )}
                {/* Oct 28 (Hy's ask): Edit jump — far-future matches never reach
                    the Matches tab's 200-soonest list, so their edit form was
                    unreachable. Opens the same form in the Matches tab. */}
                <button onClick={() => onEditMatch && onEditMatch({ ...m, seriesId: m.seriesId || s.id })} className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-bold hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-700">Edit</button>
                <button onClick={() => removeMatch(m.id, s.id)} className={dangerCls}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const newSeries = actionOnly ? series.filter(isInNew) : [];
  const newSeriesIds = new Set(newSeries.map((s) => s.id));

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold dark:text-white">Series</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActionOnly((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold ${actionOnly ? "bg-sky-600 text-white hover:bg-sky-700" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}
            title="Action needed = next match within 14 days, or a recheck due"
          >
            {actionOnly ? "Action needed ✓" : "Show all"}
          </button>
          <button onClick={clearJunkSeries} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950" title="Delete series with no verified matches (older than 3 days)">
            Clear junk
          </button>
        </div>
      </div>
      {msg && <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{msg}</p>}
      {actionOnly && newSeries.length > 0 && (
        <div className="mb-4 rounded-xl border-2 border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/40">
          <h3 className="mb-1 text-sm font-extrabold dark:text-white">✨ New ({newSeries.length})</h3>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            New series, and series with new matches, from the last 3 days. Anything left here moves down into the list below on its own after 3 days.
          </p>
          <div className="space-y-2">
            {newSeries.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between gap-2 p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <button
                      onClick={() => toggleMatches(s)}
                      className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      title={expandedId === s.id ? "Hide matches" : "Show matches"}
                    >
                      {expandedId === s.id ? "▲" : "▼"}
                    </button>
                    <div className="min-w-0">
                      <p className="truncate font-bold dark:text-white">
                        {s.name}
                        {(s.newMatchCount ?? 0) > 0 && (
                          <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-sky-700 dark:bg-sky-950 dark:text-sky-400">
                            +{s.newMatchCount} new {s.newMatchCount === 1 ? "match" : "matches"}
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {s.format} {s.season ? `· ${s.season}` : ""} · {(s.broadcast?.tvChannels || []).length} TV · {(s.broadcast?.ottPlatforms || []).length} OTT · {s.matchCount ?? 0} matches
                        {(s.matchCount ?? 0) > 0 && (
                          <span className="font-bold text-amber-600 dark:text-amber-400"> · {s.verifiedCount ?? 0}/{s.matchCount} verified</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => verifyAll(s)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700">Verify all</button>
                    <button onClick={() => recheckSeries(s)} title="Flag all upcoming matches of this series for recheck" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">🔁 Recheck</button>
                    <button onClick={() => startEdit(s)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Edit</button>
                    <button onClick={() => dismissSeriesNew(s)} title="Remove from New — it stays in the Action needed list below" className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950">Skip</button>
                    <button onClick={() => remove(s)} className={dangerCls}>Delete</button>
                  </div>
                </div>
                {expandedId === s.id && expandedMatches(s)}
              </div>
            ))}
          </div>
        </div>
      )}
      {actionOnly && (
        <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">
          Action needed = a series whose next match is within 14 days, or with a recheck due — nearest match first. Everything else waits quietly in the full list (Show all). Nothing here is ever deleted.
        </p>
      )}
      <div className="mb-4 space-y-2">
        {series.filter((s) => {
          if (newSeriesIds.has(s.id)) return false;
          if (actionOnly) return inQueue(s);
          return true;
        }).sort((a, b) => {
          if (!actionOnly) return 0;
          const an = a.nextMatchAt ? new Date(a.nextMatchAt).getTime() : Infinity;
          const bn = b.nextMatchAt ? new Date(b.nextMatchAt).getTime() : Infinity;
          return an - bn || (b.priority || 0) - (a.priority || 0);
        }).map((s) => (
          <div key={s.id} className="rounded-xl border border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleMatches(s)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                  title={expandedId === s.id ? "Hide matches" : "Show matches"}
                >
                  {expandedId === s.id ? "▲" : "▼"}
                </button>
                <div>
                  <p className="font-bold dark:text-white">
                    {s.name}
                    {s.isDone ? (
                      <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-green-700 dark:bg-green-950 dark:text-green-400">
                        ✓ DONE
                      </span>
                    ) : (
                      isNewSeries(s.createdAt) && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                          NEW
                        </span>
                      )
                    )}
                    {(s.newMatchCount ?? 0) > 0 && (
                      <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-sky-700 dark:bg-sky-950 dark:text-sky-400">
                        +{s.newMatchCount} new
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {s.format} {s.season ? `· ${s.season}` : ""} ·{" "}
                    {(s.broadcast?.tvChannels || []).length} TV ·{" "}
                    {(s.broadcast?.ottPlatforms || []).length} OTT ·{" "}
                    {s.matchCount ?? 0} matches
                    {!s.isDone && (s.matchCount ?? 0) > 0 && (
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {" "}· {s.verifiedCount ?? 0}/{s.matchCount} verified
                      </span>
                    )}
                    {" "}· prio {s.priority || 0}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => verifyAll(s)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700">Verify all</button>
                <button onClick={() => recheckSeries(s)} title="Flag all upcoming matches of this series for recheck" className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">🔁 Recheck</button>
                <button onClick={() => startEdit(s)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Edit</button>
                <button onClick={() => remove(s)} className={dangerCls}>Delete</button>
              </div>
            </div>
            {expandedId === s.id && expandedMatches(s)}
          </div>
        ))}
      </div>

      <form ref={formRef} onSubmit={save} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{editing ? "Edit series" : "New series"}</h3>
        <input className={inputCls} placeholder="Name (e.g. Border-Gavaskar Trophy)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <div className="grid grid-cols-3 gap-3">
          <input className={inputCls} placeholder="Format (Test / T20I / IPL)" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} />
          <input className={inputCls} placeholder="Season (e.g. 2025)" value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} />
          <input className={inputCls} type="number" placeholder="Priority (big = first)" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} title="Bigger number shows first on home/fixtures" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-600 dark:text-slate-300">
            Broadcast JSON — keys: tataPlay, airtel, dishTv, d2h, sunDirect, ddFreeDish
          </label>
          <textarea
            className={`${inputCls} font-mono text-xs`}
            rows={10}
            placeholder='{"tvChannels":[{"name":"Star Sports 1 Hindi HD","languages":["Hindi"],"numbers":{"tataPlay":"454","airtel":"281","dishTv":"603","ddFreeDish":""}}],"ottPlatforms":[{"name":"Disney+ Hotstar","free":false,"freeNote":"Subscription","languages":["Hindi","English"],"url":"https://www.hotstar.com"}]}'
            value={form.broadcastJson}
            onChange={(e) => setForm({ ...form, broadcastJson: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className={btnCls}>{editing ? "Update" : "Create"}</button>
          {editing && <button type="button" onClick={reset} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>}
        </div>
        {msg && <p className="text-sm text-slate-600 dark:text-slate-300">{msg}</p>}
      </form>
    </div>
  );
}

function MatchesTab({ call, refresh, editMatchRequest, onEditMatchRequestHandled }) {
  const [matches, setMatches] = useState([]);
  const [series, setSeries] = useState([]);
  const [msg, setMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ seriesId: "", teams: "", shortNames: "", startTime: "", venue: "", city: "", matchNumber: "", status: "scheduled", broadcastJson: "", unlockTime: false });
  const [actionOnly, setActionOnly] = useState(true);
  const [editingMatch, setEditingMatch] = useState(null);

  const startMatchEdit = (m) => {
    setEditingMatch(m.id);
    // Pre-fill the form like series edit does — datetime-local needs YYYY-MM-DDTHH:mm
    let dt = "";
    if (m.startTime) {
      const d = new Date(m.startTime);
      const pad = (n) => String(n).padStart(2, "0");
      dt = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    setForm({
      seriesId: m.seriesId || "",
      teams: (m.teams || []).join(", "),
      shortNames: (m.shortNames || []).join(", "),
      startTime: dt,
      venue: m.venue || "",
      city: m.city || "",
      matchNumber: m.matchNumber || "",
      format: m.format || "",
      status: m.status || "scheduled",
      // Oct 27 (Hy's ask): the override box always opens EMPTY — a stored
      // override is never pre-filled, so an edit can't re-save a stale
      // skeleton by accident. An empty box on save sends nothing.
      broadcastJson: "",
      unlockTime: false,
    });
    setMsg("");
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  };
  const cancelMatchEdit = () => {
    setEditingMatch(null);
    setForm({ seriesId: "", teams: "", shortNames: "", startTime: "", venue: "", city: "", matchNumber: "", format: "", status: "scheduled", broadcastJson: "", unlockTime: false });
  };

  // Oct 28: cross-tab jump from a Series-tab match row's Edit button —
  // open that match's edit form here, then clear the request so coming
  // back to this tab later does not reopen it.
  useEffect(() => {
    if (!editMatchRequest) return;
    if (editMatchRequest.match?.id) startMatchEdit(editMatchRequest.match);
    if (onEditMatchRequestHandled) onEditMatchRequestHandled();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMatchRequest]);

  const load = useCallback(async () => {
    const [{ ok, data }, sRes] = await Promise.all([
      call("/api/admin/matches?limit=50"),
      call("/api/admin/series"),
    ]);
    if (ok) setMatches(data.matches || []);
    if (sRes.ok) setSeries(sRes.data.series || []);
  }, [call]);
  useEffect(() => { load(); }, [load, refresh]);

  const verify = async (id) => {
    const { ok, data } = await call(`/api/admin/matches/${id}/verify`, { method: "POST" });
    if (ok) load(); else setMsg(data.error || "Verify failed.");
  };
  const markFinished = async (id) => {
    if (!confirm("Mark this match as finished? It will disappear from the site.")) return;
    const { ok, data } = await call(`/api/admin/matches/${id}`, {
      method: "PUT",
      body: JSON.stringify({ status: "finished" }),
    });
    if (ok) { load(); setMsg("Match marked as finished."); }
    else setMsg(data.error || "Update failed.");
  };
  const toggleRecheck = async (m) => {
    const changed = await toggleMatchRecheck(call, m);
    if (changed) {
      setMsg(m.recheckAt ? "Recheck flag removed." : `Recheck set — it will surface in the Recheck tab on ${fmtDay(recheckDateFor(m.startTime))}.`);
      load();
    }
  };
  const dismissNew = async (m) => {
    const { ok, data } = await call(`/api/admin/matches/${m.id}`, {
      method: "PUT",
      body: JSON.stringify({ dismissedNewAt: new Date().toISOString() }),
    });
    if (ok) load(); else setMsg(data.error || "Skip failed.");
  };
  const dismissAllNew = async () => {
    const { ok, data } = await call("/api/admin/matches/dismiss-new", { method: "POST" });
    if (ok) { setMsg("New box cleared — those matches stay in the list below as usual."); load(); }
    else setMsg(data.error || "Skip all failed.");
  };
  const syncNow = async () => {
    setSyncing(true);
    setMsg("Syncing fixtures from CricAPI…");
    const { ok, data } = await call("/api/admin/sync", { method: "POST" });
    setSyncing(false);
    if (ok) {
      setMsg(`Sync done — ${data.added} new, ${data.updated} updated, ${data.skipped} skipped (${data.total} fetched). Pruned ${data.prunedMatches || 0} old matches, ${data.autoFinished || 0} marked finished, ${data.prunedSeries || 0} empty series${data.skippedBlacklisted ? `, ${data.skippedBlacklisted} blacklisted skipped` : ""}${data.skippedMatchBlacklisted ? `, ${data.skippedMatchBlacklisted} deleted-match skipped` : ""}. Series in DB: ${data.seriesTotal}. Top: ${(data.breakdown || []).join(" · ")}. New matches are UNVERIFIED: add broadcast info in the Series tab, then Verify.`);
      load();
    } else {
      setMsg(data.error || "Sync failed.");
    }
  };
  const remove = async (id) => {
    if (!confirm("Delete this match?")) return;
    const { ok, data } = await call(`/api/admin/matches/${id}`, { method: "DELETE" });
    if (ok) load(); else setMsg(data.error || "Delete failed.");
  };
  const clearJunk = async () => {
    const count = matches.filter((m) => !m.verifiedAt).length;
    if (!count) return;
    if (!confirm(`Delete all ${count} UNVERIFIED matches? Verified matches stay. You can re-sync to get them back. Cannot be undone.`)) return;
    const { ok, data } = await call("/api/admin/matches/clear-unverified", { method: "DELETE" });
    if (ok) {
      const pruned = data.prunedSeries ? `, ${data.prunedSeries} empty series pruned` : "";
      setMsg(`Cleared ${data.deleted} unverified matches${pruned}.`);
      setActionOnly(true);
      load();
    } else setMsg(data.error || "Clear failed.");
  };
  const create = async (e) => {
    e.preventDefault();
    // Per-match broadcast override (v60): when this match's telecast differs
    // from its series (e.g. streaming-only inside a TV series), the JSON here
    // wins over the series broadcast. Empty = inherit the series broadcast.
    let broadcastOverride;
    if (form.broadcastJson && form.broadcastJson.trim()) {
      try {
        broadcastOverride = JSON.parse(form.broadcastJson);
      } catch {
        setMsg("Broadcast override JSON is invalid — fix it or clear the field.");
        return;
      }
    }
    const body = {
      seriesId: form.seriesId,
      teams: form.teams.split(",").map((t) => t.trim()).filter(Boolean),
      ...(form.shortNames.trim()
        ? { shortNames: form.shortNames.split(",").map((t) => t.trim().toUpperCase()).filter(Boolean) }
        : {}),
      startTime: form.startTime ? new Date(form.startTime).toISOString() : undefined,
      venue: form.venue,
      city: form.city,
      ...(form.matchNumber.trim() ? { matchNumber: form.matchNumber.trim() } : {}),
      ...(form.format ? { format: form.format } : {}),
      // Status editable ONLY in Edit mode — manual restore path when sync wrongly finishes a match (e.g. a Test between days). New-match creation keeps the server default.
      ...(editingMatch && form.status ? { status: form.status } : {}),
      // v66: the Edit form's unlock checkbox — the only way a locked
      // start time opens up to sync again.
      ...(editingMatch && form.unlockTime ? { startTimeLocked: false } : {}),
      // Oct 27 (Hy's ask): send an override ONLY when the box is filled.
      // Empty box = whatever is stored stays untouched, so series
      // inheritance and existing per-match overrides both survive an
      // innocent edit; pasting {} is the explicit way to clear one.
      ...(form.broadcastJson && form.broadcastJson.trim() ? { broadcastOverride } : {}),
    };
    const oldMatch = editingMatch ? matches.find((x) => x.id === editingMatch) : null;
    const timeChanged =
      !!oldMatch && !!form.startTime &&
      new Date(form.startTime).getTime() !== new Date(oldMatch.startTime).getTime();
    const { ok, data } = editingMatch
      ? await call(`/api/admin/matches/${editingMatch}`, { method: "PUT", body: JSON.stringify(body) })
      : await call("/api/admin/matches", { method: "POST", body: JSON.stringify(body) });
    if (ok) {
      setMsg(
        editingMatch && form.unlockTime
          ? "Match updated — start time unlocked (sync can change it again)."
          : editingMatch && timeChanged
            ? "Match updated — start time locked (sync won't change it)."
            : editingMatch
              ? "Match updated."
              : "Match created."
      );
      cancelMatchEdit();
      load();
    } else setMsg(data.error || (editingMatch ? "Update failed." : "Create failed."));
  };

  // NEW box: unverified matches that arrived in the last 3 days and weren't
  // skipped. They leave on their own after 3 days (or on Verify / Delete /
  // Recheck / Skip) and then live only in the list below.
  const newMatches = matches
    .filter((m) => isNewItem(m) && !m.verifiedAt && m.status !== "finished")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const newIds = new Set(newMatches.map((m) => m.id));
  // Main list: with Action needed on, items sitting in the NEW box are not
  // repeated here. Order: live first, then freshest arrivals on top and the
  // older pending pile below (Hy's flow).
  const visibleMatches = matches
    .filter((m) => (!actionOnly || !m.verifiedAt || m.status === "live") && !(actionOnly && newIds.has(m.id)))
    .sort((a, b) =>
      (b.status === "live") - (a.status === "live") ||
      new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );

  const matchRow = (m, inNew) => (
    <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0">
        <p className="truncate font-bold dark:text-white">
          {m.teams?.[0]} vs {m.teams?.[1]}
          <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-extrabold ${m.verifiedAt ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"}`}>
            {m.verifiedAt ? "VERIFIED" : "UNVERIFIED"}
          </span>
          {m.status === "live" && <LivePill />}
          {m.recheckAt && (
            <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-amber-700 dark:bg-amber-950 dark:text-amber-400" title={m.recheckNote || "Flagged for recheck"}>
              🔁 {fmtDay(m.recheckAt)}
            </span>
          )}
          {m.startTimeLocked && (
            <span className="ml-2 rounded bg-sky-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-sky-700 dark:bg-sky-950 dark:text-sky-400" title="Start time was corrected by hand — sync will not change it">
              🔒 TIME LOCKED
            </span>
          )}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {m.seriesName}{m.format ? ` · ${m.format}` : ""}{m.matchNumber ? ` · ${m.matchNumber}` : ""} · {m.startTime ? new Date(m.startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-2">
        {!m.verifiedAt && <button onClick={() => verify(m.id)} className={btnCls}>Verify</button>}
        <button
          onClick={() => toggleRecheck(m)}
          title={m.recheckAt ? `Recheck set for ${fmtDay(m.recheckAt)} — tap to remove` : "Flag for recheck (3 days before match)"}
          className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${m.recheckAt ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400" : "border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"}`}
        >
          🔁
        </button>
        <button onClick={() => startMatchEdit(m)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Edit</button>
        {m.status === "live" && <button onClick={() => markFinished(m.id)} title="Mark as finished (hides from site)" className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950">Finish</button>}
        <button onClick={() => remove(m.id)} className={dangerCls}>Delete</button>
        {inNew && (
          <button onClick={() => dismissNew(m)} title="Remove from New — it stays in the Action needed list below" className="rounded-lg border border-sky-200 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100 dark:border-sky-800 dark:text-sky-400 dark:hover:bg-sky-950">Skip</button>
        )}
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold dark:text-white">Matches</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setActionOnly((v) => !v)}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${actionOnly ? "bg-sky-600 text-white hover:bg-sky-700" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}
            title="Show only matches needing action (unverified, plus live ones for the Finish button)"
          >
            {actionOnly ? "Action needed ✓" : "Show all"}
          </button>
          <button onClick={clearJunk} className={dangerCls} title="Delete all unverified matches">
            Clear junk
          </button>
          <button onClick={syncNow} disabled={syncing} className={btnCls}>
            {syncing ? "Syncing…" : "Sync Now"}
          </button>
        </div>
      </div>
      {msg && <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{msg}</p>}
      {actionOnly && newMatches.length > 0 && (
        <div className="mb-4 rounded-xl border-2 border-sky-200 bg-sky-50 p-3 dark:border-sky-900 dark:bg-sky-950/40">
          <div className="mb-1 flex items-center justify-between">
            <h3 className="text-sm font-extrabold dark:text-white">✨ New ({newMatches.length})</h3>
            <button onClick={dismissAllNew} className="text-xs font-bold text-sky-700 hover:underline dark:text-sky-400">Skip all</button>
          </div>
          <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
            Added in the last 3 days. Verify, delete, recheck or skip — anything left here moves down into the list below on its own after 3 days.
          </p>
          <div className="space-y-2">{newMatches.map((m) => matchRow(m, true))}</div>
        </div>
      )}
      <div className="mb-4 space-y-2">
        {visibleMatches.map((m) => matchRow(m, false))}
        {matches.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No matches yet.</p>}
        {matches.length > 0 && actionOnly && visibleMatches.length === 0 && newMatches.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">All caught up — nothing needs action. Tap "Show all" to see verified matches.</p>
        )}
      </div>

      <form onSubmit={create} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">{editingMatch ? "Edit match" : "New match"}</h3>
        <select className={inputCls} value={form.seriesId} onChange={(e) => setForm({ ...form, seriesId: e.target.value })} required>
          <option value="">Select series…</option>
          {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className={inputCls} placeholder="Teams, comma separated (e.g. India, Australia)" value={form.teams} onChange={(e) => setForm({ ...form, teams: e.target.value })} required />
        <input className={inputCls} placeholder="Short names, comma separated (e.g. IND, AUS) — optional" value={form.shortNames} onChange={(e) => setForm({ ...form, shortNames: e.target.value })} />
        <input className={inputCls} placeholder="Match label (e.g. 2nd Test, 3rd ODI) — optional" value={form.matchNumber} onChange={(e) => setForm({ ...form, matchNumber: e.target.value })} />
        <input className={inputCls} placeholder="Format (Test / ODI / T20I) — optional" value={form.format} onChange={(e) => setForm({ ...form, format: e.target.value })} />
        <input className={inputCls} type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
        {editingMatch && matches.find((x) => x.id === editingMatch)?.startTimeLocked ? (
          <div className="rounded-lg bg-sky-50 p-3 text-xs font-bold text-sky-800 dark:bg-sky-950 dark:text-sky-300">
            🔒 This start time was corrected by hand — sync will not change it.
            <label className="mt-2 flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={!!form.unlockTime} onChange={(e) => setForm({ ...form, unlockTime: e.target.checked })} />
              Unlock — let sync update this time again
            </label>
          </div>
        ) : editingMatch ? (
          <p className="-mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            If you change the start time, it locks — sync will not overwrite your correction.
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          <input className={inputCls} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        {editingMatch && (
          <label className="block text-sm font-bold dark:text-slate-200">
            Status
            <select className={inputCls} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="scheduled">Scheduled</option>
              <option value="live">Live</option>
              <option value="finished">Finished</option>
            </select>
          </label>
        )}
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-500 dark:text-slate-400">
            Broadcast override JSON — optional, per-match only (leave empty to keep as-is; paste JSON to set this match's own broadcast; paste {"{}"} to remove it and inherit the series)
          </label>
          <textarea
            className={inputCls}
            rows={5}
            placeholder='{"tvChannels": [], "ottPlatforms": [{"name": "JioHotstar", "free": false, "freeNote": "Plans from ₹79/month", "languages": ["English", "Hindi"]}]}'
            value={form.broadcastJson}
            onChange={(e) => setForm({ ...form, broadcastJson: e.target.value })}
          />
        </div>
        <div className="flex gap-2">
          <button type="submit" className={btnCls}>{editingMatch ? "Update match" : "Create match"}</button>
          {editingMatch && <button type="button" onClick={cancelMatchEdit} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Cancel</button>}
        </div>
      </form>
    </div>
  );
}

function RecheckTab({ call, refresh, onEditSeries }) {
  const [matches, setMatches] = useState([]);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const { ok, data } = await call("/api/admin/matches/recheck");
    if (ok) setMatches(data.matches || []);
  }, [call]);
  useEffect(() => { load(); }, [load, refresh]);

  const confirmRecheck = async (m) => {
    // Confirming = the info was checked again just now: clear the flag AND
    // refresh the "Verified" stamp (Hy's ask).
    const { ok, data } = await call(`/api/admin/matches/${m.id}`, {
      method: "PUT",
      body: JSON.stringify({ recheckAt: null, recheckNote: "", verifiedAt: new Date().toISOString() }),
    });
    if (ok) { setMsg(`Confirmed: ${m.teams?.[0]} vs ${m.teams?.[1]} — verified date refreshed.`); load(); }
    else setMsg(data.error || "Confirm failed.");
  };
  const removeFlag = async (m) => {
    if (!confirm("Remove this recheck flag without confirming?")) return;
    const { ok, data } = await call(`/api/admin/matches/${m.id}`, {
      method: "PUT",
      body: JSON.stringify({ recheckAt: null, recheckNote: "" }),
    });
    if (ok) load(); else setMsg(data.error || "Remove failed.");
  };

  const now = Date.now();
  const due = matches.filter((m) => new Date(m.recheckAt).getTime() <= now);
  const upcoming = matches.filter((m) => new Date(m.recheckAt).getTime() > now);

  const renderRow = (m, isDue) => (
    <div key={m.id} className={`rounded-xl border p-3 ${isDue ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40" : "border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-bold dark:text-white">
            {m.teams?.[0]} vs {m.teams?.[1]}
            {m.status === "live" && <LivePill />}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {m.seriesName}{m.matchNumber ? ` · ${m.matchNumber}` : ""} · Match: {m.startTime ? new Date(m.startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : ""}
            {m.venue ? ` · ${m.venue}` : ""}
          </p>
          <p className={`mt-0.5 text-xs font-bold ${isDue ? "text-amber-700 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"}`}>
            {isDue ? `🔁 Recheck due since ${fmtDay(m.recheckAt)} — please confirm the info` : `🔁 Recheck on ${fmtDay(m.recheckAt)}`}
            {m.recheckNote ? <span className="font-normal"> · Note: {m.recheckNote}</span> : null}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => confirmRecheck(m)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700" title="Info re-checked — clears the flag and refreshes the Verified date">✓ Confirmed</button>
          <button onClick={() => onEditSeries && onEditSeries(m.seriesId)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" title="Open this series' broadcast edit form (change channel/OTT, then Update)">Edit broadcast</button>
          <button onClick={() => removeFlag(m)} className={dangerCls}>Remove</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold dark:text-white">Recheck</h2>
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
          {due.length} due · {upcoming.length} upcoming
        </p>
      </div>
      <p className="mb-3 text-sm text-slate-500 dark:text-slate-400">
        Matches flagged for a second confirmation. They stay live on the site either way — this list is only a reminder.
        Flag a match with the 🔁 button in the Matches or Series tab.
      </p>
      {msg && <p className="mb-3 text-sm text-slate-600 dark:text-slate-300">{msg}</p>}
      {matches.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No rechecks pending. 🎉</p>
      )}
      {due.length > 0 && (
        <>
          <h3 className="mb-2 text-sm font-extrabold text-amber-700 dark:text-amber-400">Due now ({due.length})</h3>
          <div className="mb-4 space-y-2">{due.map((m) => renderRow(m, true))}</div>
        </>
      )}
      {upcoming.length > 0 && (
        <>
          <h3 className="mb-2 text-sm font-extrabold dark:text-white">Upcoming ({upcoming.length})</h3>
          <div className="space-y-2">{upcoming.map((m) => renderRow(m, false))}</div>
        </>
      )}
    </div>
  );
}

// HOME NOTE editor (v61): the amber strip on the public home page. The text
// lives server-side (SyncMeta via /api/admin/settings), so changing or
// clearing it needs no rebuild. Empty = strip hidden.
function HomeNoteEditor({ call }) {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { ok, data } = await call("/api/admin/settings");
      if (ok) setText(data.homeNote || "");
    })();
  }, [call]);

  const save = async () => {
    setBusy(true);
    setMsg("");
    const { ok } = await call("/api/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ homeNote: text }),
    });
    setBusy(false);
    setMsg(ok ? "Saved." : "Could not save — try again.");
  };

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900 dark:bg-amber-950/40">
      <div className="mb-1 text-sm font-extrabold text-amber-800 dark:text-amber-300">
        📢 Home note
      </div>
      <p className="mb-2 text-xs text-amber-700 dark:text-amber-400">
        Shown as a strip at the top of the home page. Leave empty to hide it.
      </p>
      <textarea
        className={inputCls}
        rows={2}
        maxLength={300}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="e.g. Not every Ranji Trophy match is televised. Every televised match is listed here, verified by us."
      />
      <div className="mt-2 flex items-center gap-3">
        <button onClick={save} disabled={busy} className={btnCls}>
          Save note
        </button>
        {msg && (
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{msg}</span>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const { token, saveToken, call } = useAdminApi();
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState("matches");
  const [refresh, setRefresh] = useState(0);
  const [recheckDue, setRecheckDue] = useState(0);
  const [editSeriesRequest, setEditSeriesRequest] = useState(null);
  const [editMatchRequest, setEditMatchRequest] = useState(null);

  useEffect(() => {
    if (!token) return;
    (async () => {
      const { ok, data } = await call("/api/admin/matches/recheck");
      if (ok) {
        const now = Date.now();
        setRecheckDue((data.matches || []).filter((m) => m.recheckAt && new Date(m.recheckAt).getTime() <= now).length);
      }
    })();
  }, [call, refresh, token]);

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 pt-16">
        <h1 className="text-xl font-extrabold dark:text-white">Admin</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Enter the admin token to continue.</p>
        <form
          className="mt-4 flex gap-2"
          onSubmit={(e) => { e.preventDefault(); saveToken(draft.trim()); }}
        >
          <input
            type="password"
            className={inputCls}
            placeholder="Admin token"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className={btnCls}>Unlock</button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-5 md:max-w-4xl">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-extrabold dark:text-white">Admin</h1>
        <button
          onClick={() => { saveToken(""); }}
          className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
        >
          Lock
        </button>
      </div>
      <HomeNoteEditor call={call} />
      <div className="mb-4 flex gap-2">
        {(["matches", "series", "recheck"]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setRefresh((r) => r + 1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${tab === t ? "bg-navy text-white" : "border border-slate-200 bg-white text-slate-600"}`}
          >
            {t}
            {t === "recheck" && recheckDue > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-white">
                {recheckDue}
              </span>
            )}
          </button>
        ))}
      </div>
      {tab === "matches"
        ? <MatchesTab call={call} refresh={refresh} editMatchRequest={editMatchRequest} onEditMatchRequestHandled={() => setEditMatchRequest(null)} />
        : tab === "series"
          ? <SeriesTab
              call={call}
              refresh={refresh}
              editSeriesRequest={editSeriesRequest}
              onEditMatch={(m) => {
                if (!m?.id) return;
                setEditMatchRequest({ match: m, nonce: Date.now() });
                setTab("matches");
                setRefresh((r) => r + 1);
              }}
            />
          : <RecheckTab
              call={call}
              refresh={refresh}
              onEditSeries={(seriesId) => {
                if (!seriesId) return;
                setEditSeriesRequest({ id: seriesId, nonce: Date.now() });
                setTab("series");
                setRefresh((r) => r + 1);
              }}
            />}
    </div>
  );
}
