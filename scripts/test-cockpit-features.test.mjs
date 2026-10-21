import test from 'node:test';
import assert from 'node:assert/strict';

// Import storage & config
import { storageService } from '../src/utils/storage.ts';
import { EXAM_REGISTRY } from '../src/data/exams.ts';
import { siteConfig } from '../src/config/site.ts';

test('My Exam Cockpit & Local Storage Engine', async (t) => {
  // Clear any existing test state
  storageService.clearAllData();

  await t.test('initializes with default benchmarks if no saved exams exist', () => {
    const saved = storageService.getSavedExamIds();
    assert.ok(Array.isArray(saved), 'Saved exam IDs should be an array');
    assert.ok(saved.length > 0, 'Default benchmarks should be returned');
    assert.ok(saved.includes('neet-ug-2027'));
  });

  await t.test('adds, removes, and prevents duplicate exam IDs', () => {
    storageService.setSavedExamIds(['neet-ug-2027']);

    // Add new exam
    const added = storageService.addSavedExam('jee-main-2027-session-1');
    assert.strictEqual(added, true, 'Should successfully add valid exam ID');

    // Attempt duplicate
    const dupe = storageService.addSavedExam('jee-main-2027-session-1');
    assert.strictEqual(dupe, false, 'Should reject duplicate exam ID');

    // Reject non-existent exam
    const fake = storageService.addSavedExam('fake-exam-9999');
    assert.strictEqual(fake, false, 'Should reject non-existent exam ID');

    // Remove exam
    storageService.removeSavedExam('jee-main-2027-session-1');
    const remaining = storageService.getSavedExamIds();
    assert.strictEqual(remaining.includes('jee-main-2027-session-1'), false);
  });

  await t.test('supports toggling favourites', () => {
    const isFavBefore = storageService.isFavorite('upsc-cse-prelims-2027');
    const toggled = storageService.toggleFavorite('upsc-cse-prelims-2027');
    assert.strictEqual(toggled, !isFavBefore);
    assert.strictEqual(storageService.isFavorite('upsc-cse-prelims-2027'), toggled);

    // Toggle back
    const toggledBack = storageService.toggleFavorite('upsc-cse-prelims-2027');
    assert.strictEqual(toggledBack, isFavBefore);
  });

  await t.test('creates, edits, and deletes custom countdown items', () => {
    const item = storageService.saveCustomCountdown({
      title: 'Allen Chemistry Mock 1',
      targetDate: '2027-03-15',
      targetTime: '10:00',
      timezone: 'Asia/Kolkata',
      category: 'Coaching Mock',
      notes: 'Focus on Coordination Compounds',
    });

    assert.ok(item.id.startsWith('custom_'));
    assert.strictEqual(item.title, 'Allen Chemistry Mock 1');

    // Verify retrieval
    let list = storageService.getCustomCountdowns();
    assert.ok(list.some((c) => c.id === item.id));

    // Edit item
    const updated = storageService.saveCustomCountdown(
      {
        title: 'Allen Chemistry Mock 1 (Revised)',
        targetDate: '2027-03-16',
        targetTime: '11:00',
        timezone: 'Asia/Kolkata',
        category: 'Coaching Mock',
        notes: 'Updated date by coaching institute',
      },
      item.id
    );

    assert.strictEqual(updated.title, 'Allen Chemistry Mock 1 (Revised)');
    assert.strictEqual(updated.targetDate, '2027-03-16');

    // Delete item
    storageService.deleteCustomCountdown(item.id);
    list = storageService.getCustomCountdowns();
    assert.strictEqual(list.some((c) => c.id === item.id), false);
  });

  await t.test('saves and retrieves cockpit preferences', () => {
    storageService.savePreferences({
      countdownDisplay: 'compact',
      dashboardSort: 'name',
    });

    const prefs = storageService.getPreferences();
    assert.strictEqual(prefs.countdownDisplay, 'compact');
    assert.strictEqual(prefs.dashboardSort, 'name');
  });
});

