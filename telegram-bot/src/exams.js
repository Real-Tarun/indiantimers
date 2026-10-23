// Master Registry of Major Indian Examinations for Multi-Stream Daily Broadcast
export const EXAMS_LIST = [
  // 🩺 Medical Entrances
  { name: 'NEET UG 2027', category: 'Medical', date: '2027-05-02', emoji: '🩺', link: 'https://indiantimers.com/exams/neet-ug-2027/' },
  { name: 'NEET PG 2027', category: 'Medical', date: '2027-06-23', emoji: '💉', link: 'https://indiantimers.com/exams/neet-pg-2027/' },

  // ⚙️ Engineering Entrances
  { name: 'JEE Main 2027 (Session 1)', category: 'Engineering', date: '2027-01-22', emoji: '⚙️', link: 'https://indiantimers.com/exams/jee-main-2027-session-1/' },
  { name: 'GATE 2027', category: 'Engineering', date: '2027-02-06', emoji: '💻', link: 'https://indiantimers.com/exams/engineering/' },
  { name: 'JEE Main 2027 (Session 2)', category: 'Engineering', date: '2027-04-03', emoji: '⚙️', link: 'https://indiantimers.com/exams/jee-main-2027-session-2/' },
  { name: 'JEE Advanced 2027', category: 'Engineering', date: '2027-05-23', emoji: '🏛️', link: 'https://indiantimers.com/exams/jee-advanced-2027/' },

  // 🏛️ Civil Services & Govt Jobs
  { name: 'UPSC CSE Prelims 2027', category: 'Civil Services', date: '2027-05-23', emoji: '🏛️', link: 'https://indiantimers.com/exams/government/' },
  { name: 'SSC CGL 2027 (Tier 1)', category: 'Govt Jobs', date: '2027-07-15', emoji: '📋', link: 'https://indiantimers.com/exams/government/' },
  { name: 'IBPS PO / Clerk Prelims', category: 'Banking', date: '2027-08-22', emoji: '🏦', link: 'https://indiantimers.com/exams/government/' },

  // 🎖️ Defence
  { name: 'NDA & NA (I) 2027', category: 'Defence', date: '2027-04-18', emoji: '🎖️', link: 'https://indiantimers.com/exams/other-entrance-exams/' },
  { name: 'CDS (I) 2027', category: 'Defence', date: '2027-04-18', emoji: '🇮🇳', link: 'https://indiantimers.com/exams/other-entrance-exams/' },

  // 💼 Management & Law
  { name: 'CAT 2026 / 2027', category: 'Management', date: '2026-11-29', emoji: '💼', link: 'https://indiantimers.com/exams/management/' },
  { name: 'CLAT 2027', category: 'Law', date: '2026-12-06', emoji: '⚖️', link: 'https://indiantimers.com/exams/law/' },

  // 🏫 Board Examinations
  { name: 'CBSE Class 10 & 12 Boards', category: 'Board Exams', date: '2027-02-15', emoji: '🏫', link: 'https://indiantimers.com/exams/board-exams/' },
];

/**
 * Calculates remaining days from now to a target YYYY-MM-DD date.
 */
export function getDaysRemaining(targetDateStr) {
  const now = new Date();
  const target = new Date(targetDateStr + 'T00:00:00+05:30'); // Indian Standard Time
  const diffTime = target.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Returns formatted countdown blocks grouped and sorted by nearest upcoming exams.
 */
export function getUpcomingExamsSummary() {
  const activeExams = EXAMS_LIST.map((exam) => ({
    ...exam,
    daysLeft: getDaysRemaining(exam.date),
  })).filter((exam) => exam.daysLeft > 0);

  // Sort by closest exam first
  activeExams.sort((a, b) => a.daysLeft - b.daysLeft);

  // Top 3 immediate upcoming spotlight
  const spotlight = activeExams.slice(0, 3);

  // Key milestones across major streams
  const categories = {
    '🩺 Medical & Healthcare': activeExams.filter((e) => e.category === 'Medical'),
    '⚙️ Engineering & Tech': activeExams.filter((e) => e.category === 'Engineering'),
    '🏛️ Civil Services & Govt': activeExams.filter((e) => e.category === 'Civil Services' || e.category === 'Govt Jobs' || e.category === 'Banking'),
    '🎖️ Defence, Law & Management': activeExams.filter((e) => e.category === 'Defence' || e.category === 'Law' || e.category === 'Management'),
    '🏫 Board Examinations': activeExams.filter((e) => e.category === 'Board Exams'),
  };

  return {
    spotlight,
    categories,
    totalTracked: activeExams.length,
  };
}
