// app/api/admin/sync/route.js — POST: manual "Sync Now" from the admin panel.
// Token-guarded (x-admin-token). The sync core lives in lib/runSync.js,
// shared with Vercel Cron (GET /api/cron/sync).
import { NextResponse } from "next/server";
import { checkAdminToken } from "@/lib/adminAuth";
import { runSync } from "@/lib/runSync";

export async function POST(request) {
  const auth = checkAdminToken(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });
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
