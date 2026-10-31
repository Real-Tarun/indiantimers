#!/usr/bin/env node
import fs from 'node:fs';

const HOST = 'indiantimers.com';
const KEY = '0b70112e844148169c3cf57adb1988fd';
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/indexnow';

async function submitIndexNow() {
  console.log('--- STARTING INDEXNOW API SUBMISSION ---');
  console.log(`Host: ${HOST}`);
  console.log(`Key: ${KEY}`);
  console.log(`Key Location: ${KEY_LOCATION}`);

  // Check if custom URLs were passed via command line
  const cliUrls = process.argv.slice(2).filter((arg) => arg.startsWith('http'));

  let urlList = [];
  if (cliUrls.length > 0) {
    urlList = cliUrls;
    console.log(`Submitting ${urlList.length} specified URL(s)...`);
  } else {
    // Read all URLs from sitemap.xml
    const sitemapPath = fs.existsSync('dist/sitemap.xml') ? 'dist/sitemap.xml' : 'public/sitemap.xml';
    if (!fs.existsSync(sitemapPath)) {
      console.error(`Sitemap not found at ${sitemapPath}. Run npm run build first.`);
      process.exit(1);
    }

    const sitemapContent = fs.readFileSync(sitemapPath, 'utf-8');
    const locMatches = sitemapContent.match(/<loc>(.*?)<\/loc>/g);
    if (!locMatches) {
      console.error('No <loc> tags found in sitemap.');
      process.exit(1);
    }

    urlList = locMatches.map((m) => m.replace(/<\/?loc>/g, '').trim());
    console.log(`Extracted ${urlList.length} canonical URLs from ${sitemapPath}`);
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urlList,
  };

  try {
    const response = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    console.log(`HTTP Status: ${response.status} ${response.statusText}`);

    if (response.status === 200 || response.status === 202) {
      console.log(`✓ Successfully submitted ${urlList.length} URLs to IndexNow!`);
      console.log('Bing, Yandex, and IndexNow participating search engines will crawl and index updated pages.');
    } else {
      const text = await response.text();
      console.warn(`IndexNow returned status ${response.status}: ${text}`);
    }
  } catch (err) {
    console.error('Failed to submit to IndexNow:', err.message);
  }
}

submitIndexNow();
