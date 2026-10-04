// lib/cricapi.js — CricAPI (cricapi.com) fixture sync.
// Free tier: 100 requests/day. One "Sync Now" press costs ~12 requests
// (1 currentMatches + up to 10 pages of /matches + 1 /series for names).
const BASE = "https://api.cricapi.com/v1";

async function get(path, key, params = {}) {
  const url = new URL(BASE + path);
  url.searchParams.set("apikey", key);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error(`${path} failed: HTTP ${res.status}`);
  const json = await res.json();
  if (json.status === "failure") throw new Error(json.reason || `${path} returned failure`);
  return Array.isArray(json.data) ? json.data : [];
}

// series_id -> series name (paginated; one page is not enough —
// missing names dump matches into "Other Matches").
export async function fetchSeriesMap(key) {
  const map = {};
  for (let pg = 0; ; pg++) {
    const page = await get("/series", key, { offset: pg * 25 });
    if (!page.length) break;
    for (const s of page) {
      if (s && s.id) map[s.id] = s.name || "";
    }
    if (page.length < 25) break;
  }
  return map;
}

// Live + upcoming matches, all competitions incl. domestic (no filtering).
// Fetches up to maxPages so series are not cut off when the API returns
// more matches than fit in a few pages (Hy saw Cricbuzz listing series
// like India A vs Aus A that never appeared in our 10-page fetch).
export async function fetchUpcomingMatches(key, maxPages = 20) {
  const all = [];
  const seen = new Set();
  const push = (list) => {
    for (const m of list) {
      if (m && m.id && !seen.has(m.id)) {
        seen.add(m.id);
        all.push(m);
      }
    }
  };
  push(await get("/currentMatches", key, { offset: 0 }));
  for (let p = 0; p < maxPages; p++) {
    const page = await get("/matches", key, { offset: p * 25 });
    if (!page.length) break;
    push(page);
    if (page.length < 25) break;
  }
  return all;
}

function formatLabel(matchType) {
  const t = String(matchType || "").toLowerCase();
  if (t.includes("t10")) return "T10";
  if (t.includes("t20") || t.includes("twenty20")) return "T20";
  if (t.includes("odi") || t.includes("one day")) return "ODI";
  if (t.includes("test")) return "Test";
  if (t.includes("first class") || t.includes("first-class")) return "First Class";
  if (t.includes("list a")) return "List A";
  return matchType || "";
}

// CricAPI's dateTimeGMT is GMT/UTC but carries no timezone suffix.
// new Date() parses a suffix-less datetime as SERVER-LOCAL time, which
// shifts every match by the server's UTC offset (e.g. -5:30 on an IST
// laptop). Force UTC so times are right on every server timezone.
function parseApiDate(s) {
  if (!s) return null;
  const str = String(s).trim();
  const normalized = /T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/.test(str) ? `${str}Z` : str;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Raw CricAPI match -> our Match shape (series resolved separately).
export function normalizeMatch(m, seriesName) {
  const teams = Array.isArray(m.teams) ? m.teams.slice(0, 2) : [];
  const shortNames = Array.isArray(m.teamInfo)
    ? m.teamInfo.map((t) => t && t.shortname).filter(Boolean).slice(0, 2)
    : [];
  // "India vs West Indies, 3rd ODI, West Indies tour of India, 2026" -> "3rd ODI"
  // (only the segment right after the teams — the rest is usually the series name again)
  let matchNumber = "";
  if (typeof m.name === "string") {
    const parts = m.name.split(",");
    if (parts.length > 1) matchNumber = parts[1].trim();
  }
  const status = m.matchEnded ? "finished" : m.matchStarted ? "live" : "scheduled";
  const startTime = parseApiDate(m.dateTimeGMT);
  return {
    externalId: m.id,
    teams,
    shortNames,
    format: formatLabel(m.matchType),
    matchNumber,
    startTime,
    venue: m.venue || "",
    status,
    resultText: m.matchEnded ? String(m.status || "") : "",
    seriesName: seriesName || "",
  };
}
