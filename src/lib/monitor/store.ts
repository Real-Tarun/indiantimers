import type { DetectedNotice, NoticeSource, AdminAuditEntry } from '../../types/admin.ts';
import { OFFICIAL_NOTICE_SOURCES } from './sources.ts';
import { EXAM_REGISTRY } from '../../data/exams.ts';
import type { ExamRecord, DateStatus } from '../../types/exam.ts';

// Initial Demo Seed Notices representing realistic circular detections
const INITIAL_SEED_NOTICES: DetectedNotice[] = [
  {
    id: 'notice_nta_neet_2027_seed',
    sourceId: 'nta-neet',
    authority: 'National Testing Agency (NTA)',
    title: 'Public Notice: Conduct of National Eligibility cum Entrance Test (UG) 2027 Schedule',
    sourceUrl: 'https://exams.nta.ac.in/NEET/',
    documentUrl: 'https://exams.nta.ac.in/NEET/circulars/NEET_UG_2027_Notice.pdf',
    matchedExamId: 'neet-ug-2027',
    matchedExamName: 'National Eligibility cum Entrance Test (UG) 2027',
    currentExamDate: '2027-05-02',
    proposedExamDate: '2027-05-02',
    proposedDateStatus: 'official',
    detectedSnippet: 'The National Testing Agency (NTA) will conduct NEET (UG) 2027 on Sunday, 02 May 2027 from 02:00 PM to 05:20 PM (IST) in Pen & Paper (offline) mode across India.',
    confidenceScore: 0.98,
    status: 'pending_review',
    detectedAt: '2026-10-21T06:15:00.000Z',
    parserNotes: [
      'Exact exam title match in notice headline.',
      'Extracted valid date format: 02 May 2027 -> 2027-05-02',
      'Official PDF circular document detected.',
    ],
    requiresManualReview: false,
  },
  {
    id: 'notice_jeemain_s1_seed',
    sourceId: 'nta-jeemain',
    authority: 'National Testing Agency (NTA)',
    title: 'Joint Entrance Examination (Main) 2027 Session 1 Examination Window Announcement',
    sourceUrl: 'https://jeemain.nta.nic.in/',
    documentUrl: 'https://jeemain.nta.nic.in/docs/JEE_Main_2027_Session_1_Dates.pdf',
    matchedExamId: 'jee-main-2027-session-1',
    matchedExamName: 'JEE Main 2027 Session 1',
    currentExamDate: '2027-01-22',
    proposedExamDate: '2027-01-22',
    proposedExamEndDate: '2027-01-31',
    proposedDateStatus: 'official',
    detectedSnippet: 'JEE (Main) - 2027 Session 1 will be held between 22 January to 31 January 2027 across multiple shifts in computer based test format.',
    confidenceScore: 0.95,
    status: 'pending_review',
    detectedAt: '2026-10-21T06:20:00.000Z',
    parserNotes: [
      'Exact exam title match.',
      'Detected examination window range: 2027-01-22 to 2027-01-31',
      'Official notification document verified.',
    ],
    requiresManualReview: false,
  },
  {
    id: 'notice_upsc_prelims_seed',
    sourceId: 'upsc-calendar',
    authority: 'Union Public Service Commission (UPSC)',
    title: 'UPSC Annual Programme of Examinations and Recruitment Tests 2027',
    sourceUrl: 'https://upsc.gov.in/examinations/examination-calendar',
    documentUrl: 'https://upsc.gov.in/sites/default/files/Exam_Calendar_2027.pdf',
    matchedExamId: 'upsc-cse-prelims-2027',
    matchedExamName: 'UPSC Civil Services Examination (Prelims) 2027',
    currentExamDate: '2027-05-23',
    proposedExamDate: '2027-05-23',
    proposedDateStatus: 'official',
    detectedSnippet: 'Civil Services (Preliminary) Examination, 2027 will be conducted on 23.05.2027 (Sunday) with last date for receipt of applications being 16.02.2027.',
    confidenceScore: 0.96,
    status: 'pending_review',
    detectedAt: '2026-10-21T06:25:00.000Z',
    parserNotes: [
      'Extracted valid date format: 23.05.2027 -> 2027-05-23',
      'UPSC official annual programme gazette verified.',
    ],
    requiresManualReview: false,
  },
];

const INITIAL_AUDIT_LOGS: AdminAuditEntry[] = [
  {
    id: 'audit_init_1',
    timestamp: '2026-10-18T10:00:00.000Z',
    adminEmail: 'editorial-admin@indiantimers.com',
    action: 'approve_official',
    examId: 'gate-2027',
    examName: 'GATE 2027',
    previousValues: {
      examDate: '2027-02-06',
      dateStatus: 'tentative',
    },
    newValues: {
      examDate: '2027-02-06',
      dateStatus: 'official',
      officialSourceUrl: 'https://gate2027.iitr.ac.in/',
      sourceNotificationTitle: 'IIT GATE Information Brochure 2027',
    },
    sourceNoticeTitle: 'Official GATE 2027 Schedule Released by IIT Roorkee',
    sourceNoticeUrl: 'https://gate2027.iitr.ac.in/',
    adminComment: 'Confirmed against official IIT Roorkee GATE organising committee notification.',
  },
];

