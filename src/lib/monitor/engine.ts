import type { DetectedNotice, NoticeSource } from '../../types/admin.ts';
import { EXAM_REGISTRY } from '../../data/exams.ts';
import type { ExamRecord, DateStatus } from '../../types/exam.ts';

// Month mapping for Indian date strings
const MONTHS: Record<string, string> = {
  jan: '01', january: '01',
  feb: '02', february: '02',
  mar: '03', march: '03',
  apr: '04', april: '04',
  may: '05',
  jun: '06', june: '06',
  jul: '07', july: '07',
  aug: '08', august: '08',
  sep: '09', september: '09',
  oct: '10', october: '10',
  nov: '11', november: '11',
  dec: '12', december: '12',
};

/**
 * Normalizes page content by stripping volatile scripts, query params, and nonces.
 */
export function normalizeContent(html: string): string {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/csrf[_-]?token=[^&"'\s]+/gi, '')
    .replace(/session[_-]?id=[^&"'\s]+/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates a simple 64-char hex content fingerprint.
 */
export function generateFingerprint(normalizedText: string): string {
  let hash1 = 0x811c9dc5;
  let hash2 = 0x55555555;
  for (let i = 0; i < normalizedText.length; i++) {
    const ch = normalizedText.charCodeAt(i);
    hash1 ^= ch;
    hash1 = Math.imul(hash1, 0x01000193);
    hash2 ^= (ch << 5) + ch;
  }
  const part1 = (hash1 >>> 0).toString(16).padStart(8, '0');
  const part2 = (hash2 >>> 0).toString(16).padStart(8, '0');
  const part3 = (normalizedText.length % 0xffffffff).toString(16).padStart(8, '0');
  return `${part1}${part2}${part3}${part1}`.padEnd(64, 'a');
}

function testKeyword(text: string, kw: string): boolean {
  if (!kw) return false;
  const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|[^a-zA-Z0-9])${escaped}(?:[^a-zA-Z0-9]|$)`, 'i');
  return regex.test(text);
}

/**
 * Match a raw circular text against registered examination records.
 */
export function matchExamFromText(text: string, associatedExamIds?: string[]): ExamRecord | null {
  const lower = text.toLowerCase();

  // If source already has specific associated exams, prioritize them
  if (associatedExamIds && associatedExamIds.length > 0) {
    for (const examId of associatedExamIds) {
      const candidate = EXAM_REGISTRY.find((e) => e.id === examId);
      if (candidate) {
        if (
          lower.includes(candidate.name.toLowerCase()) ||
          testKeyword(text, candidate.shortName) ||
          candidate.aliases?.some((a) => testKeyword(text, a))
        ) {
          return candidate;
        }
      }
    }
  }

  // Scan all exams in registry
  for (const exam of EXAM_REGISTRY) {
    if (
      lower.includes(exam.name.toLowerCase()) ||
      testKeyword(text, exam.shortName) ||
      exam.aliases?.some((a) => testKeyword(text, a))
    ) {
      return exam;
    }
  }

  return null;
}

/**
 * Extract exam date patterns from circular text.
 * Handles formats: "2 May 2027", "02.05.2027", "2027-05-02", "22 January to 31 January 2027", "22 to 31 January 2027"
 */
export function extractDateFromNotice(text: string): {
  examDate?: string;
  examEndDate?: string;
  isDateRange: boolean;
  rawDateSnippet: string;
} {
  // Pattern 1: ISO date "2027-05-02"
  const isoMatch = text.match(/\b(202[6-9])-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    return {
      examDate: isoMatch[0],
      isDateRange: false,
      rawDateSnippet: isoMatch[0],
    };
  }

  // Pattern 2: Textual date range "22 January to 31 January 2027" or "22nd to 31st Jan 2027"
  const rangeMatch = text.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?(?:\s+([A-Za-z]+))?\s*(?:to|-|and)\s*(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(202[6-9])\b/i
  );
  if (rangeMatch) {
    const [, startDay, startMonthStr, endDay, endMonthStr, year] = rangeMatch;
    const endMonth = MONTHS[endMonthStr.toLowerCase()];
    const startMonth = startMonthStr ? (MONTHS[startMonthStr.toLowerCase()] || endMonth) : endMonth;
    if (startMonth && endMonth) {
      const startIso = `${year}-${startMonth}-${startDay.padStart(2, '0')}`;
      const endIso = `${year}-${endMonth}-${endDay.padStart(2, '0')}`;
      return {
        examDate: startIso,
        examEndDate: endIso,
        isDateRange: true,
        rawDateSnippet: rangeMatch[0],
      };
    }
  }

  // Pattern 3: Single textual date "2 May 2027" or "2nd May 2027"
  const textMatch = text.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(202[6-9])\b/i
  );
  if (textMatch) {
    const [, day, monthStr, year] = textMatch;
    const m = MONTHS[monthStr.toLowerCase()];
    if (m) {
      const iso = `${year}-${m}-${day.padStart(2, '0')}`;
      return {
        examDate: iso,
        isDateRange: false,
        rawDateSnippet: textMatch[0],
      };
    }
  }

  // Pattern 4: Indian slash or dot format "02/05/2027" or "02.05.2027"
  const dotSlashMatch = text.match(
    /\b(0[1-9]|[12]\d|3[01])[./-](0[1-9]|1[0-2])[./-](202[6-9])\b/
  );
  if (dotSlashMatch) {
    const [, day, month, year] = dotSlashMatch;
    const iso = `${year}-${month}-${day}`;
    return {
      examDate: iso,
      isDateRange: false,
      rawDateSnippet: dotSlashMatch[0],
    };
  }

  return { isDateRange: false, rawDateSnippet: '' };
}

/**
 * Detect status keywords (postponement, official confirmation, or tentative).
 */
export function detectStatusFromNotice(text: string): DateStatus {
  const lower = text.toLowerCase();
  if (
    lower.includes('postpon') ||
    lower.includes('reschedul') ||
    lower.includes('deferred') ||
    lower.includes('put off')
  ) {
    return 'postponed';
  }
  if (
    lower.includes('official circular') ||
    lower.includes('public notice') ||
    lower.includes('examination schedule') ||
    lower.includes('gazette') ||
    lower.includes('admit card released')
  ) {
    return 'official';
  }
  if (lower.includes('tentative') || lower.includes('likely') || lower.includes('provisional')) {
    return 'tentative';
  }
  return 'tentative';
}

/**
 * Primary Parser: Extracts structured DetectedNotice from a raw circular item.
 */
export function parseNoticeItem(
  rawItem: {
    title: string;
    snippet: string;
    link: string;
    pdfUrl?: string;
  },
  source: NoticeSource
): DetectedNotice | null {
  const combinedText = `${rawItem.title} ${rawItem.snippet}`;
  const matchedExam = matchExamFromText(combinedText, source.associatedExamIds);

  if (!matchedExam) {
    return null; // Ignore circulars that do not match our database
  }

  const { examDate, examEndDate, isDateRange, rawDateSnippet } = extractDateFromNotice(combinedText);
  const detectedStatus = detectStatusFromNotice(combinedText);

  // Confidence Calculation
  let confidence = 0.5;
  const notes: string[] = [];

  if (rawItem.title.toLowerCase().includes(matchedExam.shortName.toLowerCase())) {
    confidence += 0.2;
    notes.push('Exact exam title match in notice headline.');
  }

  if (examDate) {
    confidence += 0.2;
    notes.push(`Extracted valid date format: ${rawDateSnippet} -> ${examDate}`);
  } else {
    notes.push('Notice mentions examination but contains no explicit date timestamp.');
  }

  if (rawItem.pdfUrl) {
    confidence += 0.1;
    notes.push('Official PDF circular document detected.');
  }

  const requiresManualReview = !examDate || confidence < 0.75 || isDateRange;

  return {
    id: `notice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    sourceId: source.id,
    authority: source.authority,
    title: rawItem.title.trim().slice(0, 200),
    sourceUrl: rawItem.link || source.sourceUrl,
    documentUrl: rawItem.pdfUrl,
    matchedExamId: matchedExam.id,
    matchedExamName: matchedExam.name,
    currentExamDate: matchedExam.dates.examDate,
    proposedExamDate: examDate,
    proposedExamEndDate: examEndDate,
    proposedDateStatus: detectedStatus,
    detectedSnippet: rawItem.snippet.trim().slice(0, 300),
    confidenceScore: Math.min(1.0, Math.round(confidence * 100) / 100),
    status: 'pending_review',
    detectedAt: new Date().toISOString(),
    parserNotes: notes,
    requiresManualReview,
  };
}
