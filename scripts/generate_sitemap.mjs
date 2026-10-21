import fs from 'node:fs';
import path from 'node:path';
import { EXAM_REGISTRY } from '../src/data/exams.ts';
import { BLOG_POSTS } from '../src/data/blog.ts';

const siteUrl = 'https://indiantimers.com';

function formatUrlBlock(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

// 1. Calculate accurate dynamic lastmod values based on verified data timestamps
const indexableExams = EXAM_REGISTRY.filter((e) => e.isIndexable !== false);

const allExamDates = indexableExams.map((e) => e.lastVerified).filter(Boolean);
const latestExamDate = allExamDates.slice().sort().reverse()[0] || '2026-10-19';

const allBlogDates = BLOG_POSTS.map((p) => p.updatedDate || p.publishDate).filter(Boolean);
const latestBlogDate = allBlogDates.slice().sort().reverse()[0] || '2026-10-19';

const latestGlobalUpdate = [latestExamDate, latestBlogDate].sort().reverse()[0];

// Category lastmod = latest verified date of exams in that category
function getCategoryLastmod(catId) {
  const catExams = indexableExams.filter((e) => e.category === catId);
  const catDates = catExams.map((e) => e.lastVerified).filter(Boolean);
  return catDates.slice().sort().reverse()[0] || latestExamDate;
}

// 2027 calendar lastmod = latest verified date among 2027 exams
const exams2027 = indexableExams.filter((e) => e.year === 2027);
const calendarLastmod = exams2027.map((e) => e.lastVerified).filter(Boolean).slice().sort().reverse()[0] || latestExamDate;

// Verified release/audit dates for tools & static policy pages
const toolsLastmod = '2026-10-18';
const trustLastmod = '2026-10-15';
const legalLastmod = '2026-10-12';

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 1. Homepage & Primary Calendars -->
${formatUrlBlock(`${siteUrl}/`, latestGlobalUpdate, 'daily', '1.0')}
${formatUrlBlock(`${siteUrl}/exams/`, latestExamDate, 'daily', '0.9')}
${formatUrlBlock(`${siteUrl}/calendar/2027/`, calendarLastmod, 'weekly', '0.9')}
${formatUrlBlock(`${siteUrl}/my-exams/`, toolsLastmod, 'weekly', '0.9')}

  <!-- 2. Interactive Study & Focus Tools -->
${formatUrlBlock(`${siteUrl}/tools/mock-test-timer/`, toolsLastmod, 'weekly', '0.9')}
${formatUrlBlock(`${siteUrl}/tools/pomodoro-timer/`, toolsLastmod, 'weekly', '0.9')}
${formatUrlBlock(`${siteUrl}/tools/countdown/embed/`, toolsLastmod, 'weekly', '0.9')}
${formatUrlBlock(`${siteUrl}/countdown/`, toolsLastmod, 'weekly', '0.85')}
${formatUrlBlock(`${siteUrl}/tools/stopwatch/`, toolsLastmod, 'monthly', '0.8')}
${formatUrlBlock(`${siteUrl}/tools/countdown/`, toolsLastmod, 'monthly', '0.8')}
${formatUrlBlock(`${siteUrl}/tools/study-timer/`, toolsLastmod, 'monthly', '0.8')}

  <!-- 3. Examination Category Hubs -->
${formatUrlBlock(`${siteUrl}/exams/medical/`, getCategoryLastmod('medical'), 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/engineering/`, getCategoryLastmod('engineering'), 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/government/`, getCategoryLastmod('government'), 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/board-exams/`, getCategoryLastmod('board-exams'), 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/law/`, getCategoryLastmod('law'), 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/management/`, getCategoryLastmod('management'), 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/other-entrance-exams/`, getCategoryLastmod('other-entrance-exams'), 'weekly', '0.8')}

  <!-- 4. Audited Live Examination Countdowns (${indexableExams.length} Exams) -->
`;

for (const exam of indexableExams) {
  const lastmod = exam.lastVerified || latestExamDate;
  const changefreq = exam.isFeatured ? 'daily' : 'weekly';
  const priority = exam.isFeatured ? '0.85' : '0.75';
  xml += `${formatUrlBlock(`${siteUrl}/exams/${exam.slug}/`, lastmod, changefreq, priority)}\n`;
}

xml += `\n  <!-- 5. Editorial Analysis & Preparation Guides (${BLOG_POSTS.length} Guides) -->\n`;
xml += `${formatUrlBlock(`${siteUrl}/blog/`, latestBlogDate, 'weekly', '0.8')}\n`;
for (const post of BLOG_POSTS) {
  const lastmod = post.updatedDate || post.publishDate || latestBlogDate;
  xml += `${formatUrlBlock(`${siteUrl}/blog/${post.slug}/`, lastmod, 'monthly', '0.7')}\n`;
}

xml += `\n  <!-- 6. Trust, Editorial Policy & Transparency -->
${formatUrlBlock(`${siteUrl}/about/`, trustLastmod, 'monthly', '0.5')}
${formatUrlBlock(`${siteUrl}/editorial-policy/`, trustLastmod, 'monthly', '0.5')}
${formatUrlBlock(`${siteUrl}/contact/`, trustLastmod, 'monthly', '0.5')}
${formatUrlBlock(`${siteUrl}/privacy-policy/`, legalLastmod, 'yearly', '0.3')}
${formatUrlBlock(`${siteUrl}/terms/`, legalLastmod, 'yearly', '0.3')}
</urlset>
`;

// Write to public/sitemap.xml
fs.writeFileSync('public/sitemap.xml', xml, 'utf-8');
console.log('✓ Created public/sitemap.xml');

// If dist exists, write to dist/sitemap.xml as well
if (fs.existsSync('dist')) {
  fs.writeFileSync('dist/sitemap.xml', xml, 'utf-8');
  console.log('✓ Created dist/sitemap.xml');
}

// Clean up obsolete index/sub-sitemaps and XSL so only the clean sitemap.xml exists
for (const cleanupFile of [
  'public/sitemap-index.xml',
  'public/sitemap-0.xml',
  'public/sitemap.xsl',
  'dist/sitemap-index.xml',
  'dist/sitemap-0.xml',
  'dist/sitemap.xsl',
]) {
  if (fs.existsSync(cleanupFile)) {
    fs.unlinkSync(cleanupFile);
    console.log(`Removed obsolete ${cleanupFile}`);
  }
}

console.log('Successfully generated clean sitemap.xml with accurate lastmod values!');
