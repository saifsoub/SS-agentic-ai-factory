import json
import os
import urllib.error
import urllib.request


GITHUB_DISPATCH_URL = (
    "https://api.github.com/repos/saifsoub/SS-agentic-ai-factory/"
    "actions/workflows/agents.yml/dispatches"
)


def run(property: str = "all", task: str = "") -> dict:
    """Dispatch the governed agents workflow and return a JSON-safe result."""
    token = os.environ.get("GITHUB_RUNTIME_TOKEN") or os.environ.get("GITHUB_TOKEN")
    if not token:
        return {"ok": False, "status": 500, "error": "missing_github_token"}

    payload = json.dumps(
        {"ref": "main", "inputs": {"property": property or "all", "task": task or ""}}
    ).encode("utf-8")
    request = urllib.request.Request(
        GITHUB_DISPATCH_URL,
        data=payload,
        method="POST",
        headers={
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "ss-agentic-ai-factory-cerebrium",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as github_response:
            status = github_response.status
    except urllib.error.HTTPError as exc:
        status = exc.code
    except urllib.error.URLError:
        return {
            "ok": False,
            "status": 502,
            "error": "github_dispatch_unreachable",
            "property": property or "all",
            "task": task or "",
        }

    return {
        "ok": 200 <= status < 300,
        "status": status,
        "property": property or "all",
        "task": task or "",
    }
