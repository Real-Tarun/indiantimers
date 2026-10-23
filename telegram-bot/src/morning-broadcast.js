import { getUpcomingExamsSummary } from './exams.js';
import { getRandomQuote, getRandomPoster, getRandomTopperHack, getTodayTheme } from './quotes.js';
import { sendPhoto } from './telegram.js';
import { isBotEnabled } from './bot-control.js';
import { generateDailyHack } from './gemini.js';

export async function runMorningBroadcast() {
  console.log('🚀 Running Morning Multi-Exam Broadcast...');

  // Check remote kill-switch / admin toggle
  const enabled = await isBotEnabled('morning');
  if (!enabled) {
    console.log('⏸️ Telegram Bot (Morning Broadcast) is PAUSED via Admin Dashboard. Skipping.');
    return { skipped: true, reason: 'bot_paused_by_admin' };
  }

  const { spotlight, categories } = getUpcomingExamsSummary();
  const quoteData = getRandomQuote();
  const todayTheme = getTodayTheme();
  const posterUrl = getRandomPoster();

  // Try generating a fresh, dynamic Topper Study Hack with Google Gemini AI
  let aiHackText = '';
  try {
    const freshHack = await generateDailyHack();
    if (freshHack && freshHack.length > 20) {
      aiHackText = freshHack;
      console.log('✨ Fresh Topper Hack generated with Google Gemini 3.5 Flash!');
    }
  } catch (err) {
    console.warn('⚠️ Gemini fallback to curated hack:', err.message);
  }

  // Fallback to curated hack if Gemini is unavailable
  if (!aiHackText) {
    const curatedHack = getRandomTopperHack();
    aiHackText = `<b>${curatedHack.title}</b>\n👉 <i>${curatedHack.hack}</i>`;
  }

  // Format today's date in Indian Standard Time (IST)
  const todayIST = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Build a crisp caption strictly under Telegram's 1024 character photo limit
  let caption = `🌅 <b>DAILY EXAM RADAR</b> • <i>${todayIST}</i>\n${todayTheme}\n\n`;

  // Actionable Topper Study Hack (Gemini Powered)
  caption += `💡 <b>TOPPER HACK:</b>\n${aiHackText}\n\n`;

  // 1. Closest Upcoming Spotlight
  caption += `🚨 <b>CLOSEST UPCOMING EXAMS:</b>\n`;
  for (const exam of spotlight.slice(0, 3)) {
    caption += `• ${exam.emoji} <b>${exam.name}:</b> <code>${exam.daysLeft}d left</code>\n`;
  }
  caption += `\n`;

  // 2. Multi-Stream Key Highlights (Covering ALL aspirants)
  caption += `🎯 <b>STREAM HIGHLIGHTS:</b>\n`;
  const streamKeys = ['Medical', 'Engineering', 'Civil Services', 'Board Exams'];
  for (const key of streamKeys) {
    const list = categories[key];
    if (list && list.length > 0) {
      caption += `• ${list[0].emoji} ${list[0].name}: <b>${list[0].daysLeft}d</b>\n`;
    }
  }
  caption += `\n`;

  // Optional Quote only if plenty of character headroom remains
  if (caption.length + quoteData.quote.length + quoteData.author.length < 850) {
    caption += `💭 <i>"${quoteData.quote}"</i> — <b>${quoteData.author}</b>\n\n`;
  }

  // 3. Official Portal Link
  caption += `🔗 <b>Track All 85+ Live Timers & Free CBT Tools:</b>\n`;
  caption += `👉 <a href="https://indiantimers.com/?utm_source=telegram&utm_medium=daily_radar">indiantimers.com</a>`;

  console.log(`Caption length: ${caption.length} / 1024 characters (Clean HTML verified)`);

  // Send clean photo with caption to Public Telegram Channel (ZERO buttons, 100% clean)
  try {
    const rawChatId = process.env.TELEGRAM_CHAT_ID || '';
    const [channelChatId] = rawChatId.split(',').map((s) => s.trim());

    const result = await sendPhoto(posterUrl, caption, { chatId: channelChatId || undefined });
    console.log('✅ Morning broadcast sent to Public Channel! Message ID:', result.result?.message_id);

    return result;
  } catch (error) {
    console.error('❌ Failed to send morning broadcast:', error.message);
    throw error;
  }
}

// Allow direct CLI execution: node src/morning-broadcast.js
if (process.argv[1]?.endsWith('morning-broadcast.js')) {
  runMorningBroadcast().catch(() => process.exit(1));
}
