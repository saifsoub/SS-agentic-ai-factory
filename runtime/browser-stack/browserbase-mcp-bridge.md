# Browserbase MCP Bridge

S/Factory uses Browserbase's hosted MCP endpoint as the MCP bridge for browser-agent control:

- MCP endpoint: `https://mcp.browserbase.com/mcp`
- Transport: HTTP / SHTTP
- Session tools: start, end, navigate, act, observe, extract

## Owner-presence gates

UAE Pass, OTP, MFA, CAPTCHA, passkey, and other user-presence challenges are handoff points. The browser session must remain open while the owner completes the challenge; the agent then resumes the same session.

## Boundaries

This bridge is intended for low-risk browsing tasks such as availability checks, navigation, information extraction, and form preparation. It does not authorize purchases, funds movement, account-security changes, or other consequential writes without separate approval.

No passwords, OTPs, passkeys, cookies, API keys, or session secrets are committed to GitHub.

## Runtime configuration

`browserbase-mcp.json` contains the hosted MCP endpoint configuration and no secrets. Authentication and any Browserbase account authorization are supplied at runtime by the MCP client/operator environment.
