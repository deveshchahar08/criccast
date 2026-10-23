// Seed the MongoDB with sample series + matches (from lib/sampleData).
// Run: node scripts/seed.mjs   (needs MONGODB_URI in web/.env.local)
// NOTE: .mjs (not .js) because models/ use ESM `import` — plain node runs
// .js as CommonJS, where require() of an ESM model silently breaks.
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import { sampleSeries, sampleMatches } from "../lib/sampleData.js";
import Series from "../models/Series.js";
import Match from "../models/Match.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("Set MONGODB_URI in web/.env.local first");
  await mongoose.connect(uri);
  console.log("connected");

  await Match.deleteMany({});
  await Series.deleteMany({});

  const seriesIds = {};
  for (const s of sampleSeries()) {
    const doc = await Series.create({
      name: s.name,
      format: s.format,
      season: s.season,
      broadcast: s.broadcast,
    });
    seriesIds[s.name] = doc._id;
    console.log("series:", s.name);
  }

  for (const m of sampleMatches()) {
    await Match.create({
      series: seriesIds[m.series.name],
      teams: m.teams,
      shortNames: m.shortNames,
      format: m.format,
      matchNumber: m.matchNumber,
      startTime: m.startTime,
      venue: m.venue,
      city: m.city,
      status: m.status,
      resultText: m.resultText,
      digitalOnly: m.digitalOnly,
      digitalOnlyNote: m.digitalOnlyNote,
      verifiedAt: m.verifiedAt,
      sourceUrl: m.sourceUrl,
      // broadcastOverride left empty -> inherits from series (same as sample)
    });
    console.log("match:", m.teams.join(" vs "));
  }

  console.log("seed done");
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
