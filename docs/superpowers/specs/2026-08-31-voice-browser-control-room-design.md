# Voice Browser Control Room Bridge — Design

## Goal

Make the existing S/ browser runtime callable from the S/ Control Room and voice-driven requests through one governed adapter, while preserving the same browser session across UAE Pass / OTP / MFA / passkey / CAPTCHA owner-authentication handoffs.

## Scope

This change connects the existing browser stack (OpenBrowser, Stagehand, `agent-browser`, and Browserbase MCP) to a single Control Room-facing browser task interface. It covers low-risk navigation, availability checks, page inspection/extraction, and form preparation. It does not authorize purchases, funds movement, account-security changes, or other consequential writes.

## Architecture

The Control Room calls a single Browser Runtime Adapter instead of calling individual browser engines directly. The adapter owns task state, backend selection, session identity, owner-authentication pauses, resume semantics, evidence capture, and health reporting.

Primary routing is Browserbase MCP for persistent remote browser sessions. Stagehand is used for resilient higher-level browser actions. `agent-browser` remains the deterministic local/CDP fallback. OpenBrowser remains the privacy-first local interactive fallback. Backend choice is internal to the adapter so callers do not couple to a provider.

## Control Room Interface

The adapter exposes these HTTP endpoints:

- `POST /browser/run` — create and start a browser task.
- `GET /browser/status/:taskId` — return normalized task state and redacted evidence metadata.
- `POST /browser/resume/:taskId` — resume a paused task after owner-authentication confirmation.
- `GET /browser/health` — report adapter readiness and backend availability without exposing credentials.

The initial request schema is:

```json
{
  "source": "control-room|voice",
  "intent": "navigate|inspect|availability-check|form-prepare",
  "target": "https://example.com",
  "instruction": "natural-language browser instruction",
  "preferredBackend": "auto|browserbase|stagehand|agent-browser|openbrowser",
  "allowOwnerAuthHandoff": true
}
```

The response includes `taskId`, normalized `state`, selected backend, a redacted result/evidence envelope when available, and `handoff` metadata when owner presence is required.

## Task State Model

Allowed states:

- `QUEUED`
- `RUNNING`
- `AWAITING_OWNER_AUTH`
- `RESUMING`
- `SUCCEEDED`
- `FAILED`
- `CANCELLED`

A task may enter `AWAITING_OWNER_AUTH` only when the browser reaches an authentication or user-presence gate. The adapter must preserve the browser session identifier and enough non-secret execution context to continue the same task after authentication.

## Owner Authentication Handoff

UAE Pass, OTP, MFA, passkeys, CAPTCHA, and equivalent user-presence gates are handoff points, not failures.

When a handoff is required, the adapter returns:

```json
{
  "state": "AWAITING_OWNER_AUTH",
  "handoff": {
    "type": "UAE_PASS|OTP|MFA|PASSKEY|CAPTCHA|OTHER",
    "sessionId": "opaque-session-id",
    "message": "Owner authentication required",
    "expiresAt": "ISO-8601 timestamp or null"
  }
}
```

The adapter must never log or return passwords, OTP values, passkeys, cookies, bearer tokens, API keys, or raw authentication payloads. The caller only receives the minimum metadata required to present a handoff to the owner and resume afterward.

## Runtime Adapter Responsibilities

The Browser Runtime Adapter must:

1. Validate and normalize Control Room / voice requests.
2. Select a backend using deterministic routing rules.
3. Create or reuse a browser session where supported.
4. Execute the requested low-risk browser operation.
5. Detect owner-authentication gates and pause safely.
6. Resume the same task/session after explicit owner-authentication confirmation.
7. Produce redacted evidence: timestamps, requested target, backend, state transitions, page title/URL when safe, and structured result data.
8. Expose backend health without exposing secrets.

## Backend Routing

Default routing:

- Browserbase MCP: default for remote persistent sessions and owner-auth handoff flows.
- Stagehand: preferred when semantic/self-healing page interaction is required.
- `agent-browser`: fallback for deterministic Chrome/CDP automation and smoke tests.
- OpenBrowser: privacy-first local fallback where an interactive local Chromium path is appropriate.

If `preferredBackend` is `auto`, the adapter starts with Browserbase MCP and falls back only when the requested capability is unavailable or the backend health check fails. Fallback must not silently create a second authenticated session during an owner-auth flow.

