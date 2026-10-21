import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeContent,
  generateFingerprint,
  extractDateFromNotice,
  detectStatusFromNotice,
  matchExamFromText,
  parseNoticeItem,
} from '../src/lib/monitor/engine.ts';
import { OFFICIAL_NOTICE_SOURCES } from '../src/lib/monitor/sources.ts';
import { adminStore } from '../src/lib/monitor/store.ts';
import { EXAM_REGISTRY } from '../src/data/exams.ts';

test('Notice Monitoring Engine: Normalization & Fingerprinting', async (t) => {
  await t.test('strips volatile session IDs, scripts, and whitespace', () => {
    const rawHtml = `
      <html>
        <head><script>const sessionId = "sess_12345";</script></head>
        <body>
          <p>Official NEET UG Notice</p>
          <!-- volatile comment -->
          <a href="/doc?session_id=98765">Download</a>
        </body>
      </html>
    `;
    const normalized = normalizeContent(rawHtml);
    assert.strictEqual(normalized.includes('sessionId'), false, 'Scripts should be removed');
    assert.strictEqual(normalized.includes('volatile comment'), false, 'Comments should be stripped');
    assert.ok(normalized.includes('Official NEET UG Notice'));
  });

  await t.test('produces deterministic SHA fingerprints for identical normalized text', () => {
    const text1 = 'National Eligibility cum Entrance Test NEET UG 2027 Schedule on 2 May 2027';
    const text2 = 'National Eligibility cum Entrance Test NEET UG 2027 Schedule on 2 May 2027';
    const text3 = 'National Eligibility cum Entrance Test NEET UG 2027 Postponed';

    const fp1 = generateFingerprint(text1);
    const fp2 = generateFingerprint(text2);
    const fp3 = generateFingerprint(text3);

    assert.strictEqual(fp1, fp2, 'Identical content must have identical fingerprint');
    assert.notStrictEqual(fp1, fp3, 'Modified content must produce different fingerprint');
  });
});

test('Notice Extraction: Date Parser & Status Detection', async (t) => {
  await t.test('extracts Indian textual date formats (2 May 2027)', () => {
    const snippet = 'The NTA will conduct NEET (UG) 2027 on Sunday, 2 May 2027 across 13 languages.';
    const res = extractDateFromNotice(snippet);
    assert.strictEqual(res.examDate, '2027-05-02');
    assert.strictEqual(res.isDateRange, false);
  });

  await t.test('extracts Indian dot/slash date formats (02.05.2027)', () => {
    const snippet = 'Notice: UPSC CSE Prelims will be held on 23.05.2027 across all designated centres.';
    const res = extractDateFromNotice(snippet);
    assert.strictEqual(res.examDate, '2027-05-23');
  });

  await t.test('extracts examination window date ranges (22 January to 31 January 2027)', () => {
    const snippet = 'JEE Main 2027 Session 1 window is scheduled between 22 January to 31 January 2027.';
    const res = extractDateFromNotice(snippet);
    assert.strictEqual(res.isDateRange, true);
    assert.strictEqual(res.examDate, '2027-01-22');
    assert.strictEqual(res.examEndDate, '2027-01-31');
  });

  await t.test('detects postponement and official confirmation status keywords', () => {
    const notice1 = 'Public Notice: Examination has been postponed until further notice.';
    const notice2 = 'Gazette Notification: Final Examination Schedule Released.';
    const notice3 = 'Tentative Academic Calendar of National Level Entrances.';

    assert.strictEqual(detectStatusFromNotice(notice1), 'postponed');
    assert.strictEqual(detectStatusFromNotice(notice2), 'official');
    assert.strictEqual(detectStatusFromNotice(notice3), 'tentative');
  });
});

