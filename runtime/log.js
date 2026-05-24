const fs = require('fs');
const path = require('path');

function logEvent(channel, event) {
  const dir = path.resolve(process.cwd(), 'logs');
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${channel}.jsonl`);
  const payload = { ts: new Date().toISOString(), channel, ...event };
  fs.appendFileSync(file, JSON.stringify(payload) + '\n');
  return payload;
}

module.exports = { logEvent };
