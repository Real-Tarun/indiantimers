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
    detectedSnippet: 'The National Testing Agency (NTA) will conduct NEET (UG) 2027 on Sunday, 02 May 2027 from 02:00 PM to 05:00 PM (IST) in Computer-Based Test (CBT Online) mode across India.',
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
  private baselines = new Map<string, ExamRecord>();

  constructor() {
    for (const exam of EXAM_REGISTRY) {
      this.baselines.set(exam.id, JSON.parse(JSON.stringify(exam)));
    }
    this.loadOverridesFromStorage();
  }

  loadOverridesFromStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const raw = window.localStorage.getItem('it_clock_overrides') || window.localStorage.getItem('it_admin_clock_overrides');
      if (!raw) return;
      const stored = JSON.parse(raw);
      for (const [examId, override] of Object.entries(stored)) {
        const exam = EXAM_REGISTRY.find((e) => e.id === examId);
        if (exam && override && typeof override === 'object') {
          const ov = override as any;
          if (ov.dates) exam.dates = { ...exam.dates, ...ov.dates };
          if (ov.dateStatus) exam.dateStatus = ov.dateStatus;
          if (ov.officialSourceUrl) exam.officialSourceUrl = ov.officialSourceUrl;
          if (ov.sourceNotificationTitle) exam.sourceNotificationTitle = ov.sourceNotificationTitle;
          if (ov.officialWebsite) exam.officialWebsite = ov.officialWebsite;
          if (ov.startTime) exam.startTime = ov.startTime;
          if (ov.endTime) exam.endTime = ov.endTime;
          if (ov.durationMinutes) exam.durationMinutes = ov.durationMinutes;
          if (ov.shortDescription) exam.shortDescription = ov.shortDescription;
          if (ov.lastVerified) exam.lastVerified = ov.lastVerified;
        }
      }
    } catch (err) {
      console.warn('Failed to restore clock overrides from storage:', err);
    }
  }

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

  // --- Clock Management & Detailed Statistics ---

  getAllExams(): ExamRecord[] {
    return EXAM_REGISTRY;
  }

  getExamById(examId: string): ExamRecord | undefined {
    return EXAM_REGISTRY.find((e) => e.id === examId);
  }

  private saveOverridesToStorage(exam: ExamRecord): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const stored = JSON.parse(window.localStorage.getItem('it_clock_overrides') || '{}');
      stored[exam.id] = {
        dates: exam.dates,
        dateStatus: exam.dateStatus,
        officialSourceUrl: exam.officialSourceUrl,
        sourceNotificationTitle: exam.sourceNotificationTitle,
        officialWebsite: exam.officialWebsite,
        startTime: exam.startTime,
        endTime: exam.endTime,
        durationMinutes: exam.durationMinutes,
        shortDescription: exam.shortDescription,
        lastVerified: exam.lastVerified,
      };
      window.localStorage.setItem('it_clock_overrides', JSON.stringify(stored));
      window.localStorage.setItem('it_admin_clock_overrides', JSON.stringify(stored));
      // Broadcast live event for every countdown card & cockpit on screen
      window.dispatchEvent(
        new CustomEvent('indiantimers:clock-updated', {
          detail: { examId: exam.id, exam },
        })
      );
    } catch (err) {
      console.warn('Failed to persist clock overrides to localStorage', err);
    }
  }

  updateExamClock(
    examId: string,
    updates: {
      examDate?: string;
      examEndDate?: string;
      registrationStart?: string;
      registrationEnd?: string;
      admitCardRelease?: string;
      dateStatus?: DateStatus;
      officialSourceUrl?: string;
      sourceNotificationTitle?: string;
      officialWebsite?: string;
      startTime?: string;
      endTime?: string;
      durationMinutes?: number;
      shortDescription?: string;
      adminComment?: string;
    },
    adminEmail: string
  ): { success: boolean; error?: string; auditEntry?: AdminAuditEntry } {
    const exam = EXAM_REGISTRY.find((e) => e.id === examId);
    if (!exam) return { success: false, error: `Exam with ID '${examId}' not found in registry.` };

    const previousValues = {
      examDate: exam.dates.examDate,
      dateStatus: exam.dateStatus,
      officialSourceUrl: exam.officialSourceUrl,
      sourceNotificationTitle: exam.sourceNotificationTitle,
    };

    // Apply updates directly to in-memory registry
    if (updates.examDate) exam.dates.examDate = updates.examDate;
    if (updates.examEndDate !== undefined) exam.dates.examEndDate = updates.examEndDate || undefined;
    if (updates.registrationStart !== undefined) exam.dates.registrationStart = updates.registrationStart || undefined;
    if (updates.registrationEnd !== undefined) exam.dates.registrationEnd = updates.registrationEnd || undefined;
    if (updates.admitCardRelease !== undefined) exam.dates.admitCardRelease = updates.admitCardRelease || undefined;
    if (updates.dateStatus) exam.dateStatus = updates.dateStatus;
    if (updates.officialSourceUrl) exam.officialSourceUrl = updates.officialSourceUrl;
    if (updates.sourceNotificationTitle) exam.sourceNotificationTitle = updates.sourceNotificationTitle;
    if (updates.officialWebsite) exam.officialWebsite = updates.officialWebsite;
    if (updates.startTime) exam.startTime = updates.startTime;
    if (updates.endTime) exam.endTime = updates.endTime;
    if (updates.durationMinutes) exam.durationMinutes = Number(updates.durationMinutes);
    if (updates.shortDescription) exam.shortDescription = updates.shortDescription;

    exam.lastVerified = new Date().toISOString().split('T')[0];

    // Persist & Broadcast to all countdown components
    this.saveOverridesToStorage(exam);

    const auditEntry: AdminAuditEntry = {
      id: `audit_clock_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      adminEmail,
      action: 'reschedule',
      examId: exam.id,
      examName: exam.name,
      previousValues,
      newValues: {
        examDate: exam.dates.examDate,
        dateStatus: exam.dateStatus,
        officialSourceUrl: exam.officialSourceUrl,
        sourceNotificationTitle: exam.sourceNotificationTitle,
      },
      sourceNoticeTitle: updates.sourceNotificationTitle || exam.sourceNotificationTitle,
      sourceNoticeUrl: updates.officialSourceUrl || exam.officialSourceUrl,
      adminComment: updates.adminComment || 'Direct exam clock update published via Admin Management Console.',
    };

    this.auditLogs.unshift(auditEntry);
    return { success: true, auditEntry };
  }

  hasOverride(examId: string): boolean {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    try {
      const stored = JSON.parse(window.localStorage.getItem('it_clock_overrides') || '{}');
      return !!stored[examId];
    } catch {
      return false;
    }
  }

  getActiveOverridesCount(): number {
    if (typeof window === 'undefined' || !window.localStorage) return 0;
    try {
      const stored = JSON.parse(window.localStorage.getItem('it_clock_overrides') || '{}');
      return Object.keys(stored).length;
    } catch {
      return 0;
    }
  }

  resetExamClock(examId: string, adminEmail: string): boolean {
    const exam = EXAM_REGISTRY.find((e) => e.id === examId);
    const baseline = this.baselines.get(examId);
    if (!exam || !baseline) return false;

    const previousValues = {
      examDate: exam.dates.examDate,
      dateStatus: exam.dateStatus,
      officialSourceUrl: exam.officialSourceUrl,
      sourceNotificationTitle: exam.sourceNotificationTitle,
    };

    // Restore pristine values
    Object.assign(exam, JSON.parse(JSON.stringify(baseline)));

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = JSON.parse(window.localStorage.getItem('it_clock_overrides') || '{}');
        delete stored[examId];
        window.localStorage.setItem('it_clock_overrides', JSON.stringify(stored));
        window.localStorage.setItem('it_admin_clock_overrides', JSON.stringify(stored));
        window.dispatchEvent(
          new CustomEvent('indiantimers:clock-updated', {
            detail: { examId, exam },
          })
        );
      } catch (e) {}
    }

    this.auditLogs.unshift({
      id: `audit_reset_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail,
      action: 'reschedule',
      examId: exam.id,
      examName: exam.name,
      previousValues,
      newValues: {
        examDate: exam.dates.examDate,
        dateStatus: exam.dateStatus,
        officialSourceUrl: exam.officialSourceUrl,
        sourceNotificationTitle: exam.sourceNotificationTitle,
      },
      sourceNoticeTitle: exam.sourceNotificationTitle,
      sourceNoticeUrl: exam.officialSourceUrl,
      adminComment: 'Reset countdown clock to official repository baseline.',
    });

    return true;
  }

  resetAllClocks(adminEmail: string): void {
    for (const [id, baseline] of this.baselines.entries()) {
      const exam = EXAM_REGISTRY.find((e) => e.id === id);
      if (exam) {
        Object.assign(exam, JSON.parse(JSON.stringify(baseline)));
      }
    }
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('it_clock_overrides');
      window.localStorage.removeItem('it_admin_clock_overrides');
      window.dispatchEvent(new CustomEvent('indiantimers:clock-updated', { detail: { examId: 'all' } }));
    }
    this.auditLogs.unshift({
      id: `audit_reset_all_${Date.now()}`,
      timestamp: new Date().toISOString(),
      adminEmail,
      action: 'reschedule',
      examId: 'all',
      examName: 'All Examination Clocks',
      previousValues: {},
      newValues: {},
      adminComment: 'All customized countdown clocks reset to factory baseline.',
    });
  }

  getSystemStatistics() {
    const totalExams = EXAM_REGISTRY.length;
    const officialCount = EXAM_REGISTRY.filter((e) => e.dateStatus === 'official').length;
    const tentativeCount = EXAM_REGISTRY.filter((e) => e.dateStatus === 'tentative').length;
    const expectedCount = EXAM_REGISTRY.filter((e) => e.dateStatus === 'expected').length;

    const categories: Record<string, number> = {
      engineering: 0,
      medical: 0,
      government: 0,
      law: 0,
      'board-exams': 0,
      management: 0,
      'other-entrance-exams': 0,
    };

    for (const e of EXAM_REGISTRY) {
      if (categories[e.category] !== undefined) {
        categories[e.category]++;
      }
    }

    const sourcesActive = this.sources.filter((s) => s.status === 'active').length;
    const sourcesFailing = this.sources.filter((s) => s.status === 'failing').length;

    const noticesPending = this.notices.filter((n) => n.status === 'pending_review').length;
    const noticesApproved = this.notices.filter((n) => n.status === 'approved').length;
    const noticesRejected = this.notices.filter((n) => n.status === 'rejected').length;

    const totalConfidence = this.notices.reduce((acc, n) => acc + (n.confidenceScore || 0), 0);
    const avgConfidence = this.notices.length > 0 ? (totalConfidence / this.notices.length) * 100 : 95.0;

    return {
      totalExams,
      officialCount,
      officialPercentage: totalExams > 0 ? ((officialCount / totalExams) * 100).toFixed(1) : '0',
      tentativeCount,
      tentativePercentage: totalExams > 0 ? ((tentativeCount / totalExams) * 100).toFixed(1) : '0',
      expectedCount,
      expectedPercentage: totalExams > 0 ? ((expectedCount / totalExams) * 100).toFixed(1) : '0',
      categories,
      totalSources: this.sources.length,
      sourcesActive,
      sourcesFailing,
      totalNotices: this.notices.length,
      noticesPending,
      noticesApproved,
      noticesRejected,
      avgConfidence: avgConfidence.toFixed(1),
      totalAuditLogs: this.auditLogs.length,
      activeOverrides: this.getActiveOverridesCount(),
    };
  }
}

// Global Singleton Store
export const adminStore = new AdminMonitorStore();

