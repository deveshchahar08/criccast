// models/Series.js
// Broadcast rights are sold PER SERIES (not per match), so the mapping lives
// here once — every match in the series inherits it automatically.
import mongoose, { Schema } from 'mongoose';
import { broadcastSchema } from './broadcast.js';

const seriesSchema = new Schema(
  {
    name: { type: String, required: true }, // e.g. "Border-Gavaskar Trophy 2026"
    teams: [{ type: String }],
    format: { type: String }, // "Test" / "ODI" / "T20I" / "IPL" …
    season: { type: String },
    broadcast: { type: broadcastSchema, default: () => ({}) },
    // Display priority — bigger shows first on home/fixtures (e.g. India series = 10, Ranji = 5).
    priority: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// WHY this guard: Next.js hot-reloads modules; without it you'd get
// "OverwriteModelError: Cannot overwrite Series model" on every save.
export default mongoose.models.Series || mongoose.model('Series', seriesSchema);
