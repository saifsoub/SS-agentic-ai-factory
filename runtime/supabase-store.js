const { logEvent } = require('./log');

async function saveRun(record = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_RUNS_TABLE || 'agent_runs';

  if (!url || !key) {
    const missing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((name) => !process.env[name]);
    const result = { ok: false, error: 'Supabase persistence is not configured', missing, table };
    logEvent('supabase', result);
    throw new Error(result.error + ': ' + missing.join(', '));
  }

  const endpoint = url.replace(/\/$/, '') + '/rest/v1/' + table;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: key,
      authorization: 'Bearer ' + key,
      'content-type': 'application/json',
      prefer: 'return=representation'
    },
    body: JSON.stringify({ payload: record, created_at: new Date().toISOString() })
  });

  const body = await response.text();
  return logEvent('supabase', { ok: response.ok, status: response.status, table, body });
}

module.exports = { saveRun };
