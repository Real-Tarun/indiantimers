import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { onRequest } from '../functions/_middleware.js';

describe('Cloudflare Pages Middleware Domain & Crawler Defense', () => {
  test('forbids crawler indexing on *.pages.dev/robots.txt with strict Disallow and noindex header', async () => {
    let nextCalled = false;
    const context = {
      request: new Request('https://indiantimers.pages.dev/robots.txt'),
      next: async () => { nextCalled = true; return new Response('OK'); }
    };

    const response = await onRequest(context);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(response.headers.get('Content-Type'), 'text/plain; charset=utf-8');
    assert.strictEqual(response.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
    
    const body = await response.text();
    assert.match(body, /User-agent:\s*\*/);
    assert.match(body, /Disallow:\s*\//);
  });

  test('301 redirects any *.pages.dev URL to https://indiantimers.com with X-Robots-Tag', async () => {
    let nextCalled = false;
    const context = {
      request: new Request('https://indiantimers.pages.dev/exams/neet-ug-2027/?tab=syllabus'),
      next: async () => { nextCalled = true; return new Response('OK'); }
    };

    const response = await onRequest(context);
    assert.strictEqual(response.status, 301);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(response.headers.get('Location'), 'https://indiantimers.com/exams/neet-ug-2027/?tab=syllabus');
    assert.strictEqual(response.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
  });

  test('301 redirects preview subdomains like feat-branch.indiantimers.pages.dev to production canonical', async () => {
    let nextCalled = false;
    const context = {
      request: new Request('https://feat-branch.indiantimers.pages.dev/calendar/2027/'),
      next: async () => { nextCalled = true; return new Response('OK'); }
    };

    const response = await onRequest(context);
    assert.strictEqual(response.status, 301);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(response.headers.get('Location'), 'https://indiantimers.com/calendar/2027/');
    assert.strictEqual(response.headers.get('X-Robots-Tag'), 'noindex, nofollow, noarchive');
  });

  test('301 redirects www.indiantimers.com to apex canonical domain https://indiantimers.com', async () => {
    let nextCalled = false;
    const context = {
      request: new Request('https://www.indiantimers.com/tools/pomodoro-timer/'),
      next: async () => { nextCalled = true; return new Response('OK'); }
    };

    const response = await onRequest(context);
    assert.strictEqual(response.status, 301);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(response.headers.get('Location'), 'https://indiantimers.com/tools/pomodoro-timer/');
  });

  test('passes through requests made to canonical production domain (indiantimers.com)', async () => {
    let nextCalled = false;
    const context = {
      request: new Request('https://indiantimers.com/exams/'),
      next: async () => { nextCalled = true; return new Response('ORIGINAL_CONTENT', { status: 200 }); }
    };

    const response = await onRequest(context);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(response.status, 200);
    const body = await response.text();
    assert.strictEqual(body, 'ORIGINAL_CONTENT');
  });

  test('serves IndexNow verification key file directly with utf-8 content', async () => {
    let nextCalled = false;
    const context = {
      request: new Request('https://indiantimers.com/0b70112e844148169c3cf57adb1988fd.txt'),
      next: async () => { nextCalled = true; return new Response('OK'); }
    };

    const response = await onRequest(context);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(nextCalled, false);
    assert.strictEqual(response.headers.get('Content-Type'), 'text/plain; charset=utf-8');
    const body = (await response.text()).trim();
    assert.strictEqual(body, '0b70112e844148169c3cf57adb1988fd');
  });

  test('cloaks /admin on public indiantimers.com with 404 when unauthenticated', async () => {
    let nextCalled = false;
    const context = {
      request: new Request('https://indiantimers.com/admin/'),
      next: async () => { nextCalled = true; return new Response('ADMIN_PANEL'); }
    };

    const response = await onRequest(context);
    assert.strictEqual(nextCalled, false, 'Unauthenticated visitor should never reach admin panel');
    assert.strictEqual(response.status, 404);
  });

  test('unlocks /admin when valid secret key is provided and sets session cookie', async () => {
    let nextCalled = false;
    const context = {
      request: new Request('https://indiantimers.com/admin/?key=it_admin_secret_2027_k9x'),
      next: async () => { nextCalled = true; return new Response('ADMIN_PANEL', { status: 200 }); }
    };

    const response = await onRequest(context);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(response.status, 200);
    assert.match(response.headers.get('Set-Cookie'), /admin_session=active/);
  });
});

