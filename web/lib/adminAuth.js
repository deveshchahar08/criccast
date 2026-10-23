// lib/adminAuth.js
// Admin routes are guarded by a shared token (x-admin-token header).
// Before public launch this MUST become a real login — a shared token in
// an env var is fine for one admin, not for the open internet.
export function checkAdminToken(request) {
  const token = request.headers.get('x-admin-token');
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return { ok: false, error: 'ADMIN_TOKEN is not configured on the server' };
  }
  if (token !== expected) {
    return { ok: false, error: 'Unauthorized' };
  }
  return { ok: true };
}
