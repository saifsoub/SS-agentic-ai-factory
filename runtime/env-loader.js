const fs = require('fs');
const path = require('path');

function loadEnvironment(fileName = '.env') {
  const filePath = path.resolve(process.cwd(), fileName);
  const values = {};
  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const splitAt = trimmed.indexOf('=');
      if (splitAt === -1) continue;
      const key = trimmed.slice(0, splitAt).trim();
      const value = trimmed.slice(splitAt + 1).trim();
      values[key] = value;
    }
  }
  return { ...values, ...process.env };
}

function checkEnvironment(requiredKeys = []) {
  const env = loadEnvironment();
  const missing = requiredKeys.filter((key) => !env[key]);
  return { env, missing, ready: missing.length === 0 };
}

module.exports = { loadEnvironment, checkEnvironment };
