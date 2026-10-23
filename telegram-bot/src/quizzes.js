// Question bank for daily interactive Telegram quiz polls
export const QUIZ_BANK = [
  // Physics (JEE / NEET)
  {
    category: 'Physics',
    exam: 'JEE / NEET',
    question: 'A body is projected vertically upwards with velocity u. The maximum height attained is H. What is the velocity at height H/2?',
    options: ['u / 2', 'u / √2', 'u / 4', '√2 u'],
    correctOptionId: 1,
    explanation: 'From v² = u² - 2gh, at max height H, u² = 2gH => H = u²/(2g). At h = H/2, v² = u² - 2g(H/2) = u² - gH = u² - u²/2 = u²/2. So v = u/√2.'
  },
  // Chemistry (NEET / JEE)
  {
    category: 'Chemistry',
    exam: 'NEET / JEE',
    question: 'Which of the following compounds has the highest boiling point due to extensive intermolecular hydrogen bonding?',
    options: ['Ethanol (C2H5OH)', 'Water (H2O)', 'Hydrogen Fluoride (HF)', 'Ammonia (NH3)'],
    correctOptionId: 1,
    explanation: 'Water (H2O) forms an extensive 3D tetrahedral network of 4 hydrogen bonds per molecule, giving it a higher boiling point (100°C) than HF (19.5°C) or Ethanol (78°C).'
  },
  // Biology (NEET)
  {
    category: 'Biology',
    exam: 'NEET UG',
    question: 'During cell division, crossing over (genetic recombination) takes place during which specific sub-stage of Prophase I?',
    options: ['Leptotene', 'Zygotene', 'Pachytene', 'Diplotene'],
    correctOptionId: 2,
    explanation: 'Crossing over between non-sister chromatids of homologous chromosomes occurs during Pachytene stage, mediated by enzyme recombinase.'
  },
  // General Studies (UPSC / SSC / Govt)
  {
    category: 'Polity & Constitution',
    exam: 'UPSC / SSC',
    question: 'Which Article of the Indian Constitution is known as the "Heart and Soul of the Constitution" according to Dr. B.R. Ambedkar?',
    options: ['Article 14 (Right to Equality)', 'Article 19 (Right to Freedom)', 'Article 21 (Right to Life)', 'Article 32 (Constitutional Remedies)'],
    correctOptionId: 3,
    explanation: 'Dr. B.R. Ambedkar called Article 32 the "Heart and Soul" because without the right to approach the Supreme Court for enforcement of Fundamental Rights, other rights would be meaningless.'
  },
  // General Studies / History
  {
    category: 'Modern History',
    exam: 'UPSC / Govt Jobs',
    question: 'In which year did the historic Champaran Satyagraha, Mahatma Gandhi\'s first Satyagraha movement in India, take place?',
    options: ['1915', '1917', '1919', '1920'],
    correctOptionId: 1,
    explanation: 'The Champaran Satyagraha occurred in 1917 in Bihar to protest against the oppressive Tinkathia system imposed on indigo farmers.'
  },
  // Aptitude / Math (Banking / CSAT / CAT)
  {
    category: 'Quantitative Aptitude',
    exam: 'CSAT / Banking / CAT',
    question: 'If the price of sugar increases by 25%, by what percentage must a household reduce its consumption so that total expenditure remains unchanged?',
    options: ['20%', '25%', '16.66%', '15%'],
    correctOptionId: 0,
    explanation: 'Formula: [R / (100 + R)] * 100%. Here R = 25%, so [25 / 125] * 100% = (1/5) * 100% = 20% reduction.'
  }
];

export function getRandomQuiz() {
  const index = Math.floor(Math.random() * QUIZ_BANK.length);
  return QUIZ_BANK[index];
}
