const { runRevenueWorkflow } = require('./revenue.workflow');
const { runMonitoringWorkflow } = require('./monitoring.workflow');
const { runAutonomousLoop } = require('./autonomous.loop');
const { sendTelegram } = require('./live-telegram');

async function startAgents() {
  const runtime = {
    revenue_agent: runRevenueWorkflow({ source: 'agent_runtime' }),
    monitoring_agent: runMonitoringWorkflow(),
    operator_agent: runAutonomousLoop(),
    started_at: new Date().toISOString(),
    status: 'running'
  };

  await sendTelegram('✅ SS Agent Runtime Started');

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
