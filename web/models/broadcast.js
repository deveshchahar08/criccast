// models/broadcast.js
// The broadcast shape is shared by Series (the mapping) and Match
// (the rare per-match override). Defined once so the two can never drift.
import { Schema } from 'mongoose';

export const broadcastSchema = new Schema(
  {
    tvChannels: [
      {
        name: { type: String, required: true }, // e.g. "Star Sports 1 Hindi HD"
        languages: [{ type: String }], // e.g. ["Hindi"] — feeds matter to viewers
        // Channel number PER DTH operator — this is the product's moat.
        // Keys: tataPlay | airtel | dishTv | ddFreeDish (see lib/dth.js)
        // e.g. { tataPlay: "454", airtel: "282", ddFreeDish: "77" }
        numbers: { type: Schema.Types.Mixed, default: {} },
      },
    ],
    ottPlatforms: [
      {
        name: { type: String, required: true }, // e.g. "JioHotstar"
        free: { type: Boolean, default: false },
        freeNote: { type: String }, // e.g. "Free on mobile app" / "100% Free"
        languages: [{ type: String }],
        url: { type: String },
      },
    ],
    languages: [{ type: String }], // all commentary languages, for quick display
    region: { type: String, default: 'India' },
    // Verified broadcasters OUTSIDE India (v68) — for series with no India
    // route (Worldwide rule) and for NRI viewers. One row per region,
    // e.g. { region: "USA & Canada", info: "Willow TV" }.
    worldwide: [
      {
        region: { type: String, required: true },
        info: { type: String, required: true },
      },
    ],
  },
  { _id: false }
);
