// app/api/cron/sync/route.js — GET: daily automatic fixture sync via
// Vercel Cron (see vercel.json). Guarded by CRON_SECRET — Vercel sends
// `Authorization: Bearer <CRON_SECRET>` on every cron invocation.
// Same sync core as the admin "Sync Now" button (lib/runSync.js).
import { NextResponse } from "next/server";
import { runSync } from "@/lib/runSync";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }
  try {
    const data = await runSync();
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: e.message || "Sync failed." },
      { status: e.statusCode || 500 }
    );
  }
}
