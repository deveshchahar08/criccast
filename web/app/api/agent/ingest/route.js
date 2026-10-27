// app/api/agent/ingest/route.js — the coverage agent's door (v64).
//
// Why this exists: the CricketData sync silently never ingests some series
// (India tour of NZ, Zimbabwe Women tour of India, India A — all Oct 2026),
// so those matches could only enter the site by Hy hand-creating them in
// admin. This route lets the coverage agent add a missing series + its
// matches to the pool so Hy's only remaining job is the Verify click.
//
// Hard limits, by design:
//  - Guarded by AGENT_SECRET (lib/agentAuth), separate from ADMIN_TOKEN.
//  - Everything created here is UNVERIFIED (verifiedAt stays null) — the
//    agent can never make anything public. Verify stays a human click.
//  - Nothing here edits or deletes existing records. A series broadcast is
//    only set when the series has none yet; Hy's data always wins.
//  - Series Hy deleted (SyncMeta "seriesBlacklist") are never re-created.
//  - Duplicate-safe: a match with the same two teams and a start time
//    within 45 minutes of an existing match in the series is skipped.
import { NextResponse } from 'next/server';
import { checkAgentToken } from '@/lib/agentAuth';
import { dbConnect, hasDb } from '@/lib/db';
import Series from '@/models/Series';
import Match from '@/models/Match';
import SyncMeta from '@/models/SyncMeta';

function noDb() {
  return NextResponse.json(
    { error: 'No database connected. Set MONGODB_URI to use this route.' },
    { status: 503 }
  );
}

function guard(request) {
  const auth = checkAgentToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb()) return noDb();
  return null;
}

const norm = (s) => String(s || '').trim().toLowerCase();
const teamKey = (teams) => (teams || []).map(norm).sort().join('|');
const broadcastEmpty = (b) =>
  !b ||
  ((b.tvChannels || []).length === 0 &&
    (b.ottPlatforms || []).length === 0 &&
    (b.worldwide || []).length === 0);

// GET /api/agent/ingest?search=New%20Zealand
// Pool lookup for the agent's duplicate check: which series match the text,
// and which matches (verified or not) already exist under each.
export async function GET(request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  await dbConnect();
  const { searchParams } = new URL(request.url);
  const search = String(searchParams.get('search') || '').trim();
  if (!search) return NextResponse.json({ error: 'search is required' }, { status: 400 });
  const needle = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const seriesDocs = await Series.find({ name: new RegExp(needle, 'i') })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();
  const out = [];
  for (const s of seriesDocs) {
    const matches = await Match.find({ series: s._id })
      .sort({ startTime: 1 })
      .limit(300)
      .lean();
    out.push({
      id: String(s._id),
      name: s.name,
      format: s.format || '',
      season: s.season || '',
      priority: s.priority || 0,
      hasBroadcast: !broadcastEmpty(s.broadcast),
      matches: matches.map((m) => ({
        id: String(m._id),
        teams: m.teams,
        matchNumber: m.matchNumber || '',
        startTime: m.startTime,
        verified: !!m.verifiedAt,
      })),
    });
  }
  return NextResponse.json({ series: out });
}

// POST /api/agent/ingest
// Body: {
//   series: { name, format?, season?, priority?, broadcast? },
//   matches: [{ teams: [a, b], shortNames?, matchNumber?, startTime (ISO),
//               venue?, city?, format? }]
// }
export async function POST(request) {
  const blocked = guard(request);
  if (blocked) return blocked;
  await dbConnect();
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const sIn = body?.series || {};
  const name = String(sIn.name || '').trim();
  if (!name) return NextResponse.json({ error: 'series.name is required' }, { status: 400 });
  const matchesIn = Array.isArray(body?.matches) ? body.matches : [];

  // Never resurrect a series Hy deliberately deleted.
  try {
    const blDoc = await SyncMeta.findOne({ key: 'seriesBlacklist' }).lean();
    const blacklist = new Set(
      blDoc && Array.isArray(blDoc.data) ? blDoc.data.map(String) : []
    );
    if (blacklist.has(name)) {
      return NextResponse.json(
        { error: 'Series is blacklisted (deleted by admin); not re-creating.', blacklisted: true },
        { status: 409 }
      );
    }
  } catch {}

  // Find (case-insensitive exact) or create the series.
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let series = await Series.findOne({ name: new RegExp(`^${escaped}$`, 'i') });
  let createdSeries = false;
  let broadcastSet = false;
  if (!series) {
    series = await Series.create({
      name,
      format: sIn.format || '',
      season: sIn.season || '',
      priority: typeof sIn.priority === 'number' ? sIn.priority : 0,
      broadcast: sIn.broadcast || {},
    });
    createdSeries = true;
    broadcastSet = !broadcastEmpty(series.broadcast);
  } else {
    // Fill only what is missing — never overwrite Hy's data.
    let dirty = false;
    if (!series.format && sIn.format) { series.format = sIn.format; dirty = true; }
    if (!series.season && sIn.season) { series.season = sIn.season; dirty = true; }
    if ((!series.priority || series.priority === 0) && typeof sIn.priority === 'number' && sIn.priority !== 0) {
      series.priority = sIn.priority; dirty = true;
    }
    if (sIn.broadcast && broadcastEmpty(series.broadcast)) {
      series.broadcast = sIn.broadcast; broadcastSet = true; dirty = true;
    }
    if (dirty) await series.save();
  }

  // Duplicate check against everything already in the series.
  const existing = await Match.find({ series: series._id }).lean();
  const existingKeys = existing.map((m) => ({
    key: teamKey(m.teams),
    t: new Date(m.startTime).getTime(),
  }));
  const DUP_WINDOW_MS = 45 * 60 * 1000;
  const created = [];
  const skipped = [];
  const invalid = [];
  for (const m of matchesIn) {
    const teams = (Array.isArray(m?.teams) ? m.teams : []).map((t) => String(t || '').trim()).filter(Boolean);
    const start = m?.startTime ? new Date(m.startTime) : null;
    if (teams.length !== 2 || !start || Number.isNaN(start.getTime())) {
      invalid.push({ teams, startTime: m?.startTime || null, reason: 'needs exactly 2 teams and a valid startTime' });
      continue;
    }
    const key = teamKey(teams);
    const t = start.getTime();
    const isDup = existingKeys.some((e) => e.key === key && Math.abs(e.t - t) <= DUP_WINDOW_MS);
    if (isDup) {
      skipped.push({ teams, startTime: start.toISOString(), reason: 'duplicate' });
      continue;
    }
    const doc = await Match.create({
      series: series._id,
      teams,
      shortNames: Array.isArray(m.shortNames) ? m.shortNames.map((s) => String(s)) : [],
      format: m.format || series.format || '',
      matchNumber: m.matchNumber || '',
      startTime: start,
      venue: m.venue || '',
      city: m.city || '',
      status: 'scheduled',
      lastSeenAt: new Date(),
    });
    existingKeys.push({ key, t });
    created.push({ id: String(doc._id), teams, startTime: start.toISOString() });
  }

  return NextResponse.json(
    {
      series: { id: String(series._id), name: series.name, createdSeries, broadcastSet },
      created,
      skipped,
      invalid,
    },
    { status: createdSeries || created.length ? 201 : 200 }
  );
}
