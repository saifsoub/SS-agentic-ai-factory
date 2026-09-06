const { runRevenueWorkflow } = require('./revenue.workflow');
const { runMonitoringWorkflow } = require('./monitoring.workflow');
const { runAutonomousLoop } = require('./autonomous.loop');
const { sendTelegram } = require('./live-telegram');
const { generateSignals } = require('./revenue-signal-loop');
const { generateOfferPacks } = require('./offer-pack-generator');
const { runPortfolioOrchestrator } = require('./portfolio-orchestrator');

async function startAgents() {
  const portfolio = await runPortfolioOrchestrator();

  const runtime = {
    portfolio_orchestrator: portfolio,
    revenue_agent: runRevenueWorkflow({ source: 'agent_runtime' }),
    monitoring_agent: runMonitoringWorkflow(),
    operator_agent: runAutonomousLoop(),
    revenue_signals: generateSignals(),
    offer_packs: generateOfferPacks(),
    started_at: new Date().toISOString(),
    status: 'running'
  };

  const totals = portfolio && portfolio.totals ? portfolio.totals : {};
  await sendTelegram(
    `✅ S/Factory orchestration cycle running\n` +
    `Companies mapped: ${totals.mapped_companies ?? 'n/a'}\n` +
    `Urgent items: ${totals.urgent_items ?? 'n/a'}\n` +
    `Open items: ${totals.open_items ?? 'n/a'}`
  );

  return runtime;
}

if (require.main === module) {
  startAgents()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { startAgents };
