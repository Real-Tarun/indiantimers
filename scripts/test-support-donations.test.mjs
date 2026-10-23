import { describe, it } from 'node:test';
import assert from 'node:assert';
import { supportStore } from '../src/lib/support/store.ts';

describe('Support Us & Supporter Leaderboard System', () => {
  it('correctly provides initial bootstrap leaderboard with Top 5 supporters ranked by amount', () => {
    const leaderboard = supportStore.getLeaderboard();

    assert.ok(Array.isArray(leaderboard.top5), 'Top 5 should be an array');
    assert.strictEqual(leaderboard.top5.length, 5, 'Top 5 should contain exactly 5 supporters');
    assert.ok(leaderboard.allSupporters.length >= 5, 'All supporters should contain at least 5');

    // Verify sorted descending by amount
    for (let i = 0; i < leaderboard.top5.length - 1; i++) {
      assert.ok(
        leaderboard.top5[i].amount >= leaderboard.top5[i + 1].amount,
        `Rank #${i + 1} amount should be >= Rank #${i + 2}`
      );
      assert.strictEqual(leaderboard.top5[i].rank, i + 1, `Rank should equal ${i + 1}`);
    }

    // Verify stats
    assert.ok(leaderboard.stats.totalRaised > 0, 'Total raised should be positive');
    assert.strictEqual(leaderboard.stats.updateInterval, '12 Hours (Verified Review Cycle)');
  });

  it('validates donation submission input constraints (₹10 min, ₹50k max, valid UTR)', () => {
    // 1. Amount below minimum
    const lowRes = supportStore.submitDonation({
      name: 'Rohan Sharma',
      amount: 5,
      utr: '429188000111',
    });
    assert.strictEqual(lowRes.success, false);
    assert.match(lowRes.error, /Minimum contribution amount is ₹10/);

    // 2. Amount above maximum
    const highRes = supportStore.submitDonation({
      name: 'Rohan Sharma',
      amount: 75000,
      utr: '429188000112',
    });
    assert.strictEqual(highRes.success, false);
    assert.match(highRes.error, /Maximum contribution amount per transaction is ₹50,000/);

    // 3. Name too short
    const shortNameRes = supportStore.submitDonation({
      name: 'A',
      amount: 100,
      utr: '429188000113',
    });
    assert.strictEqual(shortNameRes.success, false);
    assert.match(shortNameRes.error, /supporter name/);

    // 4. Invalid UTR
    const badUtrRes = supportStore.submitDonation({
      name: 'Rohan Sharma',
      amount: 100,
      utr: '123',
    });
    assert.strictEqual(badUtrRes.success, false);
    assert.match(badUtrRes.error, /UTR reference/);
  });

  it('submits valid donation into pending verification queue without publishing to leaderboard immediately', () => {
    const testUtr = '429999' + Date.now().toString().slice(-6);
    const initialApprovedCount = supportStore.getLeaderboard().allSupporters.length;

    const res = supportStore.submitDonation({
      name: 'Deepak Chopra',
      amount: 750,
      utr: testUtr,
      email: 'deepak.test@example.com',
      message: 'Great work on IndianTimers!',
      isAnonymous: false,
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.record, 'Should return created record');
    assert.strictEqual(res.record.status, 'pending');

    // Must NOT be in approved leaderboard yet
    const currentLeaderboard = supportStore.getLeaderboard();
    assert.strictEqual(
      currentLeaderboard.allSupporters.length,
      initialApprovedCount,
      'Approved leaderboard count should remain unchanged while pending'
    );

    // Prevents duplicate submission with same UTR
    const dupRes = supportStore.submitDonation({
      name: 'Deepak Chopra',
      amount: 750,
      utr: testUtr,
    });
    assert.strictEqual(dupRes.success, false);
    assert.match(dupRes.error, /already been submitted/);

    // Admin approves donation
    const approveOk = supportStore.approveDonation(res.record.id, 'admin@indiantimers.com', 'Verified in bank ledger');
    assert.strictEqual(approveOk, true);

    // Now it should be published in the public leaderboard
    const updatedLeaderboard = supportStore.getLeaderboard();
    assert.strictEqual(
      updatedLeaderboard.allSupporters.length,
      initialApprovedCount + 1,
      'Approved leaderboard should now include the new donation'
    );
    const found = updatedLeaderboard.allSupporters.find((s) => s.utr === testUtr);
    assert.ok(found, 'Newly approved donation should exist in leaderboard');
    assert.strictEqual(found.amount, 750);
    assert.strictEqual(found.name, 'Deepak Chopra');
  });

  it('correctly masks supporter name when isAnonymous is enabled', () => {
    const maskedSingle = supportStore.maskName('Tarun', true);
    assert.strictEqual(maskedSingle, 'T***n');

    const maskedFull = supportStore.maskName('Rohit Kumar Mehra', true);
    assert.strictEqual(maskedFull, 'R*** K*** M***');

    const unmasked = supportStore.maskName('Tarun Kumar', false);
    assert.strictEqual(unmasked, 'Tarun Kumar');
  });

  it('handles admin reject correctly without publishing to leaderboard', () => {
    const testUtr = '428888' + Date.now().toString().slice(-6);
    const res = supportStore.submitDonation({
      name: 'Spam Sender',
      amount: 50,
      utr: testUtr,
    });

    assert.strictEqual(res.success, true);
    const rejectOk = supportStore.rejectDonation(res.record.id, 'admin@indiantimers.com', 'Fake UTR not found in bank');
    assert.strictEqual(rejectOk, true);

    const adminData = supportStore.getAdminData();
    const rejectedItem = adminData.rejected.find((r) => r.id === res.record.id);
    assert.ok(rejectedItem, 'Item should be present in rejected list');
    assert.strictEqual(rejectedItem.status, 'rejected');

    // Not in leaderboard
    const inLeaderboard = supportStore.getLeaderboard().allSupporters.some((s) => s.id === res.record.id);
    assert.strictEqual(inLeaderboard, false);
  });
});
