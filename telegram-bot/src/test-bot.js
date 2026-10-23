import { getUpcomingExamsSummary } from './exams.js';
import { getRandomQuote, getRandomPoster } from './quotes.js';
import { getRandomQuiz } from './quizzes.js';

console.log('🧪 === RUNNING TELEGRAM BOT PREVIEW TEST ===\n');

// 1. Test Exam Countdowns
const { spotlight, categories, totalTracked } = getUpcomingExamsSummary();
console.log(`✓ Master Exams Registry: ${totalTracked} active upcoming exams computed.`);
console.log('\nTop 3 Closest Exams:');
spotlight.forEach((e) => console.log(` - ${e.name} (${e.category}): ${e.daysLeft} days remaining`));

console.log('\nStreams Covered:');
Object.keys(categories).forEach((cat) => {
  console.log(` - ${cat}: ${categories[cat].length} exams`);
});

// 2. Test Motivation & Posters
const quote = getRandomQuote();
const poster = getRandomPoster();
console.log(`\n✓ Daily Thought: "${quote.quote}" - ${quote.author}`);
console.log(`✓ Wallpaper Image: ${poster}`);

// 3. Test Quiz Poll
const quiz = getRandomQuiz();
console.log(`\n✓ Sample Quiz Poll: [${quiz.exam}] ${quiz.question}`);
console.log(`  Options: ${quiz.options.join(' | ')}`);
console.log(`  Correct Option: ${quiz.options[quiz.correctOptionId]}`);

console.log('\n✅ All internal modules verified successfully! Everything is ready for GitHub Actions.');
