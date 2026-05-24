const fs = require('fs');
const path = require('path');

function loadVerticals() {
  const file = path.join(process.cwd(), 'data', 'verticals.json');
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function generateSignals() {
  const verticals = loadVerticals();

  return verticals.map((vertical) => ({
    vertical: vertical.vertical,
    offer: vertical.offer,
    price_aed: vertical.price_aed,
    target_problem: vertical.buyer_pains[0],
    workflow: vertical.workflow,
    generated_at: new Date().toISOString()
  }));
}

if (require.main === module) {
  console.log(JSON.stringify(generateSignals(), null, 2));
}

module.exports = { generateSignals };
