import { getRandomQuiz } from './quizzes.js';
import { sendQuizPoll, sendMessage } from './telegram.js';

export async function runAfternoonPoll() {
  console.log('🚀 Running Afternoon Quiz Poll...');

  const quiz = getRandomQuiz();

  const questionTitle = `📝 [${quiz.exam} - ${quiz.category}]\n${quiz.question}`;

  try {
    const rawChatId = process.env.TELEGRAM_CHAT_ID || '';
    const [channelChatId, secondaryChatId] = rawChatId.split(',').map((s) => s.trim());
    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID || secondaryChatId;

    // 1. Send the native interactive quiz poll to public channel
    const pollResult = await sendQuizPoll(
      questionTitle,
      quiz.options,
      quiz.correctOptionId,
      quiz.explanation,
      { chatId: channelChatId || undefined }
    );

    console.log('✅ Quiz poll sent successfully! Poll ID:', pollResult.result?.poll?.id);

    // 2. Send quick follow-up with study tool link
    const followUp = `💡 <b>Daily Practice Tip:</b>\n` +
      `Speed aur accuracy mock tests se banti hai. Apne answers attempt karne ke baad CBT Timer se time management simulate karein!\n\n` +
      `⏳ <b>Free 3-Hour CBT Mock Test Timer:</b>\n` +
      `👉 <a href="https://indiantimers.com/tools/mock-test-timer/">indiantimers.com/tools/mock-test-timer/</a>`;

    await sendMessage(followUp, { disableWebPreview: true, chatId: channelChatId || undefined });
    console.log('✅ Follow-up tool link sent!');

    // 3. If Admin Personal Chat ID is configured, send private DM with 1-Click WhatsApp Button
    if (adminChatId) {
      try {
        const letters = ['A', 'B', 'C', 'D'];
        let waQuiz = `📝 *DAILY PRACTICE QUIZ* • [${quiz.exam} - ${quiz.category}]\n\n` +
          `*Q:* ${quiz.question}\n\n`;
        quiz.options.forEach((opt, idx) => {
          waQuiz += `${letters[idx]}) ${opt}\n`;
        });
        waQuiz += `\n💡 *Answer & Explanation:*\n👉 ${quiz.explanation}\n\n` +
          `⏱️ *Practice on Free CBT Simulator:*\n👉 https://indiantimers.com/tools/mock-test-timer/`;

        const waShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(waQuiz)}`;

        await sendMessage(
          `📝 <b>Afternoon Quiz is LIVE on Telegram!</b>\n\nTap below to copy & post to WhatsApp Channel:`,
          {
            chatId: adminChatId,
            reply_markup: {
              inline_keyboard: [
                [
                  {
                    text: '🟢 Post Quiz to WhatsApp Channel',
                    url: waShareUrl,
                  },
                ],
              ],
            },
          }
        );
        console.log('✅ Admin private notification sent with 1-Click WhatsApp Quiz button!');
      } catch (adminErr) {
        console.warn('⚠️ Could not send admin personal DM:', adminErr.message);
      }
    }

    return pollResult;
  } catch (error) {
    console.error('❌ Failed to send afternoon poll:', error.message);
    throw error;
  }
}

// Allow direct CLI execution: node src/afternoon-poll.js
if (process.argv[1]?.endsWith('afternoon-poll.js')) {
  runAfternoonPoll().catch(() => process.exit(1));
}
