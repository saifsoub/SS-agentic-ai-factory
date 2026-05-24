export default function handler(request, response) {
  response.status(200).json({
    ok: true,
    runtime: 'vercel',
    required: {
      github: Boolean(process.env.GITHUB_RUNTIME_TOKEN || process.env.GITHUB_TOKEN),
      telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
      supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY),
      monday: Boolean(process.env.MONDAY_API_TOKEN)
    },
    checked_at: new Date().toISOString()
  });
}
