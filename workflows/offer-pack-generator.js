const fs = require('fs');
const path = require('path');

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), file), 'utf8'));
}

function generateOfferPacks() {
  const verticals = readJson('data/verticals.json');
  return verticals.map((v) => ({
    title: v.offer,
    price_aed: v.price_aed,
    promise: 'paid 7-day pilot with a specific admin workflow delivered and measured',
    target_vertical: v.vertical,
    buyer_pain: v.buyer_pains.join('; '),
    workflow: v.workflow,
    payment_rule: 'payment before activation',
    proof_required: ['baseline', 'workflow delivered', 'buyer confirmation', 'time saved or response improvement'],
    outreach_hook: `Your team may be losing value through ${v.buyer_pains[0]}. I can set up a focused 7-day workflow for AED ${v.price_aed}.`
  }));
}

if (require.main === module) {
  console.log(JSON.stringify(generateOfferPacks(), null, 2));
}

module.exports = { generateOfferPacks };