## Voice Session Boundary

The voice layer does not directly control browser providers. It translates the user's browser request into the same `/browser/run` contract used by the Control Room and reports normalized task state. If authentication is required, voice reports that owner action is needed and the underlying task remains paused until `/browser/resume/:taskId` is called.

This keeps voice disposable and provider-agnostic: a voice session may disconnect without destroying the browser task/session if the runtime supports persistence.

## Persistence

For the first implementation, task metadata may be kept in an in-process task store when running a single runtime instance, but the interface must isolate persistence behind a small task-store module so it can later move to Supabase/Postgres/Redis without changing the API contract.

Persist only non-secret metadata:

- task ID
- source and intent
- redacted target/instruction metadata
- backend name
- opaque provider session ID
- normalized state
- timestamps
- redacted evidence/result envelope

Never persist credentials, OTPs, cookies, passkeys, or raw provider secrets.

## Error Handling

Errors are normalized into a safe response with `code`, `message`, `retryable`, and current task state. Provider stack traces and secrets never leave the runtime.

Required error classes include:

- `INVALID_REQUEST`
- `BACKEND_UNAVAILABLE`
- `AUTH_HANDOFF_REQUIRED`
- `SESSION_EXPIRED`
- `NAVIGATION_FAILED`
- `TASK_NOT_FOUND`
- `RESUME_NOT_ALLOWED`
- `POLICY_BLOCKED`

A failed backend may be retried on a fallback backend only before owner authentication begins. Once a task enters `AWAITING_OWNER_AUTH`, backend/session switching is forbidden unless the task is explicitly restarted.

## Policy Boundary

Allowed by this adapter:

- navigation
- reading page content
- availability checks
- extraction
- screenshots/redacted evidence
- form preparation that does not submit a consequential action
- owner-approved authentication handoff

Separately governed and not implicitly authorized:

- purchases or payments
- transfers or financial actions
- account-security changes
- destructive actions
- final submission of consequential forms

## Health and Observability

`GET /browser/health` returns only capability state such as:

```json
{
  "status": "ok|degraded|down",
  "backends": {
    "browserbase": "ready|unconfigured|down",
    "stagehand": "ready|down",
    "agent-browser": "ready|down",
    "openbrowser": "ready|down"
  }
}
```

Task evidence records state transitions and backend choice with timestamps. Logs must redact secrets and authentication material.

## Verification Strategy

The implementation is accepted only after these tests pass:

1. Unit test: request validation rejects unsupported intents and consequential actions.
2. Unit test: backend routing selects Browserbase for `auto` when healthy and deterministic fallback when unhealthy.
3. Unit test: authentication detection moves a task to `AWAITING_OWNER_AUTH` while preserving its session ID.
4. Unit test: `/browser/resume/:taskId` resumes only paused tasks and preserves the same session ID.
5. Unit test: evidence/log serialization redacts secret-like fields.
6. Integration smoke: `POST /browser/run` opens `about:blank` or `https://example.com`, returns a task ID, captures safe title/URL evidence, and reaches `SUCCEEDED`.
7. Health smoke: `/browser/health` reports backend capability states without secret values.
8. Failure smoke: simulated provider failure returns normalized `BACKEND_UNAVAILABLE` or uses a permitted pre-auth fallback.

## First Real-World Flow After Technical Verification

Use the same adapter for the Fakeeh University Hospital dermatology flow:

1. Navigate to the hospital booking path.
2. Inspect Dermatology availability without confirming a booking.
3. If UAE Pass is requested, enter `AWAITING_OWNER_AUTH` and preserve the active session.
4. After owner approval, resume the same session and continue availability inspection.
5. Do not submit a final appointment booking unless separately requested and approved.

## Non-Goals

- No new browser engine.
- No direct voice-to-provider integration.
- No credential vault implementation in this change.
- No payment or high-impact transaction capability.
- No duplication of the existing browser-stack installation logic.

## Success Criteria

The change is successful when a voice or Control Room request can invoke `/browser/run`, the adapter executes through the existing browser stack, authentication pauses are represented as `AWAITING_OWNER_AUTH`, `/browser/resume/:taskId` continues the same session, and the complete low-risk smoke path is evidenced without exposing credentials or secrets.
