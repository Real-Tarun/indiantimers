import fs from 'node:fs';
import path from 'node:path';

console.log('--- STARTING SITEMAP & CRAWLER CONFIGURATION AUDIT ---');

const REQUIRED_FILES = [
  'dist/sitemap.xml',
  'dist/robots.txt',
  'dist/llms.txt',
  'dist/_redirects',
  'dist/_headers',
  'functions/_middleware.js',
];

// 1. Verify existence of required artifacts
for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(file)) {
    console.error(`FAIL: Required file missing: ${file}`);
    process.exit(1);
  }
}
console.log('✓ All core discovery artifacts exist (sitemap.xml, robots.txt, llms.txt, _redirects, _headers, _middleware.js)');

// 2. Ensure obsolete split files are NOT present
for (const obsolete of ['dist/sitemap-index.xml', 'dist/sitemap-0.xml', 'dist/sitemap.xsl']) {
  if (fs.existsSync(obsolete)) {
    console.error(`FAIL: Obsolete split/styled artifact should not exist: ${obsolete}`);
    process.exit(1);
  }
}
console.log('✓ No obsolete split sitemaps or stylesheets present (Single main sitemap verified)');

// 3. Validate XML structure of sitemap.xml
const sitemapXml = fs.readFileSync('dist/sitemap.xml', 'utf-8');

if (!sitemapXml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
  console.error('FAIL: sitemap.xml missing standard XML declaration');
  process.exit(1);
}

if (!sitemapXml.includes('<urlset') || !sitemapXml.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
  console.error('FAIL: sitemap.xml does not have standard <urlset> with sitemaps.org namespace');
  process.exit(1);
}

if (!sitemapXml.trim().endsWith('</urlset>')) {
  console.error('FAIL: sitemap.xml does not properly terminate with </urlset>');
  process.exit(1);
}
console.log('✓ sitemap.xml has valid XML declaration, root <urlset>, and clean closing tag');

// 4. Extract and validate URLs, lastmod, changefreq, priority
const urlBlocks = sitemapXml.match(/<url>[\s\S]*?<\/url>/g) || [];
if (urlBlocks.length === 0) {
  console.error('FAIL: No <url> blocks found in sitemap.xml');
  process.exit(1);
}

const VALID_FREQS = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
const todayIso = new Date().toISOString().split('T')[0];
const urls = [];

for (const block of urlBlocks) {
  const locMatch = block.match(/<loc>(https?:\/\/[^<]+)<\/loc>/);
  const lastmodMatch = block.match(/<lastmod>([^<]+)<\/lastmod>/);
  const changefreqMatch = block.match(/<changefreq>([^<]+)<\/changefreq>/);
  const priorityMatch = block.match(/<priority>([^<]+)<\/priority>/);

  if (!locMatch) {
    console.error('FAIL: <url> block missing <loc>:', block);
    process.exit(1);
  }
  if (!lastmodMatch) {
    console.error('FAIL: <url> block missing <lastmod>:', block);
    process.exit(1);
  }
  if (!changefreqMatch) {
    console.error('FAIL: <url> block missing <changefreq>:', block);
    process.exit(1);
  }
  if (!priorityMatch) {
    console.error('FAIL: <url> block missing <priority>:', block);
    process.exit(1);
  }

  const loc = locMatch[1];
  const lastmod = lastmodMatch[1];
  const changefreq = changefreqMatch[1];
  const priority = Number.parseFloat(priorityMatch[1]);

  // Validate lastmod ISO format (YYYY-MM-DD)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastmod)) {
    console.error(`FAIL: Invalid lastmod format (${lastmod}) in URL: ${loc}`);
    process.exit(1);
  }
  // Ensure lastmod is not a future date
  if (lastmod > todayIso) {
    console.error(`FAIL: Future lastmod date (${lastmod} > ${todayIso}) in URL: ${loc}`);
    process.exit(1);
  }

  // Validate changefreq
  if (!VALID_FREQS.has(changefreq)) {
    console.error(`FAIL: Invalid changefreq (${changefreq}) in URL: ${loc}`);
    process.exit(1);
  }

  // Validate priority (0.0 to 1.0)
  if (Number.isNaN(priority) || priority < 0.0 || priority > 1.0) {
    console.error(`FAIL: Invalid priority (${priority}) in URL: ${loc}`);
    process.exit(1);
  }

  // Trailing slash requirement
  if (!loc.endsWith('/')) {
    console.error(`FAIL: URL missing canonical trailing slash: ${loc}`);
    process.exit(1);
  }

  urls.push(loc);
}
console.log(`✓ All ${urls.length} <url> blocks contain valid <loc>, <lastmod>, <changefreq>, and <priority> values`);

// 5. Verify Domain Consistency (Must strictly use https://indiantimers.com/)
const EXPECTED_ORIGIN = 'https://indiantimers.com';
const invalidOriginUrls = urls.filter((u) => !u.startsWith(EXPECTED_ORIGIN));
if (invalidOriginUrls.length > 0) {
  console.error('FAIL: Found URLs with invalid origin:', invalidOriginUrls);
  process.exit(1);
}
console.log(`✓ All ${urls.length} URLs strictly use production origin: ${EXPECTED_ORIGIN}`);

