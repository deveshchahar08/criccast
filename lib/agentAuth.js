// lib/agentAuth.js
// The coverage agent's door into the site (v64). Guarded by its OWN secret
// (x-agent-token header vs AGENT_SECRET env var) — deliberately separate
// from ADMIN_TOKEN so this credential can only ever do what the agent
// routes allow (look up pool series + add UNVERIFIED series/matches).
// It can never verify, edit or delete anything.
export function checkAgentToken(request) {
  const token = request.headers.get('x-agent-token');
  const expected = process.env.AGENT_SECRET;
  if (!expected) {
    return { ok: false, error: 'AGENT_SECRET is not configured on the server' };
  }
  if (token !== expected) {
    return { ok: false, error: 'Unauthorized' };
  }
  return { ok: true };
}
