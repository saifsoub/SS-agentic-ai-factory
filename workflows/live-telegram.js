const { logEvent } = require('../runtime/log');

async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    const missing = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'].filter((key) => !process.env[key]);
    const result = { ok: false, error: 'Telegram delivery is not configured', missing };
    logEvent('telegram', result);
    throw new Error(result.error + ': ' + missing.join(', '));
  }

  const url = 'https://api.telegram.org/bot' + token + '/sendMessage';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML', disable_web_page_preview: true })
  });
  const body = await response.json().catch(() => ({}));
  const result = { ok: response.ok, status: response.status, body };
  logEvent('telegram', result);
  return result;
}

module.exports = { sendTelegram };
