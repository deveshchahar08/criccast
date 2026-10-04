// lib/format.js
// Time formatting helpers. All match times are stored in UTC;
// everything is displayed in IST (Asia/Kolkata).

const IST = 'Asia/Kolkata';

export function formatTimeIST(dateInput) {
  const d = new Date(dateInput);
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: IST,
  });
}

// "TODAY 3:30 PM" / "TOMORROW 7:30 PM" / "6 OCT, SUN, 4:30 PM"
export function formatDayTimeIST(dateInput) {
  const d = new Date(dateInput);
  const now = new Date();
  const day = (x) =>
    new Date(x.toLocaleString('en-US', { timeZone: IST })).setHours(0, 0, 0, 0);
  const diffDays = Math.round((day(d) - day(now)) / 86400000);
  const time = formatTimeIST(d);
  if (diffDays === 0) return `TODAY ${time}`;
  if (diffDays === 1) return `TOMORROW ${time}`;
  // Date first ("6 OCT, TUE") — the date is the unambiguous anchor;
  // the weekday repeats every week. (Hy's call, Oct 4.)
  const datePart = d
    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: IST })
    .toUpperCase();
  const weekday = d
    .toLocaleDateString('en-IN', { weekday: 'short', timeZone: IST })
    .toUpperCase();
  return `${datePart}, ${weekday}, ${time}`;
}

// Days between a date's IST calendar day and today: 0 = today, 1 = tomorrow.
export function dayDiffIST(dateInput) {
  const d = new Date(dateInput);
  const now = new Date();
  const day = (x) =>
    new Date(x.toLocaleString('en-US', { timeZone: IST })).setHours(0, 0, 0, 0);
  return Math.round((day(d) - day(now)) / 86400000);
}

// "Starts in 2h 45m" / "Starts in 38m" / "Starting soon"
export function formatCountdown(dateInput) {
  const ms = new Date(dateInput) - Date.now();
  if (ms <= 0) return 'Starting soon';
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `Starts in ${m}m`;
  return `Starts in ${h}h ${m}m`;
}

// "2026-10-01" — IST calendar-date key, used by the fixtures date strip.
export function istDateKey(dateInput) {
  return new Date(dateInput).toLocaleDateString('en-CA', { timeZone: IST });
}

// "2h ago" / "3d ago" — for the "Verified by us" badge
export function timeAgo(dateInput) {
  if (!dateInput) return '';
  const ms = Date.now() - new Date(dateInput);
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