// Persistent Memory State
class AdminMonitorStore {
  private sources: NoticeSource[] = [...OFFICIAL_NOTICE_SOURCES];
  private notices: DetectedNotice[] = [...INITIAL_SEED_NOTICES];
  private auditLogs: AdminAuditEntry[] = [...INITIAL_AUDIT_LOGS];

  getSources(): NoticeSource[] {
    return this.sources;
  }

  updateSourceCheck(sourceId: string, success: boolean, error?: string): void {
    const src = this.sources.find((s) => s.id === sourceId);
    if (!src) return;
    const now = new Date().toISOString();
    src.lastChecked = now;
    if (success) {
      src.lastSuccess = now;
      src.status = 'active';
      src.lastError = undefined;
    } else {
      src.status = 'failing';
      src.lastError = error;
    }
  }

  getAllNotices(): DetectedNotice[] {
    return this.notices;
  }

  getPendingNotices(): DetectedNotice[] {
    return this.notices.filter((n) => n.status === 'pending_review');
  }

  addDetectedNotice(notice: DetectedNotice): boolean {
    // Duplicate suppression check: match sourceId + matchedExamId + proposedExamDate
    const isDuplicate = this.notices.some(
      (n) =>
        n.sourceId === notice.sourceId &&
        n.matchedExamId === notice.matchedExamId &&
        n.proposedExamDate === notice.proposedExamDate
    );
    if (isDuplicate) return false;
    this.notices.unshift(notice);
    return true;
  }

  getAuditLogs(): AdminAuditEntry[] {
    return this.auditLogs;
  }

  applyApproval(
    noticeId: string,
    adminEmail: string,
    overrides?: {
      examDate?: string;
      dateStatus?: DateStatus;
      officialSourceUrl?: string;
      adminComment?: string;
    }
  ): { success: boolean; error?: string; auditEntry?: AdminAuditEntry } {
    const notice = this.notices.find((n) => n.id === noticeId);
    if (!notice) return { success: false, error: 'Notice not found in queue.' };

    const exam = EXAM_REGISTRY.find((e) => e.id === notice.matchedExamId);
    if (!exam) return { success: false, error: 'Matched exam not found in registry.' };

    const previousValues = {
      examDate: exam.dates.examDate,
      dateStatus: exam.dateStatus,
      officialSourceUrl: exam.officialSourceUrl,
      sourceNotificationTitle: exam.sourceNotificationTitle,
    };

    const finalExamDate = overrides?.examDate || notice.proposedExamDate || exam.dates.examDate;
    const finalDateStatus = overrides?.dateStatus || notice.proposedDateStatus || 'official';
    const finalSourceUrl = overrides?.officialSourceUrl || notice.documentUrl || notice.sourceUrl;

    // Mutate exam record safely
    exam.dates.examDate = finalExamDate;
    exam.dateStatus = finalDateStatus;
    exam.officialSourceUrl = finalSourceUrl;
    exam.lastVerified = new Date().toISOString().split('T')[0];

    // Mark notice as approved
    notice.status = 'approved';
    notice.reviewedAt = new Date().toISOString();
    notice.reviewedBy = adminEmail;

    // Create Audit Log Entry
    const auditEntry: AdminAuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      adminEmail,
      action: overrides?.examDate !== notice.proposedExamDate ? 'edit_and_approve' : 'approve_official',
      examId: exam.id,
      examName: exam.name,
      previousValues,
      newValues: {
        examDate: finalExamDate,
        dateStatus: finalDateStatus,
        officialSourceUrl: finalSourceUrl,
        sourceNotificationTitle: notice.title,
      },
      sourceNoticeTitle: notice.title,
      sourceNoticeUrl: finalSourceUrl,
      documentUrl: notice.documentUrl,
      adminComment: overrides?.adminComment || 'Approved and published via IndianTimers Admin Dashboard.',
    };

    this.auditLogs.unshift(auditEntry);
    return { success: true, auditEntry };
  }

  rejectNotice(noticeId: string, adminEmail: string, comment?: string): boolean {
    const notice = this.notices.find((n) => n.id === noticeId);
    if (!notice) return false;
    notice.status = 'rejected';
    notice.reviewedAt = new Date().toISOString();
    notice.reviewedBy = adminEmail;

    const exam = EXAM_REGISTRY.find((e) => e.id === notice.matchedExamId);

    this.auditLogs.unshift({
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      adminEmail,
      action: 'reject',
      examId: notice.matchedExamId,
      examName: exam?.name || notice.matchedExamName,
      previousValues: {},
      newValues: {},
      sourceNoticeTitle: notice.title,
      sourceNoticeUrl: notice.sourceUrl,
      adminComment: comment || 'Notice dismissed / rejected as false positive.',
    });
    return true;
  }
}

// Global Singleton Store
export const adminStore = new AdminMonitorStore();
