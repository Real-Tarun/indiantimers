import type { DateStatus } from './exam.ts';

export interface NoticeSource {
  id: string;
  authority: string;
  sourceUrl: string;
  associatedExamIds: string[];
  monitoringFrequency: 'daily' | 'hourly' | 'weekly';
  lastChecked: string;
  lastSuccess: string;
  status: 'active' | 'degraded' | 'failing';
  lastError?: string;
  etag?: string;
  lastFingerprint?: string;
  selectorHint?: string;
  notes?: string;
}

export interface DetectedNotice {
  id: string;
  sourceId: string;
  authority: string;
  title: string;
  sourceUrl: string;
  documentUrl?: string; // Link to PDF or official gazette
  matchedExamId: string;
  matchedExamName: string;
  currentExamDate: string;
  proposedExamDate?: string;
  proposedExamEndDate?: string;
  proposedDateStatus: DateStatus;
  registrationDeadline?: string;
  detectedSnippet: string;
  confidenceScore: number; // 0.0 to 1.0
  status: 'pending_review' | 'approved' | 'rejected' | 'tentative_flagged' | 'ignored';
  detectedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  parserNotes?: string[];
  requiresManualReview?: boolean;
}

export interface AdminAuditEntry {
  id: string;
  timestamp: string;
  adminEmail: string;
  action:
    | 'approve_official'
    | 'mark_tentative'
    | 'postpone'
    | 'reschedule'
    | 'edit_and_approve'
    | 'reject'
    | 'ignore';
  examId: string;
  examName: string;
  previousValues: {
    examDate?: string;
    dateStatus?: DateStatus;
    officialSourceUrl?: string;
    sourceNotificationTitle?: string;
  };
  newValues: {
    examDate?: string;
    dateStatus?: DateStatus;
    officialSourceUrl?: string;
    sourceNotificationTitle?: string;
  };
  sourceNoticeTitle: string;
  sourceNoticeUrl: string;
  documentUrl?: string;
  adminComment?: string;
}

export interface MonitoringRunResult {
  runId: string;
  startedAt: string;
  completedAt: string;
  sourcesChecked: number;
  sourcesFailed: number;
  newNoticesDetected: number;
  errors: Array<{ sourceId: string; error: string }>;
}
