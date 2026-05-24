function runRevenueWorkflow(input = {}) {
  return {
    workflow: 'revenue',
    status: 'dry_run',
    input,
    rule: 'confirmed revenue requires evidence'
  };
}

if (require.main === module) {
  console.log(JSON.stringify(runRevenueWorkflow({ source: 'manual_test' }), null, 2));
}

module.exports = { runRevenueWorkflow };
