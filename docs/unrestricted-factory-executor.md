# S/Factory Unrestricted Executor

The existing `SS-agentic-ai-factory` remains the control plane. The unrestricted
executor is a separate GitHub Actions job boundary that deliberately receives no
Telegram, Monday, Supabase, deployment, or repository-write credentials.

## Boundary

- The executor does not check out the private factory repository.
- Copilot runs inside a disposable Docker container.
- The container receives one mounted directory: `workspace/`.
- The Docker socket and host network are not mounted.
- The job-level `GITHUB_TOKEN` has no permissions.
- The only credential in the container is the dedicated Copilot identity token.
- Generated files are scanned on the host before artifact upload.
- Symbolic links, credential files, private keys, oversized output, and common
  GitHub/S/Agency credential material are rejected.

`--allow-all-tools`, `--allow-all-paths`, and `--allow-all-urls` therefore apply
inside the disposable container, not to S/Agency repositories or infrastructure.

## Required identity

Create a dedicated GitHub identity named `S/Factory Executor` and give it only a
Copilot entitlement. Create a fine-grained token with the account-level
`Copilot Requests` permission and no repository permissions. Store it in this
repository as the Actions secret:

`S_FACTORY_EXECUTOR_COPILOT_TOKEN`

The workflow fails closed when this secret is absent.

## Operation

Run **Unrestricted Factory Executor** from the Actions tab and supply the build
task. Successful runs publish an artifact named:

`unrestricted-factory-output-<run-id>`

Artifacts are retained for seven days and contain `factory-validation.json`
with the accepted file list and byte count. Promotion into a production
repository remains a separate trusted operation.
