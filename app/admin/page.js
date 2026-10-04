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

// NEW badge: series created in the last 7 days (by sync or by hand) get a NEW
// tag in the Series tab — pairs with the weekly routine (Google Alerts +
// Sunday review): new series are the ones to check, verify or manual-add.
const isNewSeries = (createdAt) => {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 7 * 24 * 3600 * 1000;
};

function SeriesTab({ call, refresh }) {
  const [series, setSeries] = useState([]);
  const [form, setForm] = useState({ name: "", format: "", season: "", priority: "", broadcastJson: "" });
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState("");
  const formRef = useRef(null);

  const load = useCallback(async () => {
    const { ok, data } = await call("/api/admin/series");
    if (ok) setSeries(data.series || []);
  }, [call]);
  useEffect(() => { load(); }, [load, refresh]);

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

  const verifyAll = async (series) => {
    const hasBroadcast =
      (series.broadcast?.tvChannels || []).length > 0 ||
      (series.broadcast?.ottPlatforms || []).length > 0;
    const warn = hasBroadcast
      ? ""
      : " WARNING: this series has no broadcast info yet — its matches will show with no channel/OTT details.";
    if (!confirm(`Verify all upcoming matches of "${series.name}"?${warn}`)) return;
    const { ok, data } = await call(`/api/admin/series/${series.id}/verify-all`, { method: "POST" });
    if (ok) { setMsg(`${data.verified} match(es) verified.`); load(); }
    else setMsg(data.error || "Verify-all failed.");
  };

  return (
    <div>
      <h2 className="mb-3 text-lg font-extrabold dark:text-white">Series</h2>
      <div className="mb-4 space-y-2">
        {series.map((s) => (
          <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div>
              <p className="font-bold dark:text-white">
                {s.name}
                {isNewSeries(s.createdAt) && (
                  <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 align-middle text-[10px] font-extrabold text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                    NEW
                  </span>
                )}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {s.format} {s.season ? `· ${s.season}` : ""} ·{" "}
                {(s.broadcast?.tvChannels || []).length} TV ·{" "}
                {(s.broadcast?.ottPlatforms || []).length} OTT ·{" "}
                {s.matchCount ?? 0} matches ·{" "}
                prio {s.priority || 0}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => verifyAll(s)} className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-sky-700">Verify all</button>
              <button onClick={() => startEdit(s)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Edit</button>
              <button onClick={() => remove(s)} className={dangerCls}>Delete</button>
            </div>
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

function MatchesTab({ call, refresh }) {
  const [matches, setMatches] = useState([]);
  const [series, setSeries] = useState([]);
  const [msg, setMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [form, setForm] = useState({ seriesId: "", teams: "", shortNames: "", startTime: "", venue: "", city: "", matchNumber: "" });
  const [unverifiedOnly, setUnverifiedOnly] = useState(false);

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
  const syncNow = async () => {
    setSyncing(true);
    setMsg("Syncing fixtures from CricAPI…");
    const { ok, data } = await call("/api/admin/sync", { method: "POST" });
    setSyncing(false);
    if (ok) {
      setMsg(`Sync done — ${data.added} new, ${data.updated} updated, ${data.skipped} skipped (${data.total} fetched). Pruned ${data.prunedMatches || 0} old matches, ${data.autoFinished || 0} marked finished, ${data.prunedSeries || 0} empty series. Series in DB: ${data.seriesTotal}. Top: ${(data.breakdown || []).join(" · ")}. New matches are UNVERIFIED: add broadcast info in the Series tab, then Verify.`);
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
      setMsg(`Cleared ${data.deleted} unverified matches.`);
      setUnverifiedOnly(false);
      load();
    } else setMsg(data.error || "Clear failed.");
  };
  const create = async (e) => {
    e.preventDefault();
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
    };
    const { ok, data } = await call("/api/admin/matches", { method: "POST", body: JSON.stringify(body) });
    if (ok) {
      setMsg("Match created.");
      setForm({ seriesId: "", teams: "", shortNames: "", startTime: "", venue: "", city: "", matchNumber: "" });
      load();
    } else setMsg(data.error || "Create failed.");
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-extrabold dark:text-white">Matches</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setUnverifiedOnly((v) => !v)}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${unverifiedOnly ? "bg-amber-500 text-white hover:bg-amber-600" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"}`}
            title="Show only matches needing verification"
          >
            {unverifiedOnly ? `New only (${matches.filter((m) => !m.verifiedAt).length})` : "New only"}
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
      <div className="mb-4 space-y-2">
        {matches.filter((m) => !unverifiedOnly || !m.verifiedAt).map((m) => (
          <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="min-w-0">
              <p className="truncate font-bold dark:text-white">
                {m.teams?.[0]} vs {m.teams?.[1]}
                <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-extrabold ${m.verifiedAt ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"}`}>
                  {m.verifiedAt ? "VERIFIED" : "UNVERIFIED"}
                </span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {m.seriesName}{m.format ? ` · ${m.format}` : ""}{m.matchNumber ? ` · ${m.matchNumber}` : ""} · {m.startTime ? new Date(m.startTime).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : ""}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {!m.verifiedAt && <button onClick={() => verify(m.id)} className={btnCls}>Verify</button>}
              <button onClick={() => remove(m.id)} className={dangerCls}>Delete</button>
            </div>
          </div>
        ))}
        {matches.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No matches yet.</p>}
      </div>

      <form onSubmit={create} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="font-bold dark:text-white">New match</h3>
        <select className={inputCls} value={form.seriesId} onChange={(e) => setForm({ ...form, seriesId: e.target.value })} required>
          <option value="">Select series…</option>
          {series.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className={inputCls} placeholder="Teams, comma separated (e.g. India, Australia)" value={form.teams} onChange={(e) => setForm({ ...form, teams: e.target.value })} required />
        <input className={inputCls} placeholder="Short names, comma separated (e.g. IND, AUS) — optional" value={form.shortNames} onChange={(e) => setForm({ ...form, shortNames: e.target.value })} />
        <input className={inputCls} placeholder="Match label (e.g. 2nd Test, 3rd ODI) — optional" value={form.matchNumber} onChange={(e) => setForm({ ...form, matchNumber: e.target.value })} />
        <input className={inputCls} type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
        <div className="grid grid-cols-2 gap-3">
          <input className={inputCls} placeholder="Venue" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} />
          <input className={inputCls} placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        </div>
        <button type="submit" className={btnCls}>Create match</button>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const { token, saveToken, call } = useAdminApi();
  const [draft, setDraft] = useState("");
  const [tab, setTab] = useState("matches");
  const [refresh, setRefresh] = useState(0);

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
      <div className="mb-4 flex gap-2">
        {(["matches", "series"]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setRefresh((r) => r + 1); }}
            className={`rounded-full px-4 py-1.5 text-sm font-bold capitalize ${tab === t ? "bg-navy text-white" : "border border-slate-200 bg-white text-slate-600"}`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "matches"
        ? <MatchesTab call={call} refresh={refresh} />
        : <SeriesTab call={call} refresh={refresh} />}
    </div>
  );
}
