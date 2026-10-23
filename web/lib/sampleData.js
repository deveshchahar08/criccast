// lib/sampleData.js
// SAMPLE DATA — mirrors the Stitch screenshots so `npm run dev` works with
// ZERO setup (no MongoDB needed). The home page + API routes use this when
// MONGODB_URI is not set. Replace with real verified data before launch
// (enter it via /admin once MongoDB is connected).

const now = Date.now();
const H = 3600000;

function seriesDoc(id, name, format, season, broadcast) {
  return { _id: id, id, name, format, season, broadcast };
}

function matchDoc(o) {
  return {
    _id: o.id,
    id: o.id,
    series: o.series,
    seriesId: o.series._id,
    teams: o.teams,
    shortNames: o.shortNames,
    format: o.format,
    matchNumber: o.matchNumber,
    startTime: new Date(o.startTime).toISOString(),
    venue: o.venue,
    city: o.city,
    status: o.status,
    resultText: o.resultText || null,
    digitalOnly: !!o.digitalOnly,
    digitalOnlyNote: o.digitalOnlyNote || null,
    verifiedAt: o.verifiedAt ? new Date(o.verifiedAt).toISOString() : null,
    sourceUrl: o.sourceUrl || null,
    broadcast: o.broadcast, // already resolved (series inheritance applied)
  };
}

const bgt = seriesDoc('s_bgt', 'Border-Gavaskar Trophy', 'Test', '2026', {
  tvChannels: [
    {
      name: 'Star Sports 1 Hindi HD',
      languages: ['Hindi'],
      numbers: { tataPlay: '454', airtel: '282', dishTv: '455' },
    },
    {
      name: 'Star Sports 1 HD',
      languages: ['English'],
      numbers: { tataPlay: '453', airtel: '281', dishTv: '454' },
    },
  ],
  ottPlatforms: [
    {
      name: 'Disney+ Hotstar',
      free: true,
      freeNote: 'Free Mobile',
      languages: ['Hindi', 'English', 'Tamil', 'Telugu'],
    },
  ],
  languages: ['Hindi', 'English', 'Tamil', 'Telugu'],
});

const ipl = seriesDoc('s_ipl', 'IPL 2025', 'T20', '2025', {
  tvChannels: [
    {
      name: 'Sports18 1 HD',
      languages: ['English', 'Hindi'],
      numbers: { tataPlay: '488', airtel: '294', dishTv: '600' },
    },
  ],
  ottPlatforms: [
    {
      name: 'JioCinema',
      free: true,
      freeNote: 'Free to Watch',
      languages: ['12 Languages', '4K'],
    },
  ],
  languages: ['English', 'Hindi'],
});

const t20i = seriesDoc('s_t20i', 'Bilateral T20I Series', 'T20I', '2026', {
  tvChannels: [],
  ottPlatforms: [
    {
      name: 'FanCode',
      free: false,
      freeNote: 'Pass from ₹29',
      languages: ['English Commentary'],
    },
  ],
  languages: ['English'],
});

const wpl = seriesDoc('s_wpl', 'WPL 2025', 'T20', '2025', {
  tvChannels: [
    {
      name: 'Sports18 Khel',
      languages: ['Hindi'],
      numbers: { tataPlay: '490', ddFreeDish: '75' },
    },
    {
      name: 'Sports18 1',
      languages: ['English'],
      numbers: { tataPlay: '488', ddFreeDish: '75' },
    },
  ],
  ottPlatforms: [{ name: 'JioCinema', free: true, freeNote: 'Free', languages: ['Hindi', 'English'] }],
  languages: ['Hindi', 'English'],
});

const psl = seriesDoc('s_psl', 'Pakistan Super League', 'T20', '2026', {
  tvChannels: [
    {
      name: 'Sony Sports 5',
      languages: ['English'],
      numbers: { tataPlay: '470', airtel: '283', dishTv: '560' },
    },
  ],
  ottPlatforms: [{ name: 'SonyLIV', free: false, freeNote: 'Subscription', languages: ['English'] }],
  languages: ['English'],
});

export function sampleSeries() {
  return [bgt, ipl, t20i, wpl, psl];
}

export function sampleMatches() {
  return [
    matchDoc({
      id: 'm_bgt3',
      series: bgt,
      teams: ['India', 'Australia'],
      shortNames: ['IND', 'AUS'],
      format: 'Test',
      matchNumber: 'Day 3',
      startTime: now - 3 * H, // started 3h ago -> LIVE
      venue: 'Melbourne Cricket Ground',
      city: 'Melbourne',
      status: 'live',
      verifiedAt: now - 2 * H,
      broadcast: bgt.broadcast,
    }),
    matchDoc({
      id: 'm_ipl14',
      series: ipl,
      teams: ['Chennai', 'Mumbai'],
      shortNames: ['CSK', 'MI'],
      format: 'T20',
      matchNumber: 'Match 14',
      startTime: now + 2 * H + 45 * 60000, // starts in 2h 45m
      venue: 'Wankhede Stadium',
      city: 'Mumbai',
      status: 'scheduled',
      verifiedAt: now - 5 * H,
      broadcast: ipl.broadcast,
    }),
    matchDoc({
      id: 'm_wi_sa',
      series: t20i,
      teams: ['West Indies', 'South Africa'],
      shortNames: ['WI', 'SA'],
      format: 'T20I',
      matchNumber: '1st T20I',
      startTime: now + 4 * H,
      venue: 'Brian Lara Stadium',
      city: 'Tarouba, Trinidad',
      status: 'scheduled',
      digitalOnly: true,
      digitalOnlyNote: 'No Linear TV telecast on Tata Play, Airtel, or Cable in India.',
      verifiedAt: now - 1 * H,
      broadcast: t20i.broadcast,
    }),
    matchDoc({
      id: 'm_wpl8',
      series: wpl,
      teams: ['Delhi Capitals', 'RCB'],
      shortNames: ['DC', 'RCB'],
      format: 'T20',
      matchNumber: 'Match 8',
      startTime: now + 5 * H,
      venue: 'M. Chinnaswamy Stadium',
      city: 'Bengaluru',
      status: 'scheduled',
      verifiedAt: now - 6 * H,
      broadcast: wpl.broadcast,
    }),
    matchDoc({
      id: 'm_psl1',
      series: psl,
      teams: ['Lahore Qalandars', 'Karachi Kings'],
      shortNames: ['LQ', 'KK'],
      format: 'T20',
      matchNumber: 'T20',
      startTime: now + 6 * H,
      venue: 'Gaddafi Stadium',
      city: 'Lahore',
      status: 'scheduled',
      verifiedAt: now - 8 * H,
      broadcast: psl.broadcast,
    }),
  ];
}