test('Personal Data Portability: Schema V1 Export and Validation', async (t) => {
  storageService.clearAllData();
  storageService.setSavedExamIds(['neet-ug-2027', 'gate-2027']);
  storageService.saveCustomCountdown({
    title: 'School Board Chemistry',
    targetDate: '2027-02-28',
    category: 'School Test',
  });

  await t.test('generates valid Schema Version 1 JSON backup', () => {
    const jsonStr = storageService.exportAllUserData();
    assert.ok(typeof jsonStr === 'string', 'Export must return a string');

    const parsed = JSON.parse(jsonStr);
    assert.strictEqual(parsed.app, 'IndianTimers');
    assert.strictEqual(parsed.schemaVersion, 1);
    assert.ok(parsed.exportedAt);
    assert.ok(Array.isArray(parsed.data.savedExamIds));
    assert.ok(parsed.data.savedExamIds.includes('neet-ug-2027'));
    assert.ok(parsed.data.customCountdowns.length > 0);
  });

  await t.test('validates valid Schema 1 backup successfully', () => {
    const jsonStr = storageService.exportAllUserData();
    const result = storageService.validateBackup(jsonStr);
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.schemaVersion, 1);
    assert.ok(result.counts.savedExams >= 2);
    assert.ok(result.counts.customCountdowns >= 1);
  });

  await t.test('rejects corrupted or oversized payloads', () => {
    // Malformed JSON
    const malformed = storageService.validateBackup('{ invalid json');
    assert.strictEqual(malformed.valid, false);

    // Oversized (>1MB)
    const giantPayload = JSON.stringify({
      app: 'IndianTimers',
      schemaVersion: 1,
      data: { junk: 'x'.repeat(1024 * 1025) },
    });
    const oversized = storageService.validateBackup(giantPayload);
    assert.strictEqual(oversized.valid, false);
    assert.match(oversized.error || '', /size limit/i);
  });

  await t.test('filters invalid exam IDs during import to protect registry', () => {
    const maliciousPayload = JSON.stringify({
      app: 'IndianTimers',
      schemaVersion: 1,
      exportedAt: new Date().toISOString(),
      data: {
        savedExamIds: ['neet-ug-2027', 'non-existent-exam-hacked'],
        favouriteExamIds: ['neet-ug-2027', '<script>alert(1)</script>'],
        customCountdowns: [
          {
            id: 'custom_1',
            title: 'Valid Mock',
            targetDate: '2027-04-10',
            category: 'Mock',
          },
        ],
        preferences: {},
        studySessions: [],
      },
    });

    const report = storageService.validateBackup(maliciousPayload);
    assert.strictEqual(report.valid, true);
    // Verified: only valid registry IDs passed through
    assert.strictEqual(report.parsedData?.savedExamIds.length, 1);
    assert.strictEqual(report.parsedData?.savedExamIds[0], 'neet-ug-2027');
    assert.strictEqual(report.parsedData?.favouriteExamIds.length, 1);
  });

  await t.test('merges backup without duplicate custom countdowns', () => {
    storageService.clearAllData();
    storageService.saveCustomCountdown({
      title: 'Math Revision',
      targetDate: '2027-03-01',
      category: 'Revision',
    });

    const importData = {
      savedExamIds: ['upsc-cse-prelims-2027'],
      favouriteExamIds: ['upsc-cse-prelims-2027'],
      customCountdowns: [
        {
          id: 'custom_new',
          title: 'Math Revision', // Same title & date
          targetDate: '2027-03-01',
          category: 'Revision',
          timezone: 'Asia/Kolkata',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'custom_unique',
          title: 'Biology Mock 2',
          targetDate: '2027-03-10',
          category: 'Mock',
          timezone: 'Asia/Kolkata',
          createdAt: new Date().toISOString(),
        },
      ],
      preferences: storageService.getPreferences(),
      studySessions: [],
    };

    const res = storageService.importUserData(importData, 'merge');
    assert.strictEqual(res.success, true);

    const customList = storageService.getCustomCountdowns();
    // Math Revision should not be duplicated; total should be 2 (Math Revision + Biology Mock 2)
    assert.strictEqual(customList.length, 2);
  });
});

test('Embed & Shareable Countdown Integration', async (t) => {
  await t.test('siteConfig provides valid production origin for embeds and shares', () => {
    assert.ok(siteConfig.url.startsWith('http'), 'siteConfig.url must have valid protocol');
    assert.strictEqual(siteConfig.url.endsWith('/'), false, 'siteConfig.url must not have trailing slash');
  });

  await t.test('all benchmark exams have valid canonical dates for countdown calculation', () => {
    const benchmark = EXAM_REGISTRY.find((e) => e.id === 'neet-ug-2027');
    assert.ok(benchmark);
    assert.strictEqual(benchmark.dates.examDate, '2027-05-02');
    assert.strictEqual(benchmark.officialSourceUrl, 'https://exams.nta.ac.in/NEET/');
  });
});
