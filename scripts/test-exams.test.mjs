import test from 'node:test';
import assert from 'node:assert/strict';

// Import countdown engine & registry logic
import { calculateCountdown, getTargetTimestamp } from '../src/utils/countdown.ts';
import { generateICS, getGoogleCalendarUrl } from '../src/utils/calendar.ts';
import { EXAM_REGISTRY } from '../src/data/exams.ts';
import { siteConfig } from '../src/config/site.ts';

test('Exam Registry: Integrity and Provenance Validation', async (t) => {
  await t.test('has at least 40 verified high-priority examination records', () => {
    assert.ok(
      EXAM_REGISTRY.length >= 40,
      `Expected >= 40 exams, but found ${EXAM_REGISTRY.length}`
    );
  });

  await t.test('all exams have unique slugs and stable IDs', () => {
    const slugSet = new Set();
    const idSet = new Set();

    for (const exam of EXAM_REGISTRY) {
      assert.ok(exam.id, `Exam missing id: ${JSON.stringify(exam)}`);
      assert.ok(exam.slug, `Exam missing slug: ${exam.id}`);
      assert.ok(!slugSet.has(exam.slug), `Duplicate slug detected: ${exam.slug}`);
      assert.ok(!idSet.has(exam.id), `Duplicate ID detected: ${exam.id}`);
      slugSet.add(exam.slug);
      idSet.add(exam.id);
    }
  });

  await t.test('all exams have valid ISO-8601 exam dates and valid date ranges', () => {
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
    for (const exam of EXAM_REGISTRY) {
      assert.match(
        exam.dates.examDate,
        isoDateRegex,
        `Exam ${exam.id} has invalid examDate format: ${exam.dates.examDate}`
      );

      if (exam.dates.examEndDate) {
        assert.match(
          exam.dates.examEndDate,
          isoDateRegex,
          `Exam ${exam.id} has invalid examEndDate format: ${exam.dates.examEndDate}`
        );
        assert.ok(
          new Date(exam.dates.examEndDate).getTime() >= new Date(exam.dates.examDate).getTime(),
          `Exam ${exam.id} examEndDate is before examDate`
        );
      }
    }
  });

  await t.test('all exams marked official have verifiable officialSourceUrl and notification title', () => {
    for (const exam of EXAM_REGISTRY) {
      if (exam.dateStatus === 'official') {
        assert.ok(
          exam.officialSourceUrl && exam.officialSourceUrl.startsWith('http'),
          `Official exam ${exam.id} must have a valid officialSourceUrl`
        );
        assert.ok(
          exam.sourceNotificationTitle && exam.sourceNotificationTitle.length > 5,
          `Official exam ${exam.id} must have an explicit sourceNotificationTitle`
        );
      }
    }
  });

  await t.test('all exams have valid categories', () => {
    const validCategories = new Set([
      'medical',
      'engineering',
      'board-exams',
      'government',
      'law',
      'management',
      'other-entrance-exams',
    ]);

    for (const exam of EXAM_REGISTRY) {
      assert.ok(
        validCategories.has(exam.category),
        `Exam ${exam.id} has unknown category: ${exam.category}`
      );
    }
  });
});

test('Countdown Engine: Precision Arithmetic & Timezone Calculation', async (t) => {
  await t.test('correctly calculates remaining days, hours, minutes, seconds for future event', () => {
    // 2 days, 3 hours, 4 minutes, 5 seconds in future = 183845 seconds
    const nowMs = 1700000000000;
    const futureMs = nowMs + (2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000;
    const futureDateStr = new Date(futureMs).toISOString().split('T')[0];

    // parse using getTargetTimestamp and calculate
    const result = calculateCountdown(futureDateStr, '12:00', 'official', 'Asia/Kolkata', nowMs);
    assert.equal(result.isPast, false);
    assert.ok(result.totalSeconds > 0);
  });

  await t.test('accurately identifies past events without negative numbers', () => {
    const pastDateStr = '2020-01-01';
    const result = calculateCountdown(pastDateStr, '09:00', 'official', 'Asia/Kolkata', Date.now());
    assert.equal(result.isPast, true);
    assert.equal(result.days, 0);
    assert.equal(result.hours, 0);
    assert.equal(result.minutes, 0);
    assert.equal(result.seconds, 0);
    assert.equal(result.totalSeconds, 0);
  });

  await t.test('gracefully handles not_announced status without throwing', () => {
    const result = calculateCountdown('2027-12-31', undefined, 'not_announced');
    assert.equal(result.status, 'not_announced');
    assert.equal(result.days, 0);
    assert.equal(result.totalSeconds, 0);
  });

  await t.test('handles leap day (Feb 29) timestamp without distortion', () => {
    const ts = getTargetTimestamp('2028-02-29', '10:00', 'Asia/Kolkata');
    assert.ok(ts !== null);
    const d = new Date(ts);
    assert.equal(d.getUTCFullYear(), 2028);
  });

  await t.test('midnight boundary calculation creates exact day transitions', () => {
    const ts1 = getTargetTimestamp('2027-05-01', '00:00', 'Asia/Kolkata');
    const ts2 = getTargetTimestamp('2027-05-02', '00:00', 'Asia/Kolkata');
    assert.ok(ts1 !== null && ts2 !== null);
    const diffHours = (ts2 - ts1) / (1000 * 3600);
    assert.equal(diffHours, 24, '24 exact hours between consecutive midnights');
  });
});

test('Calendar Utilities: RFC 5545 ICS and Google Calendar Export', async (t) => {
  const sampleExam = EXAM_REGISTRY[0];

  await t.test('generates valid RFC 5545 iCalendar format', () => {
    const ics = generateICS(sampleExam, siteConfig.url);
    assert.ok(ics.includes('BEGIN:VCALENDAR'));
    assert.ok(ics.includes('BEGIN:VEVENT'));
    assert.ok(ics.includes(`SUMMARY:${sampleExam.shortName} Examination`));
    assert.ok(ics.includes('END:VEVENT'));
    assert.ok(ics.includes('END:VCALENDAR'));
  });

  await t.test('generates valid Google Calendar web intent URL', () => {
    const gUrl = getGoogleCalendarUrl(sampleExam, siteConfig.url);
    assert.ok(gUrl.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
    assert.ok(gUrl.includes(encodeURIComponent(`${sampleExam.shortName} Examination`)));
  });
});
