# S/ Agentic AI Factory

Execution-first Cursor agent runtime.

Structure:
- .cursor/rules
- workflows
- runtime
- agents
- logs

Principles:
- Real execution only
- No fake metrics
- Approval-gated external actions
- Logs as evidence

## Unrestricted execution chamber

The `Unrestricted Factory Executor` workflow gives Copilot unrestricted tools,
paths, and URLs inside a disposable Docker workspace. It does not check out the
private factory repository or inherit S/Agency operational secrets. Output must
pass the host-side artifact boundary validator before it can be uploaded.

See `docs/unrestricted-factory-executor.md` for the identity and activation
requirements.
