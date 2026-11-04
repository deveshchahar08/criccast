// models/AppStat.js — tiny counter store for PWA install signals.
// One document per counter key ("install:total", "install:2026-11-04",
// "first:total", "first:2026-11-04"); counts are only ever moved by
// the $inc upserts in /api/app-event. Kept deliberately separate from
// the content models — this is bookkeeping, not site data.
import mongoose, { Schema } from 'mongoose';

const appStatSchema = new Schema({
  key: { type: String, unique: true, required: true },
  count: { type: Number, default: 0 },
});

export default mongoose.models.AppStat || mongoose.model('AppStat', appStatSchema);