test('Notice Parser: Examination Matching & Registry Integrity', async (t) => {
  const source = OFFICIAL_NOTICE_SOURCES.find((s) => s.id === 'nta-neet');
  assert.ok(source);

  await t.test('matches valid circular to canonical examination in registry', () => {
    const raw = {
      title: 'Public Notice: Schedule for NEET UG 2027 National Entrance Examination',
      snippet: 'NEET UG 2027 examination will be conducted on 2 May 2027 from 2:00 PM to 5:20 PM.',
      link: 'https://exams.nta.ac.in/NEET/notice.html',
      pdfUrl: 'https://exams.nta.ac.in/NEET/circular.pdf',
    };

    const parsed = parseNoticeItem(raw, source);
    assert.ok(parsed, 'Notice should be successfully parsed');
    assert.strictEqual(parsed.matchedExamId, 'neet-ug-2027');
    assert.strictEqual(parsed.proposedExamDate, '2027-05-02');
    assert.ok(parsed.confidenceScore >= 0.8, 'Expected high confidence score');
  });

  await t.test('ignores circulars unrelated to registered examinations', () => {
    const raw = {
      title: 'Recruitment of Junior Translators and Hindi Typists in Central Departments',
      snippet: 'Applications are invited for vacant translator posts in central secretariats.',
      link: 'https://nta.ac.in/recruitment',
    };

    const parsed = parseNoticeItem(raw, source);
    assert.strictEqual(parsed, null, 'Unrelated circular must not generate exam notice');
  });
});

test('Admin Store & Publication Safeguards', async (t) => {
  await t.test('suppresses duplicate notices in review queue', () => {
    const dummyNotice = {
      id: 'test_dupe_notice_1',
      sourceId: 'clat-consortium',
      authority: 'Consortium of NLUs',
      title: 'Duplicate Test Notice CLAT',
      sourceUrl: 'https://consortiumofnlus.ac.in',
      matchedExamId: 'clat-2027',
      matchedExamName: 'CLAT 2027',
      currentExamDate: '2027-12-05',
      proposedExamDate: '2027-12-05',
      proposedDateStatus: 'official',
      detectedSnippet: 'Test snippet',
      confidenceScore: 0.9,
      status: 'pending_review',
      detectedAt: new Date().toISOString(),
    };

    const firstAdd = adminStore.addDetectedNotice(dummyNotice);
    const dupeAdd = adminStore.addDetectedNotice(dummyNotice);

    assert.strictEqual(firstAdd, true, 'First notice addition should succeed');
    assert.strictEqual(dupeAdd, false, 'Duplicate notice addition must be rejected');
  });

  await t.test('approves notice, updates registry, and writes immutable audit entry', () => {
    const pendingList = adminStore.getPendingNotices();
    assert.ok(pendingList.length > 0, 'Seed pending notices should be present');
    const targetNotice = pendingList[0];

    const auditCountBefore = adminStore.getAuditLogs().length;

    const res = adminStore.applyApproval(targetNotice.id, 'admin-tester@indiantimers.com', {
      examDate: '2027-05-02',
      dateStatus: 'official',
      adminComment: 'Automated test suite approval verification.',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.auditEntry?.adminEmail, 'admin-tester@indiantimers.com');
    assert.strictEqual(res.auditEntry?.newValues.dateStatus, 'official');

    // Verify audit log increment
    const auditCountAfter = adminStore.getAuditLogs().length;
    assert.strictEqual(auditCountAfter, auditCountBefore + 1);

    // Verify exam record was safely updated
    const exam = EXAM_REGISTRY.find((e) => e.id === targetNotice.matchedExamId);
    assert.ok(exam);
    assert.strictEqual(exam.dateStatus, 'official');
  });

  await t.test('rejects notice and logs audit action without modifying canonical date', () => {
    const dummyNotice = {
      id: 'test_reject_notice_1',
      sourceId: 'nta-portal',
      authority: 'NTA',
      title: 'False Positive Speculative Circular',
      sourceUrl: 'https://exams.nta.ac.in',
      matchedExamId: 'cuet-ug-2027',
      matchedExamName: 'CUET UG 2027',
      currentExamDate: '2027-05-17',
      proposedExamDate: '2027-08-01',
      proposedDateStatus: 'tentative',
      detectedSnippet: 'Fake date',
      confidenceScore: 0.3,
      status: 'pending_review',
      detectedAt: new Date().toISOString(),
    };

    adminStore.addDetectedNotice(dummyNotice);
    const rejected = adminStore.rejectNotice('test_reject_notice_1', 'admin@indiantimers.com', 'False alarm.');
    assert.strictEqual(rejected, true);

    const exam = EXAM_REGISTRY.find((e) => e.id === 'cuet-ug-2027');
    assert.strictEqual(exam?.dates.examDate, '2027-05-17', 'Canonical exam date must not be changed on rejection');
  });
});
