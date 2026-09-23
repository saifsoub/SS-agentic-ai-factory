const { generateSignals } = require('./revenue-signal-loop');
const { generateOfferPacks } = require('./offer-pack-generator');

function runRevenueWorkflow(input = {}) {
  const signals = generateSignals();
  const offerPacks = generateOfferPacks();

  return {
    workflow: 'revenue',
    status: 'completed',
    input,
    generated_at: new Date().toISOString(),
    evidence: {
      signal_count: signals.length,
      offer_pack_count: offerPacks.length
    },
    signals,
    offer_packs: offerPacks,
    rule: 'Revenue is confirmed only from external payment evidence; this workflow produces executable revenue assets.'
  };
}

if (require.main === module) {
  console.log(JSON.stringify(runRevenueWorkflow({ source: 'manual' }), null, 2));
}

module.exports = { runRevenueWorkflow };
