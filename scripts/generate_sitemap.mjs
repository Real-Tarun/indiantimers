import fs from 'node:fs';
import path from 'node:path';
import { EXAM_REGISTRY } from '../src/data/exams.ts';
import { BLOG_POSTS } from '../src/data/blog.ts';

const siteUrl = 'https://indiantimers.com';
const today = new Date().toISOString().split('T')[0];

function formatUrlBlock(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- 1. Homepage & Primary Calendars -->
${formatUrlBlock(`${siteUrl}/`, today, 'daily', '1.0')}
${formatUrlBlock(`${siteUrl}/exams/`, today, 'daily', '0.9')}
${formatUrlBlock(`${siteUrl}/calendar/2027/`, today, 'weekly', '0.9')}

  <!-- 2. Interactive Study & Focus Tools -->
${formatUrlBlock(`${siteUrl}/tools/pomodoro-timer/`, today, 'weekly', '0.9')}
${formatUrlBlock(`${siteUrl}/tools/mock-test-timer/`, today, 'weekly', '0.9')}
${formatUrlBlock(`${siteUrl}/tools/stopwatch/`, today, 'monthly', '0.8')}
${formatUrlBlock(`${siteUrl}/tools/countdown/`, today, 'monthly', '0.8')}
${formatUrlBlock(`${siteUrl}/tools/study-timer/`, today, 'monthly', '0.8')}

  <!-- 3. Examination Category Hubs -->
${formatUrlBlock(`${siteUrl}/exams/medical/`, today, 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/engineering/`, today, 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/government/`, today, 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/board-exams/`, today, 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/law/`, today, 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/management/`, today, 'weekly', '0.8')}
${formatUrlBlock(`${siteUrl}/exams/other-entrance-exams/`, today, 'weekly', '0.8')}

  <!-- 4. Audited Live Examination Countdowns (${EXAM_REGISTRY.length} Exams) -->
`;

for (const exam of EXAM_REGISTRY) {
  const lastmod = exam.lastVerified || today;
  const changefreq = exam.isFeatured ? 'daily' : 'weekly';
  const priority = exam.isFeatured ? '0.85' : '0.75';
  xml += `${formatUrlBlock(`${siteUrl}/exams/${exam.slug}/`, lastmod, changefreq, priority)}\n`;
}

xml += `\n  <!-- 5. Editorial Analysis & Preparation Guides (${BLOG_POSTS.length + 1} Guides) -->\n`;
xml += `${formatUrlBlock(`${siteUrl}/blog/`, today, 'weekly', '0.8')}\n`;
for (const post of BLOG_POSTS) {
  const lastmod = post.updatedDate || post.publishDate || today;
  xml += `${formatUrlBlock(`${siteUrl}/blog/${post.slug}/`, lastmod, 'monthly', '0.7')}\n`;
}

xml += `\n  <!-- 6. Trust, Editorial Policy & Transparency -->
${formatUrlBlock(`${siteUrl}/about/`, today, 'monthly', '0.5')}
${formatUrlBlock(`${siteUrl}/editorial-policy/`, today, 'monthly', '0.5')}
${formatUrlBlock(`${siteUrl}/contact/`, today, 'monthly', '0.5')}
${formatUrlBlock(`${siteUrl}/privacy-policy/`, today, 'yearly', '0.3')}
${formatUrlBlock(`${siteUrl}/terms/`, today, 'yearly', '0.3')}
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

// Clean up old index/sub-sitemaps and XSL so only the clean sitemap.xml exists
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

console.log('Successfully generated clean sitemap.xml in exact requested format!');
