import { getRandomQuiz } from './quizzes.js';
import { sendQuizPoll, sendMessage } from './telegram.js';

export async function runAfternoonPoll() {
  console.log('🚀 Running Afternoon Quiz Poll...');

  const quiz = getRandomQuiz();

  const questionTitle = `📝 [${quiz.exam} - ${quiz.category}]\n${quiz.question}`;

  try {
    // 1. Send the native interactive quiz poll
    const pollResult = await sendQuizPoll(
      questionTitle,
      quiz.options,
      quiz.correctOptionId,
      quiz.explanation
    );

    console.log('✅ Quiz poll sent successfully! Poll ID:', pollResult.result?.poll?.id);

    // 2. Send quick follow-up with study tool link
    const followUp = `💡 <b>Daily Practice Tip:</b>\n` +
      `Speed aur accuracy mock tests se banti hai. Apne answers attempt karne ke baad CBT Timer se time management simulate karein!\n\n` +
      `⏳ <b>Free 3-Hour CBT Mock Test Timer:</b>\n` +
      `👉 <a href="https://indiantimers.com/tools/mock-test-timer/">indiantimers.com/tools/mock-test-timer/</a>`;

    await sendMessage(followUp, { disableWebPreview: true });
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
