// app/api/app-event/route.js — real-install counting for the PWA.
//
// POST (public, same-origin only): the client reports a COMPLETED
// install — { type: "install" } from the browser's `appinstalled`
// event, which fires only when an install actually finishes — or a
// first standalone launch { type: "first-launch" }, the only truthful
// iPhone signal (a home-screen icon exists only if they really
// installed). Download-button CLICKS are never reported: many people
// click and back out, and a click count would be a lie.
//
// Counters live in AppStat documents, $inc'd by upsert:
//   "install:total", "install:YYYY-MM-DD" (Asia/Kolkata day),
//   "first:total",   "first:YYYY-MM-DD".
//
// GET (admin token, same guard as every /api/admin route): totals and
// today's numbers for the stat card on the admin page.
import { NextResponse } from 'next/server';
import { checkAdminToken } from '@/lib/adminAuth';
import { dbConnect, hasDb } from '@/lib/db';
import AppStat from '@/models/AppStat';

// "YYYY-MM-DD" for today in Asia/Kolkata, whatever the server's own
// timezone is — the owner's day, so "today" on the card is his day.
function kolkataDay() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());
  const get = (t) => parts.find((p) => p.type === t)?.value || '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// If an Origin (or, failing that, Referer) header is present, its host
// must be this site's own host — a cheap stop against other sites
// inflating the counts. Requests with neither header (some beacons)
// carry nothing that contradicts same-origin, so they pass.
function isSameOrigin(request) {
  const host = request.headers.get('host');
  if (!host) return false;
  const check = (value) => {
    if (!value) return null; // header absent
    try {
      return new URL(value).host === host;
    } catch {
      return false; // header present but unparseable — treat as foreign
    }
  };
  const origin = check(request.headers.get('origin'));
  if (origin !== null) return origin;
  const referer = check(request.headers.get('referer'));
  if (referer !== null) return referer;
  return true;
}

async function bump(key) {
  await AppStat.findOneAndUpdate(
    { key },
    { $inc: { count: 1 } },
    { upsert: true, setDefaultsOnInsert: true }
  );
}

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  let type = null;
  try {
    const body = await request.json();
    type = body?.type;
  } catch {
    /* an unparseable body is simply an unknown type */
  }
  if (type !== 'install' && type !== 'first-launch') {
    return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
  }
  if (!hasDb()) {
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  }
  await dbConnect();
  const prefix = type === 'install' ? 'install' : 'first';
  await bump(`${prefix}:total`);
  await bump(`${prefix}:${kolkataDay()}`);
  return new NextResponse(null, { status: 204 });
}

export async function GET(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
  if (!hasDb()) {
    return NextResponse.json({ error: 'No database connected.' }, { status: 503 });
  }
  await dbConnect();
  const day = kolkataDay();
  const keys = ['install:total', `install:${day}`, 'first:total', `first:${day}`];
  const docs = await AppStat.find({ key: { $in: keys } }).lean();
  const byKey = {};
  for (const d of docs) byKey[d.key] = d.count || 0;
  return NextResponse.json({
    installTotal: byKey['install:total'] || 0,
    installToday: byKey[`install:${day}`] || 0,
    firstTotal: byKey['first:total'] || 0,
    firstToday: byKey[`first:${day}`] || 0,
  });
}
