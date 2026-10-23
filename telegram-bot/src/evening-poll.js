import { sendMessage } from './telegram.js';
import { isBotEnabled } from './bot-control.js';

export async function runEveningPoll() {
  console.log('🚀 Running Evening Study Accountability Poll...');

  // Check remote kill-switch / admin toggle
  const enabled = await isBotEnabled('evening');
  if (!enabled) {
    console.log('⏸️ Telegram Bot (Evening Poll) is PAUSED via Admin Dashboard. Skipping.');
    return { skipped: true, reason: 'bot_paused_by_admin' };
  }

  const todayIST = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const question = `📊 [Daily Aspirants Check • ${todayIST}]\nAaj kitne ghante focused self-study hui?`;
  const options = [
    '🚀 8+ Ghante (Topper Mode!)',
    '⚡ 6 to 8 Ghante (Solid Focus!)',
    '🎯 4 to 6 Ghante (Good Progress!)',
    '🔄 2 to 4 Ghante (Push harder kal!)',
    '😴 Aaj break/kam padhai (Kal double mehnat!)'
  ];

  try {
    const rawChatId = process.env.TELEGRAM_CHAT_ID || '';
    const [channelChatId] = rawChatId.split(',').map((s) => s.trim());

    // Send anonymous poll (regular poll, not quiz)
    const BASE_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;
    const pollPayload = {
      chat_id: channelChatId || undefined,
      question,
      options,
      is_anonymous: true,
      allows_multiple_answers: false,
    };

    const res = await fetch(`${BASE_URL}/sendPoll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pollPayload),
    });

    const pollResult = await res.json();
    console.log('✅ Evening poll sent successfully to Public Channel!');

    // Follow-up encouragement
    const followUp = `🌙 <b>Evening Review:</b>\n` +
      `Apna target track karein aur kal ka routine sone se pehle likh kar soyein. Consistency hi rankers banati hai!\n\n` +
      `⏱️ <b>Online Pomodoro &amp; Study Clock:</b>\n` +
      `👉 <a href="https://indiantimers.com/tools/study-timer/">indiantimers.com/tools/study-timer/</a>`;

    await sendMessage(followUp, { disableWebPreview: true, chatId: channelChatId || undefined });

    return pollResult;
  } catch (error) {
    console.error('❌ Failed to send evening poll:', error.message);
    throw error;
  }
}

if (process.argv[1]?.endsWith('evening-poll.js')) {
  runEveningPoll().catch(() => process.exit(1));
}
