# S/ Browser Runtime Stack

This package makes three browser engines available to S/Factory on demand:

1. **OpenBrowser** — `OpenBrowserAI/openbrowser`, pinned to commit `b04fcf631fe67ddf7ab6d54f6388635d16f468f9` for a local/privacy-first Chromium path.
2. **Stagehand + Browserbase** — `@browserbasehq/stagehand@4.0.2` for production browser-agent sessions, including persistent remote browser workflows when Browserbase credentials are injected at runtime.
3. **Vercel Labs agent-browser** — `agent-browser@0.35.2` for direct Chrome/CDP automation and deterministic CLI control.

## Bootstrap

From repository root:

```bash
npm run browser:bootstrap
npm run browser:verify
```

The bootstrap installs the two pinned npm packages, downloads Chrome for `agent-browser`, clones OpenBrowser at the reviewed commit, installs its dependencies, and builds it. Runtime artifacts live under `runtime/browser-stack/.vendor` and are intentionally not committed.

## Use

For deterministic browser control:

```bash
npm run browser:agent -- open https://example.com
npm run browser:agent -- snapshot
npm run browser:agent -- close
```

Use Stagehand when an agent needs resilient higher-level browser actions or a Browserbase-backed remote session. Use OpenBrowser when a local, privacy-first interactive Chromium path is preferable.

## Human authentication handoff

Login, UAE Pass, OTP, MFA, passkey, CAPTCHA, and other user-presence gates are **handoff points**, not failures. The browser worker must pause without fabricating credentials, expose the interactive session through the configured operator channel, allow the owner to approve/authenticate, and then continue in the same session.

The browser worker must never commit, log, echo, or persist passwords, OTPs, passkeys, session cookies, API keys, or other secrets. Browserbase/model credentials are injected only at runtime and are not part of this repository.

## Transaction boundary

Browser access does not imply permission to make purchases, transfer funds, change account security, or perform another consequential write. Those actions remain separately governed. Low-risk navigation, availability checks, form preparation, and owner-approved authentication can proceed under normal browser-worker policy.
