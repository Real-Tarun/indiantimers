import { getUpcomingExamsSummary } from './exams.js';
import { getRandomQuote, getRandomPoster } from './quotes.js';
import { sendPhoto } from './telegram.js';

export async function runMorningBroadcast() {
  console.log('🚀 Running Morning Multi-Exam Broadcast...');

  const { spotlight, categories } = getUpcomingExamsSummary();
  const quoteData = getRandomQuote();
  const posterUrl = getRandomPoster();

  // Format today's date in Indian Standard Time (IST)
  const todayIST = new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Build a crisp caption strictly under Telegram's 1024 character photo limit
  let caption = `🌅 <b>DAILY EXAM COUNTDOWN</b> • <i>${todayIST}</i>\n\n`;

  // Motivational quote
  caption += `💭 <i>"${quoteData.quote}"</i>\n`;
  caption += `— <b>${quoteData.author}</b>\n\n`;

  // 1. Closest Upcoming Spotlight
  caption += `🚨 <b>CLOSEST UPCOMING EXAMS:</b>\n`;
  for (const exam of spotlight) {
    caption += `• ${exam.emoji} <b>${exam.name}:</b> <code>${exam.daysLeft}d left</code>\n`;
  }
  caption += `\n`;

  // 2. Multi-Stream Key Highlights (Covering ALL aspirants)
  caption += `📊 <b>MAJOR NATIONAL EXAMS:</b>\n`;
  caption += `• 🩺 <b>NEET UG:</b> <code>${categories['🩺 Medical & Healthcare']?.[0]?.daysLeft ?? '--'}d</code> | 💉 <b>NEET PG:</b> <code>${categories['🩺 Medical & Healthcare']?.[1]?.daysLeft ?? '--'}d</code>\n`;
  caption += `• ⚙️ <b>JEE Main (S1):</b> <code>${categories['⚙️ Engineering & Tech']?.[0]?.daysLeft ?? '--'}d</code> | 💻 <b>GATE:</b> <code>${categories['⚙️ Engineering & Tech']?.[1]?.daysLeft ?? '--'}d</code>\n`;
  caption += `• 🏛️ <b>UPSC Prelims:</b> <code>${categories['🏛️ Civil Services & Govt']?.[0]?.daysLeft ?? '--'}d</code> | 📋 <b>SSC CGL:</b> <code>${categories['🏛️ Civil Services & Govt']?.[1]?.daysLeft ?? '--'}d</code>\n`;
  caption += `• 🎖️ <b>NDA / CDS:</b> <code>${categories['🎖️ Defence, Law & Management']?.[0]?.daysLeft ?? '--'}d</code> | ⚖️ <b>CLAT:</b> <code>${categories['🎖️ Defence, Law & Management']?.[3]?.daysLeft ?? '--'}d</code>\n`;
  caption += `• 🏫 <b>CBSE Class 10/12:</b> <code>${categories['🏫 Board Examinations']?.[0]?.daysLeft ?? '--'}d</code>\n\n`;

  // Call to action & link
  caption += `🎯 <i>Aaj ka daily study target complete karein!</i>\n`;
  caption += `⏱️ <b>Live Timer &amp; CBT Clock:</b> <a href="https://indiantimers.com">IndianTimers.com</a>`;

  console.log(`Caption length: ${caption.length} / 1024 characters`);

  // Send photo with caption to Telegram
  try {
    const result = await sendPhoto(posterUrl, caption);
    console.log('✅ Morning broadcast sent successfully! Message ID:', result.result?.message_id);
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
