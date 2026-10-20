// lib/opsNotify.js — the Telegram "ghanti" checks, run at the end of every
// sync (v62). Three bells, each ringing at most once per event:
//
// 1. NEW SERIES — a series sync just created (Hy must add broadcast + verify)
// 2. RECHECK DUE — a match's recheckAt has arrived (re-confirm the channel
//    before the match; the NZ Women lesson: a bell inside the admin only
//    rings when the admin is opened — this one rings on Hy's phone)
// 3. UNVERIFIED & CLOSE — an unverified match starts within 24h (it has no
//    public page until verified — verify now or it silently misses its day)
//
// Alerts are best-effort: any failure is swallowed so a sync can never fail
// because of a notification. Each match carries its own "alerted" stamp, so
// no bell rings twice for the same event.
import { dbConnect } from './db.js';
import Match from '../models/Match.js';
import { sendTelegram, telegramConfigured } from './telegram.js';
import { formatDayTimeIST } from './format.js';

function groupBySeries(matches) {
  const groups = new Map();
  for (const m of matches) {
    const key = m.series && m.series.name ? m.series.name : 'Other Matches';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }
  return groups;
}

export async function runOpsNotifications({ newSeriesNames = [] } = {}) {
  if (!telegramConfigured()) return { sent: 0, skipped: 'telegram-not-configured' };
  await dbConnect();
  const now = new Date();
  let sent = 0;

  // 1) New series created by this sync.
  if (newSeriesNames.length > 0) {
    const shown = newSeriesNames.slice(0, 8).map((n) => `• ${n}`).join('\n');
    const extra =
      newSeriesNames.length > 8 ? `\n• …aur ${newSeriesNames.length - 8} series` : '';
    const ok = await sendTelegram(
      `🆕 CricCast: nayi series sync me aayi hai\n${shown}${extra}\n\nAdmin me jaakar broadcast daalo aur verify karo.`
    );
    if (ok) sent++;
  }

  // 2) Recheck bells that have come due and not yet rung.
  const recheckDue = await Match.find({
    recheckAt: { $ne: null, $lte: now },
    recheckAlertedAt: null,
    status: { $ne: 'finished' },
    startTime: { $gte: new Date(now.getTime() - 12 * 3600 * 1000) },
  })
    .populate('series')
    .sort({ startTime: 1 });
  for (const [seriesName, group] of groupBySeries(recheckDue)) {
    const first = group[0];
    const ok = await sendTelegram(
      `🔁 CricCast Recheck ghanti: ${seriesName}\n` +
        `Match: ${first.teams.join(' vs ')} — ${formatDayTimeIST(first.startTime)}\n` +
        `Broadcast dobara check karke confirm karo (admin → Recheck tab).`
    );
    if (ok) {
      sent++;
      await Match.updateMany(
        { _id: { $in: group.map((m) => m._id) } },
        { $set: { recheckAlertedAt: now } }
      );
    }
  }

  // 3) Unverified matches starting within 24 hours.
  const unverifiedClose = await Match.find({
    verifiedAt: null,
    unverifiedAlertedAt: null,
    status: { $ne: 'finished' },
    startTime: { $gte: now, $lte: new Date(now.getTime() + 24 * 3600 * 1000) },
  })
    .populate('series')
    .sort({ startTime: 1 });
  if (unverifiedClose.length > 0) {
    const lines = unverifiedClose
      .slice(0, 8)
      .map(
        (m) =>
          `• ${m.teams.join(' vs ')} — ${formatDayTimeIST(m.startTime)} (${m.series?.name || ''})`
      )
      .join('\n');
    const extra =
      unverifiedClose.length > 8 ? `\n• …aur ${unverifiedClose.length - 8} matches` : '';
    const ok = await sendTelegram(
      `⚠️ CricCast: ye matches 24 ghante ke andar hain aur abhi tak UNVERIFIED hain — inke page live nahi jayenge:\n${lines}${extra}\n\nAdmin me jaakar verify karo.`
    );
    if (ok) {
      sent++;
      await Match.updateMany(
        { _id: { $in: unverifiedClose.map((m) => m._id) } },
        { $set: { unverifiedAlertedAt: now } }
      );
    }
  }

  return { sent };
}
