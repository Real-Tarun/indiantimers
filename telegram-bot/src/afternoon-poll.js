import { getRandomQuiz } from './quizzes.js';
import { sendQuizPoll, sendMessage } from './telegram.js';
import { isBotEnabled } from './bot-control.js';
import { generateAIQuiz } from './gemini.js';

export async function runAfternoonPoll() {
  console.log('🚀 Running Afternoon Quiz Poll...');

  // Check remote kill-switch / admin toggle
  const enabled = await isBotEnabled('quiz');
  if (!enabled) {
    console.log('⏸️ Telegram Bot (Afternoon Quiz) is PAUSED via Admin Dashboard. Skipping.');
    return { skipped: true, reason: 'bot_paused_by_admin' };
  }

  // Try generating a fresh, high-yield Quiz question with Google Gemini AI
  let quiz = null;
  try {
    const aiQuiz = await generateAIQuiz();
    if (aiQuiz && aiQuiz.question && Array.isArray(aiQuiz.options) && aiQuiz.options.length >= 2) {
      quiz = {
        exam: aiQuiz.exam || 'Competitive Exam',
        category: aiQuiz.subject || 'PYQ Challenge',
        question: aiQuiz.question,
        options: aiQuiz.options,
        correctOptionId: typeof aiQuiz.correctOptionId === 'number' ? aiQuiz.correctOptionId : 0,
        explanation: aiQuiz.explanation || 'Verified conceptual answer for aspirants.'
      };
      console.log('✨ Fresh PYQ Quiz generated with Google Gemini 3.5 Flash!');
    }
  } catch (err) {
    console.warn('⚠️ Gemini fallback to curated quiz bank:', err.message);
  }

  if (!quiz) {
    quiz = getRandomQuiz();
  }

  const questionTitle = `📝 [${quiz.exam} - ${quiz.category}]\n${quiz.question}`;

  try {
    const rawChatId = process.env.TELEGRAM_CHAT_ID || '';
    const [channelChatId] = rawChatId.split(',').map((s) => s.trim());

    // 1. Send the native interactive quiz poll to public channel
    const pollResult = await sendQuizPoll(
      questionTitle,
      quiz.options,
      quiz.correctOptionId,
      quiz.explanation,
      { chatId: channelChatId || undefined }
    );

    console.log('✅ Quiz poll sent successfully to Public Channel! Poll ID:', pollResult.result?.poll?.id);

    // 2. Send quick follow-up with study tool link
    const followUp = `💡 <b>Daily Practice Tip:</b>\n` +
      `Speed aur accuracy mock tests se banti hai. Apne answers attempt karne ke baad CBT Timer se time management simulate karein!\n\n` +
      `⏳ <b>Free 3-Hour CBT Mock Test Timer:</b>\n` +
      `👉 <a href="https://indiantimers.com/tools/mock-test-timer/">indiantimers.com/tools/mock-test-timer/</a>`;

    await sendMessage(followUp, { disableWebPreview: true, chatId: channelChatId || undefined });
    console.log('✅ Follow-up tool link sent!');

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
