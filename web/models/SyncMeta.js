// models/SyncMeta.js — tiny key/value store for sync bookkeeping.
// Used to cache the CricAPI series id->name map: /series has 1000+ entries
// (~48 API hits to page through), but the list barely changes, so we cache
// it and only re-fetch when matches reference an unknown series id.
import mongoose, { Schema } from 'mongoose';

const syncMetaSchema = new Schema({
  key: { type: String, unique: true, required: true },
  data: { type: Schema.Types.Mixed },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.SyncMeta || mongoose.model('SyncMeta', syncMetaSchema);
