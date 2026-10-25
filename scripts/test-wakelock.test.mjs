import test from 'node:test';
import assert from 'node:assert/strict';
import { wakeLockService } from '../src/utils/wakeLock.ts';

test('Screen Wake Lock Engine (SSR & Node.js environment)', async (t) => {
  await t.test('safely handles SSR and Node environment without window', () => {
    assert.strictEqual(wakeLockService.isSupported(), false);
    assert.strictEqual(wakeLockService.isActive(), false);
  });

  await t.test('acquire and release run without throwing in Node', async () => {
    const acquired = await wakeLockService.acquire();
    assert.strictEqual(acquired, false);
    wakeLockService.release();
    wakeLockService.forceRelease();
    assert.strictEqual(wakeLockService.isActive(), false);
  });

  await t.test('supports subscriber notifications and toggle preferences', () => {
    let notified = false;
    const unsubscribe = wakeLockService.subscribe((active) => {
      notified = true;
      assert.strictEqual(typeof active, 'boolean');
    });
    assert.strictEqual(notified, true);
    unsubscribe();

    wakeLockService.setEnabled(false);
    assert.strictEqual(wakeLockService.isEnabled(), false);
    wakeLockService.setEnabled(true);
    assert.strictEqual(wakeLockService.isEnabled(), true);
  });
});
