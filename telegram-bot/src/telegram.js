/**
 * Minimalist, dependency-free Telegram Bot API Client
 * Uses native fetch available in Node.js 18+
 */

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

if (!BOT_TOKEN && process.env.NODE_ENV !== 'test') {
  console.warn('⚠️ WARNING: TELEGRAM_BOT_TOKEN is not set in environment variables.');
}

const BASE_URL = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Sends a rich text message to the channel or chat.
 */
export async function sendMessage(text, options = {}) {
  const url = `${BASE_URL}/sendMessage`;
  const payload = {
    chat_id: options.chatId || CHAT_ID,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: options.disableWebPreview || false,
    ...options,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API Error (sendMessage): ${data.description}`);
  }
  return data;
}

/**
 * Sends a photo with an aesthetic caption to the channel.
 */
export async function sendPhoto(photoUrl, caption, options = {}) {
  const url = `${BASE_URL}/sendPhoto`;
  const payload = {
    chat_id: options.chatId || CHAT_ID,
    photo: photoUrl,
    caption,
    parse_mode: 'HTML',
    ...options,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API Error (sendPhoto): ${data.description}`);
  }
  return data;
}

/**
 * Sends an official Telegram Interactive Quiz Poll to the channel.
 */
export async function sendQuizPoll(question, pollOptions, correctOptionId, explanation, options = {}) {
  const url = `${BASE_URL}/sendPoll`;
  const payload = {
    chat_id: options.chatId || CHAT_ID,
    question,
    options: pollOptions,
    type: 'quiz',
    correct_option_id: correctOptionId,
    explanation,
    is_anonymous: true,
    ...options,
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API Error (sendPoll): ${data.description}`);
  }
  return data;
}