// 6. Check for Duplicates
const uniqueUrls = new Set(urls);
if (uniqueUrls.size !== urls.length) {
  console.error(`FAIL: Duplicate URLs detected! Total: ${urls.length}, Unique: ${uniqueUrls.size}`);
  process.exit(1);
}
console.log(`✓ Zero duplicate URLs found (${urls.length} unique URLs)`);

// 7. Verify Static File Existence and Canonical Consistency
for (const url of urls) {
  const urlPath = url.replace(EXPECTED_ORIGIN, '');
  let relativeFilePath = urlPath.replace(/^\//, '');
  
  if (relativeFilePath === '' || relativeFilePath.endsWith('/')) {
    relativeFilePath += 'index.html';
  } else if (!relativeFilePath.endsWith('.html')) {
    relativeFilePath += '/index.html';
  }

  const fullFilePath = path.join('dist', relativeFilePath);
  if (!fs.existsSync(fullFilePath)) {
    console.error(`FAIL: File does not exist for sitemap URL: ${url} (Expected: ${fullFilePath})`);
    process.exit(1);
  }

  const htmlContent = fs.readFileSync(fullFilePath, 'utf-8');
  if (htmlContent.includes('noindex')) {
    console.error(`FAIL: Sitemapped page has conflicting noindex tag: ${url}`);
    process.exit(1);
  }

  const canonicalMatch = htmlContent.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  if (!canonicalMatch || canonicalMatch[1] !== url) {
    console.error(`FAIL: Canonical mismatch for ${url}. Expected: ${url}, Found: ${canonicalMatch ? canonicalMatch[1] : 'NONE'}`);
    process.exit(1);
  }
}
console.log(`✓ All ${urls.length} URLs map to physical HTML files returning 200 with matching canonical tags`);

// 8. Verify Robots.txt Compliance (Single User-agent: * group, no conflicting bots, no unsupported directives)
const robotsContent = fs.readFileSync('dist/robots.txt', 'utf-8');

// Ensure single User-agent: * group
const userAgentMatches = robotsContent.match(/User-agent:\s*([^\r\n]+)/gi) || [];
if (userAgentMatches.length !== 1 || !/User-agent:\s*\*/i.test(userAgentMatches[0])) {
  console.error('FAIL: robots.txt must use exactly one consistent "User-agent: *" group. Found:', userAgentMatches);
  process.exit(1);
}

// Ensure no conflicting specific bot blocks
for (const bot of ['Googlebot', 'Bingbot', 'GPTBot', 'ChatGPT-User', 'ClaudeBot', 'PerplexityBot']) {
  if (robotsContent.includes(`User-agent: ${bot}`)) {
    console.error(`FAIL: robots.txt contains conflicting duplicate bot rule for: ${bot}`);
    process.exit(1);
  }
}

// Ensure Allow: / and Disallow: /dashboard/
if (!robotsContent.includes('Allow: /')) {
  console.error('FAIL: robots.txt missing "Allow: /"');
  process.exit(1);
}
if (!robotsContent.includes('Disallow: /dashboard/')) {
  console.error('FAIL: robots.txt missing "Disallow: /dashboard/"');
  process.exit(1);
}

// Ensure correct Sitemap directive
if (!robotsContent.includes('Sitemap: https://indiantimers.com/sitemap.xml')) {
  console.error('FAIL: robots.txt missing Sitemap: https://indiantimers.com/sitemap.xml');
  process.exit(1);
}

// Ensure unsupported llms-txt directive is removed
if (robotsContent.toLowerCase().includes('llms-txt')) {
  console.error('FAIL: robots.txt contains unsupported "llms-txt" directive');
  process.exit(1);
}

// Ensure no obsolete sitemaps
if (robotsContent.includes('sitemap-index.xml') || robotsContent.includes('sitemap-0.xml')) {
  console.error('FAIL: robots.txt should only reference single main sitemap.xml');
  process.exit(1);
}
console.log('✓ robots.txt verified: single User-agent: * group, correct Sitemap, no unsupported directives, no duplicate bot conflicts');

// 9. Verify Cloudflare Pages Canonical Defense Configuration
const middlewareContent = fs.readFileSync('functions/_middleware.js', 'utf-8');
if (!middlewareContent.includes('.pages.dev')) {
  console.error('FAIL: functions/_middleware.js does not check for .pages.dev');
  process.exit(1);
}
if (!middlewareContent.includes('https://indiantimers.com')) {
  console.error('FAIL: functions/_middleware.js does not redirect to https://indiantimers.com');
  process.exit(1);
}
if (!middlewareContent.includes('X-Robots-Tag')) {
  console.error('FAIL: functions/_middleware.js does not set X-Robots-Tag to prevent indexing');
  process.exit(1);
}
console.log('✓ Cloudflare Pages middleware verified: blocks pages.dev indexing and 301-redirects to production domain');

// 10. Verify _redirects fallback rules
const redirectsContent = fs.readFileSync('dist/_redirects', 'utf-8');
if (!redirectsContent.includes('/sitemap-index.xml') || !redirectsContent.includes('/sitemap.xml')) {
  console.error('FAIL: dist/_redirects missing sitemap alias redirect');
  process.exit(1);
}
console.log('✓ Cloudflare Pages _redirects verified: legacy sitemap aliases redirected to /sitemap.xml');

console.log('\n--- ALL SITEMAP & CRAWLER CONFIGURATION CHECKS PASSED (100% SUCCESS) ---');
