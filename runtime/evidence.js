const { logEvent } = require('./log');

function writeEvidence(type, details = {}) {
  return logEvent('evidence', {
    type,
    details,
    recorded_at: new Date().toISOString()
  });
}

module.exports = { writeEvidence };
