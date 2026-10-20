import fs from 'node:fs';
import path from 'node:path';

console.log('--- STARTING SITEMAP VALIDATION AUDIT ---');

const REQUIRED_FILES = [
  'dist/sitemap.xml',
  'dist/robots.txt',
  'dist/llms.txt',
];

// 1. Verify existence of required artifacts
for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(file)) {
    console.error(`FAIL: Required file missing: ${file}`);
    process.exit(1);
  }
}
console.log('✓ All core discovery artifacts exist in dist/ (sitemap.xml, robots.txt, llms.txt)');

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

  urls.push(locMatch[1]);
}
console.log(`✓ All ${urls.length} <url> blocks contain valid <loc>, <lastmod>, <changefreq>, and <priority> tags`);

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
    console.error(`FAIL: Page has noindex tag: ${url}`);
    process.exit(1);
  }

  const canonicalMatch = htmlContent.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  if (!canonicalMatch || canonicalMatch[1] !== url) {
    console.error(`FAIL: Canonical mismatch for ${url}`);
    process.exit(1);
  }
}
console.log(`✓ All ${urls.length} URLs map to physical HTML files with matching canonical tags`);

// 8. Verify Robots.txt Single Main URLs
const robotsContent = fs.readFileSync('dist/robots.txt', 'utf-8');
if (!robotsContent.includes('Sitemap: https://indiantimers.com/sitemap.xml')) {
  console.error('FAIL: robots.txt missing Sitemap: https://indiantimers.com/sitemap.xml');
  process.exit(1);
}
if (!robotsContent.includes('llms-txt: https://indiantimers.com/llms.txt')) {
  console.error('FAIL: robots.txt missing llms-txt: https://indiantimers.com/llms.txt');
  process.exit(1);
}
if (robotsContent.includes('sitemap-index.xml') || robotsContent.includes('sitemap-0.xml')) {
  console.error('FAIL: robots.txt should only reference single main sitemap.xml');
  process.exit(1);
}
console.log('✓ robots.txt correctly references single main default URLs for Sitemap and LLMs');

console.log('\n--- ALL SITEMAP VALIDATION AUDIT CHECKS PASSED (100% SUCCESS) ---');
