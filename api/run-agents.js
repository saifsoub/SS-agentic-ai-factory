export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const token = process.env.GITHUB_RUNTIME_TOKEN || process.env.GITHUB_TOKEN;
  if (!token) return response.status(500).json({ ok: false, error: 'missing_github_token' });

  const githubResponse = await fetch('https://api.github.com/repos/saifsoub/SS-agentic-ai-factory/actions/workflows/agents.yml/dispatches', {
    method: 'POST',
    headers: {
      authorization: 'Bearer ' + token,
      accept: 'application/vnd.github+json',
      'content-type': 'application/json',
      'x-github-api-version': '2022-11-28'
    },
    body: JSON.stringify({ ref: 'main' })
  });

  return response.status(githubResponse.ok ? 200 : githubResponse.status).json({ ok: githubResponse.ok, status: githubResponse.status });
}
