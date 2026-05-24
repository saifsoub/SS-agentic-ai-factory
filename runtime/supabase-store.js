const { logEvent } = require('./log');

async function saveRun(record = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const table = process.env.SUPABASE_RUNS_TABLE || 'agent_runs';

  if (!url || !key) {
    return logEvent('supabase', { ok: false, mode: 'dry_run', table, record });
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
