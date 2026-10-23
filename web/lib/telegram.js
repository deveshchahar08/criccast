// lib/telegram.js — owner-only ops alerts via the Telegram Bot API (v62).
// The bot only informs; it never changes anything in the admin.
//
// Deliberately dependency-free (plain fetch) and SILENTLY INERT when the env
// vars are missing — the site must never break, or spam errors, because the
// bot isn't configured yet. Hy creates the bot via BotFather and sets:
//   TELEGRAM_BOT_TOKEN  — the token BotFather gives him (never in chat/code)
//   TELEGRAM_CHAT_ID    — his own chat id with the bot
export function telegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegram(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text }),
    });
    return res.ok;
  } catch {
    return false; // network hiccup — alerts are best-effort, never fatal
  }
}
