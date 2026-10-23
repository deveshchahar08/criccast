// lib/dth.js
// DTH operators for the "MY TV SET-TOP BOX" selector.
// The channel NUMBER of the same TV channel differs per operator
// (Star Sports 1 Hindi HD = 454 on Tata Play, different on Airtel…)
// — showing the number for YOUR operator is the product's moat.
export const DTH_OPERATORS = [
  { id: 'tataPlay', label: 'Tata Play', short: 'Tata Play' },
  { id: 'airtel', label: 'Airtel DTH', short: 'Airtel' },
  { id: 'dishTv', label: 'Dish TV', short: 'Dish TV' },
  { id: 'd2h', label: 'Videocon d2h', short: 'd2h' },
  { id: 'sunDirect', label: 'Sun Direct', short: 'Sun Direct' },
  { id: 'ddFreeDish', label: 'DD FreeDish', short: 'FreeDish' },
];

export const DEFAULT_DTH = 'tataPlay';
export const DTH_STORAGE_KEY = 'kahandekhun-dth';

// Static sports channel directory for the DTH Codes page (Hy's call, Oct 4).
// Main cricket channels only — niche channels (Eurosport etc.) stay on
// match cards/detail but not here. Numbers verified Oct 4 (SD). A missing
// operator key means "number not verified yet", NOT "not available".
export const SPORTS_CHANNEL_DIRECTORY = [
  { name: 'Star Sports 1', languages: ['English'], numbers: { tataPlay: 455, airtel: 277, dishTv: 603, d2h: 401, sunDirect: 500 } },
  { name: 'Star Sports 1 Hindi', languages: ['Hindi'], numbers: { tataPlay: 460, airtel: 281, dishTv: 607, d2h: 407, sunDirect: 517 } },
  { name: 'Star Sports 2', languages: ['English'], numbers: { tataPlay: 457, airtel: 279, dishTv: 605, d2h: 403, sunDirect: 501 } },
  { name: 'Star Sports Select 1', languages: ['English'], numbers: { tataPlay: 464, airtel: 283, dishTv: 646, d2h: 429, sunDirect: 508 } },
  { name: 'Star Sports Select 2', languages: ['English'], numbers: { tataPlay: 466, airtel: 284, dishTv: 648, d2h: 430, sunDirect: 511 } },
  { name: 'Sony Sports Ten 1', languages: ['English'], numbers: { tataPlay: 471, airtel: 285, dishTv: 611, d2h: 411, sunDirect: 506 } },
  { name: 'Sony Sports Ten 3', languages: ['English', 'Hindi'], numbers: { tataPlay: 476, airtel: 289, dishTv: 615, d2h: 415, sunDirect: 518 } },
  { name: 'Sports 18 - 1', languages: ['English', 'Hindi'], numbers: { tataPlay: 488, airtel: 293, dishTv: 644, d2h: 667, sunDirect: 505 } },
  { name: 'DD Sports', languages: ['Hindi', 'English'], numbers: { tataPlay: 453, airtel: 298, d2h: 435, sunDirect: 510, ddFreeDish: 79 } },
];

// Team circle colors (short code -> bg color), matching the Stitch design.
const TEAM_COLORS = {
  IND: '#0d9488',
  AUS: '#7dd3fc',
  CSK: '#facc15',
  MI: '#3b82f6',
  DC: '#60a5fa',
  RCB: '#ef4444',
  WI: '#991b1b',
  SA: '#16a34a',
  ENG: '#1e3a8a',
  PAK: '#15803d',
  NZ: '#374151',
  SL: '#1d4ed8',
  LQ: '#a78bfa',
  KK: '#3b82f6',
};

const FALLBACKS = ['#0d9488', '#0284c7', '#7c3aed', '#db2777', '#ea580c', '#65a30d'];

export function teamColor(short) {
  if (TEAM_COLORS[short]) return TEAM_COLORS[short];
  let h = 0;
  for (const c of short || '') h = (h * 31 + c.charCodeAt(0)) % 997;
  return FALLBACKS[h % FALLBACKS.length];
}
