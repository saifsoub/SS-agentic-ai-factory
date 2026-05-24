const { runRevenueWorkflow } = require('./revenue.workflow');
const { runMonitoringWorkflow } = require('./monitoring.workflow');

function runAutonomousLoop() {
  return {
    started_at: new Date().toISOString(),
    revenue: runRevenueWorkflow({ source: 'loop' }),
    monitoring: runMonitoringWorkflow(),
    mode: 'continuous_ready'
  };
}

if (require.main === module) {
  console.log(JSON.stringify(runAutonomousLoop(), null, 2));
}

module.exports = { runAutonomousLoop };
