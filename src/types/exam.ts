export type ExamCategory =
  | 'medical'
  | 'engineering'
  | 'board-exams'
  | 'government'
  | 'law'
  | 'management'
  | 'other-entrance-exams';

export type DateStatus =
  | 'official'
  | 'tentative'
  | 'expected'
  | 'not_announced'
  | 'postponed'
  | 'rescheduled'
  | 'completed'
  | 'cancelled';

export interface ExamImportantDates {
  registrationStart?: string;
  registrationEnd?: string;
  admitCardRelease?: string;
  examDate: string; // ISO string YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss+05:30
  examEndDate?: string; // Optional if exam spans a date range (e.g. Session 1 window)
  resultDate?: string;
}

export interface ExamFAQ {
  question: string;
  answer: string;
}

export interface ExamRecord {
  id: string; // Stable unique ID e.g. "neet-ug-2027"
  slug: string; // Canonical URL slug
  name: string; // Full official name
  shortName: string; // Common acronym e.g. "NEET UG 2027"
  aliases: string[]; // Search aliases e.g. ["NEET 2027", "AIPMT", "NTA NEET"]
  category: ExamCategory;
  year: number;
  conductingAuthority: string; // e.g. "National Testing Agency (NTA)"
  dates: ExamImportantDates;
  startTime?: string; // e.g. "14:00" (IST)
  endTime?: string; // e.g. "17:20" (IST)
  durationMinutes?: number; // e.g. 200 for NEET (3h 20m)
  timezone: string; // Default "Asia/Kolkata"
  dateStatus: DateStatus;
  officialSourceUrl: string;
  sourceNotificationTitle: string;
  officialWebsite: string;
  lastVerified: string; // ISO date YYYY-MM-DD
  isIndexable: boolean;
  isFeatured?: boolean; // Highlighted on home page
  shortDescription?: string;
  detailedOverview?: string;
  instructions?: string[];
  preparationTips?: string[];
  relatedExamIds?: string[];
  faqs?: ExamFAQ[];
  verificationNotes?: string;
}

export interface PersonalCountdownItem {
  id: string;
  title: string;
  targetDate: string;
  targetTime?: string;
  timezone: string;
  category: string;
  notes?: string;
  createdAt: string;
}

export interface StudySessionLog {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  sessionType: 'pomodoro' | 'stopwatch' | 'mock-test' | 'study-timer';
  examId?: string;
  subject?: string;
  timestamp: number;
}
