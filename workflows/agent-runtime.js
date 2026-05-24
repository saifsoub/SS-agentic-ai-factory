const { runRevenueWorkflow } = require('./revenue.workflow');
const { runMonitoringWorkflow } = require('./monitoring.workflow');
const { runAutonomousLoop } = require('./autonomous.loop');

function startAgents() {
  return {
    revenue_agent: runRevenueWorkflow({ source: 'agent_runtime' }),
    monitoring_agent: runMonitoringWorkflow(),
    operator_agent: runAutonomousLoop(),
    started_at: new Date().toISOString(),
    status: 'running'
  };
}

if (require.main === module) {
  console.log(JSON.stringify(startAgents(), null, 2));
}

module.exports = { startAgents };
