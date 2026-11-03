// models/NewsPost.js
// One CricCast news post. News lives in the SAME database as matches
// and series (Hy's call, Oct 27) — this model is the only new table.
// A post is born a "draft" (written by hand in the admin News Desk,
// later by the news-desk agent through its own door) and only turns
// "live" when Hy publishes it — the status field IS the approval
// gate; public pages and search read status:"live" posts only.
import mongoose, { Schema } from 'mongoose';

const imageSchema = new Schema(
  {
    src: { type: String }, // e.g. "/news/matt-henry.jpg" (free-licence only)
    alt: { type: String },
    caption: { type: String },
    credit: { type: String },
    creditUrl: { type: String },
    license: { type: String },
    position: { type: String }, // CSS object-position inside the 16:9 frame
  },
  { _id: false }
);

const sourceSchema = new Schema(
  {
    name: { type: String },
    url: { type: String },
  },
  { _id: false }
);

const relatedSchema = new Schema(
  {
    label: { type: String },
    href: { type: String },
  },
  { _id: false }
);

const newsPostSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    dek: { type: String, default: '' }, // the two-line summary under the headline
    dekExtra: { type: String, default: '' }, // extra detail line on the featured card
    tag: { type: String, default: '' }, // series line shown in meta ("India tour of …")
    topic: { type: String, default: '' }, // hub topic — "IPL", "World Cup" … (boxes at 8–10 posts)
    category: { type: String, default: 'Update' }, // Injury/Fitness/Squad/Match/Broadcast/Update
    top: { type: Boolean, default: false }, // editor's pick → Top Stories box
    status: { type: String, enum: ['draft', 'live'], default: 'draft', index: true },
    publishedAt: { type: Date, default: Date.now },
    image: { type: imageSchema, default: null },
    body: [{ type: String }], // paragraphs, in order
    related: { type: relatedSchema, default: null }, // "where to watch" box at the end
    sources: [sourceSchema], // the ≥2 sources every post must carry
  },
  { timestamps: true }
);

// WHY this guard: Next.js hot-reloads modules; without it you'd get
// "OverwriteModelError: Cannot overwrite NewsPost model" on every save.
export default mongoose.models.NewsPost || mongoose.model('NewsPost', newsPostSchema);
