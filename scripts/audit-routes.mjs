async function testUrls() {
  const urls = [
    'http://localhost:4321/',
    'http://localhost:4321/exams/',
    'http://localhost:4321/exams/medical/',
    'http://localhost:4321/exams/engineering/',
    'http://localhost:4321/exams/government/',
    'http://localhost:4321/exams/board-exams/',
    'http://localhost:4321/exams/law/',
    'http://localhost:4321/exams/management/',
    'http://localhost:4321/exams/other-entrance-exams/',
    'http://localhost:4321/exams/neet-ug-2027/',
    'http://localhost:4321/exams/jee-main-2027-session-1/',
    'http://localhost:4321/calendar/2027/',
    'http://localhost:4321/tools/pomodoro-timer/',
    'http://localhost:4321/tools/mock-test-timer/',
    'http://localhost:4321/tools/stopwatch/',
    'http://localhost:4321/tools/countdown/',
    'http://localhost:4321/tools/study-timer/',
    'http://localhost:4321/tools/countdown/embed/',
    'http://localhost:4321/countdown/',
    'http://localhost:4321/embed/countdown/',
    'http://localhost:4321/my-exams/',
    'http://localhost:4321/admin/',
    'http://localhost:4321/dashboard/',
    'http://localhost:4321/blog/',
    'http://localhost:4321/blog/exam-calendar-2027-india/',
    'http://localhost:4321/about/',
    'http://localhost:4321/contact/',
    'http://localhost:4321/editorial-policy/',
    'http://localhost:4321/privacy-policy/',
    'http://localhost:4321/terms/',
    'http://localhost:4321/robots.txt',
    'http://localhost:4321/sitemap.xml',
    'http://localhost:4321/llms.txt',
    'http://localhost:4321/llms-full.txt',
    'http://localhost:4321/manifest.json'
  ];

  console.log('--- AUDITING LIVE ROUTES ON PREVIEW SERVER ---');
  let failures = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      const text = await res.text();
      const titleMatch = text.match(/<title>(.*?)<\/title>/);
      const title = titleMatch ? titleMatch[1] : (url.endsWith('.txt') || url.endsWith('.xml') || url.endsWith('.json') ? '[Asset/XML/JSON]' : 'NO_TITLE');
      console.log(`[${res.status}] ${url.replace('http://localhost:4321', '') || '/'} | Title: ${title.substring(0, 48)} | Size: ${text.length}B`);
      if (res.status !== 200) failures++;
    } catch (e) {
      console.error(`FAILED: ${url}`, e.message);
      failures++;
    }
  }

  console.log(`\nAudit completed: ${urls.length - failures}/${urls.length} routes returned HTTP 200 OK.`);
  if (failures > 0) process.exit(1);
}

testUrls();
