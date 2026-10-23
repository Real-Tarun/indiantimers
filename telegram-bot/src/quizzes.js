// Comprehensive high-yield question bank for daily interactive Telegram quiz polls
export const QUIZ_BANK = [
  // 1. Physics (JEE / NEET)
  {
    category: 'Physics',
    exam: 'JEE / NEET',
    question: 'A body is projected vertically upwards with velocity u. The maximum height attained is H. What is the velocity at height H/2?',
    options: ['u / 2', 'u / √2', 'u / 4', '√2 u'],
    correctOptionId: 1,
    explanation: 'From v² = u² - 2gh, at max height H, u² = 2gH => H = u²/(2g). At h = H/2, v² = u² - 2g(H/2) = u² - gH = u² - u²/2 = u²/2. So v = u/√2.'
  },
  // 2. Chemistry (NEET / JEE)
  {
    category: 'Chemistry',
    exam: 'NEET / JEE',
    question: 'Which of the following compounds has the highest boiling point due to extensive intermolecular hydrogen bonding?',
    options: ['Ethanol (C2H5OH)', 'Water (H2O)', 'Hydrogen Fluoride (HF)', 'Ammonia (NH3)'],
    correctOptionId: 1,
    explanation: 'Water (H2O) forms an extensive 3D tetrahedral network of 4 hydrogen bonds per molecule, giving it a higher boiling point (100°C) than HF (19.5°C) or Ethanol (78°C).'
  },
  // 3. Biology (NEET)
  {
    category: 'Biology',
    exam: 'NEET UG',
    question: 'During cell division, crossing over (genetic recombination) takes place during which specific sub-stage of Prophase I?',
    options: ['Leptotene', 'Zygotene', 'Pachytene', 'Diplotene'],
    correctOptionId: 2,
    explanation: 'Crossing over between non-sister chromatids of homologous chromosomes occurs during Pachytene stage, mediated by enzyme recombinase.'
  },
  // 4. General Studies (UPSC / SSC / Govt)
  {
    category: 'Polity & Constitution',
    exam: 'UPSC / SSC',
    question: 'Which Article of the Indian Constitution is known as the "Heart and Soul of the Constitution" according to Dr. B.R. Ambedkar?',
    options: ['Article 14 (Right to Equality)', 'Article 19 (Right to Freedom)', 'Article 21 (Right to Life)', 'Article 32 (Constitutional Remedies)'],
    correctOptionId: 3,
    explanation: 'Dr. B.R. Ambedkar called Article 32 the "Heart and Soul" because without the right to approach the Supreme Court for enforcement of Fundamental Rights, other rights would be meaningless.'
  },
  // 5. General Studies / History
  {
    category: 'Modern History',
    exam: 'UPSC / Govt Jobs',
    question: 'In which year did the historic Champaran Satyagraha, Mahatma Gandhi\'s first Satyagraha movement in India, take place?',
    options: ['1915', '1917', '1919', '1920'],
    correctOptionId: 1,
    explanation: 'The Champaran Satyagraha occurred in 1917 in Bihar to protest against the oppressive Tinkathia system imposed on indigo farmers.'
  },
  // 6. Aptitude / Math (Banking / CSAT / CAT)
  {
    category: 'Quantitative Aptitude',
    exam: 'CSAT / Banking / CAT',
    question: 'If the price of sugar increases by 25%, by what percentage must a household reduce its consumption so that total expenditure remains unchanged?',
    options: ['20%', '25%', '16.66%', '15%'],
    correctOptionId: 0,
    explanation: 'Formula: [R / (100 + R)] * 100%. Here R = 25%, so [25 / 125] * 100% = (1/5) * 100% = 20% reduction.'
  },
  // 7. Biology: Genetics (NEET)
  {
    category: 'Genetics',
    exam: 'NEET UG',
    question: 'In a Mendelian dihybrid cross (RrYy x RrYy), what is the phenotypic ratio obtained in the F2 generation?',
    options: ['9 : 3 : 3 : 1', '1 : 2 : 1', '3 : 1', '9 : 7'],
    correctOptionId: 0,
    explanation: 'Mendel\'s law of independent assortment in a dihybrid cross yields 9 Round Yellow, 3 Round Green, 3 Wrinkled Yellow, and 1 Wrinkled Green (9:3:3:1).'
  },
  // 8. Physics: Optics (JEE / NEET)
  {
    category: 'Ray Optics',
    exam: 'JEE / NEET',
    question: 'An optical fibre communication cable works on which fundamental principle of physics?',
    options: ['Refraction of light', 'Total Internal Reflection (TIR)', 'Diffraction of light', 'Dispersion of light'],
    correctOptionId: 1,
    explanation: 'Optical fibres transmit light signals over thousands of kilometres with minimal loss through continuous Total Internal Reflection (TIR) inside the core.'
  },
  // 9. Economy (UPSC / SSC / Banking)
  {
    category: 'Indian Economy',
    exam: 'UPSC / Banking',
    question: 'When the Reserve Bank of India (RBI) increases the Repo Rate, what is the typical expected effect on the economy?',
    options: ['Inflation increases', 'Commercial bank borrowing cost rises & money supply tightens', 'Rupee sharply depreciates', 'Loans become cheaper'],
    correctOptionId: 1,
    explanation: 'Repo rate is the interest rate at which RBI lends money to commercial banks. Increasing it makes loans costlier, cooling down excess money supply and inflation.'
  },
  // 10. Geography (UPSC / State PSC)
  {
    category: 'Physical Geography',
    exam: 'UPSC / State PSC',
    question: 'Which of the following peninsular rivers flows westwards into the Arabian Sea through a rift valley?',
    options: ['Godavari', 'Krishna', 'Narmada', 'Mahanadi'],
    correctOptionId: 2,
    explanation: 'Narmada and Tapi flow westwards through rift valleys between the Vindhya and Satpura ranges and drain into the Arabian Sea, forming estuaries instead of deltas.'
  },
  // 11. Chemistry: Electrochemistry (JEE / NEET)
  {
    category: 'Physical Chemistry',
    exam: 'JEE / NEET',
    question: 'What is the standard reduction potential (E°) of the Standard Hydrogen Electrode (SHE) at 298 K?',
    options: ['1.00 V', '0.00 V', '-1.00 V', '+0.76 V'],
    correctOptionId: 1,
    explanation: 'By international convention, the standard electrode potential of the Standard Hydrogen Electrode (SHE) is assigned a value of 0.00 V at all temperatures.'
  },
  // 12. Logical Reasoning (SSC / NDA / Banking)
  {
    category: 'Logical Reasoning',
    exam: 'SSC CGL / Banking',
    question: 'Find the next term in the series: 2, 6, 12, 20, 30, ?',
    options: ['40', '42', '44', '48'],
    correctOptionId: 1,
    explanation: 'Differences: +4, +6, +8, +10, +12. Therefore, next term = 30 + 12 = 42 (Alternatively, n² + n: 1²+1=2, 2²+2=6, 3²+3=12, ..., 6²+6=42).'
  },
  // 13. Environmental Science (UPSC / State PSC)
  {
    category: 'Environment & Ecology',
    exam: 'UPSC / SSC',
    question: 'In which year was "Project Tiger" launched in India to promote tiger conservation?',
    options: ['1971', '1973', '1982', '1986'],
    correctOptionId: 1,
    explanation: 'Project Tiger was launched on April 1, 1973 from Jim Corbett National Park in Uttarakhand to ensure a viable population of Bengal tigers.'
  },
  // 14. Mathematics: Calculus (JEE)
  {
    category: 'Mathematics',
    exam: 'JEE Main / Advanced',
    question: 'What is the value of limit as x approaches 0 for [sin(x) / x]?',
    options: ['0', '1', 'Infinity', 'Does not exist'],
    correctOptionId: 1,
    explanation: 'By standard limits (and L\'Hôpital\'s Rule: cos(0)/1 = 1), lim(x->0) [sin(x)/x] = 1.'
  },
  // 15. Legal Aptitude / Constitutional Law (CLAT / UPSC)
  {
    category: 'Legal Knowledge',
    exam: 'CLAT / UPSC',
    question: 'Which writ issued by the High Court or Supreme Court translates to "We Command"?',
    options: ['Habeas Corpus', 'Mandamus', 'Quo-Warranto', 'Certiorari'],
    correctOptionId: 1,
    explanation: 'Mandamus is a Latin word meaning "We Command". It is issued to a public official or government body commanding them to perform their statutory duty.'
  }
];

export function getRandomQuiz() {
  const index = Math.floor(Math.random() * QUIZ_BANK.length);
  return QUIZ_BANK[index];
}
