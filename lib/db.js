// lib/db.js
// WHY this file exists: in Next.js every API route / server component runs in
// its own invocation. Without caching, each one would open a NEW MongoDB
// connection — you'd hit connection limits in minutes. This caches ONE
// connection on the global object and reuses it across hot reloads + requests.
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global._kahanDekhunMongoose;
if (!cached) cached = global._kahanDekhunMongoose = { conn: null, promise: null };

export async function dbConnect() {
  if (cached.conn) return cached.conn;
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI env var is not set');
  }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// True when a real DB is configured. Pages fall back to sample data otherwise
// so `npm run dev` works on day one with zero setup.
export function hasDb() {
  return Boolean(MONGODB_URI);
}
