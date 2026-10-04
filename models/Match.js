// models/Match.js
import mongoose, { Schema } from 'mongoose';
import { broadcastSchema } from './broadcast.js';

const matchSchema = new Schema(
  {
    series: { type: Schema.Types.ObjectId, ref: 'Series', required: true },
    externalId: { type: String, index: true, sparse: true }, // CricAPI id for sync
    teams: {
      type: [String],
      validate: (v) => v.length === 2, // a match is always exactly two teams
    },
    shortNames: { type: [String], default: [] }, // e.g. ["IND", "AUS"] for the circles
    format: { type: String },
    matchNumber: { type: String }, // e.g. "Match 14" / "Day 3" / "1st T20I"
    startTime: { type: Date, required: true }, // always UTC; displayed in IST
    venue: { type: String },
    city: { type: String },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'finished'],
      default: 'scheduled',
    },
    resultText: { type: String }, // e.g. "IND won by 5 wickets" (finished matches)
    // Rare per-match exception — when set and non-empty, WINS over the series.
    broadcastOverride: { type: broadcastSchema },
    digitalOnly: { type: Boolean, default: false }, // no linear TV telecast
    digitalOnlyNote: { type: String }, // e.g. "No Linear TV telecast on Tata Play…"
    verifiedAt: { type: Date, default: null }, // null = not verified yet
    sourceUrl: { type: String }, // quiet link, detail page only
  },
  { timestamps: true }
);

// The ONE place that decides what broadcast info to display.
// UI code never guesses — it calls resolveBroadcast(match).
export function resolveBroadcast(match) {
  const o = match.broadcastOverride;
  const hasOverride =
    o && ((o.tvChannels && o.tvChannels.length) || (o.ottPlatforms && o.ottPlatforms.length));
  if (hasOverride) return o;
  const s = match.series;
  // series may be an ObjectId (not populated) — then there's nothing to inherit
  if (s && typeof s === 'object' && s.broadcast) return s.broadcast;
  return null;
}

export default mongoose.models.Match || mongoose.model('Match', matchSchema);
