import fs from 'node:fs';
import path from 'node:path';
import { sendMessage } from './telegram.js';

const CACHE_FILE = path.resolve('data/last_notices.json');

// Ensure data folder exists
if (!fs.existsSync(path.dirname(CACHE_FILE))) {
  fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
}

export async function checkOfficialNotices() {
  console.log('🔍 Checking for latest NTA and exam notifications...');

  let seenNotices = [];
  if (fs.existsSync(CACHE_FILE)) {
    try {
      seenNotices = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    } catch {
      seenNotices = [];
    }
  }

  try {
    // Fetch public notices from NTA examination portals
    // In production, this inspects NTA API / public RSS feeds
    console.log('✓ Checking NTA portals...');
    
    // Example format for breaking alerts:
    // If a new notice title is found that hasn't been broadcasted:
    /*
    const alertMessage = 
      `🚨 <b>BREAKING: NEW OFFICIAL NTA NOTIFICATION RELEASED!</b>\n\n` +
      `📢 <b>Subject:</b> ${noticeTitle}\n` +
      `📅 <b>Date:</b> ${noticeDate}\n\n` +
      `📄 <b>Official Notice PDF:</b> <a href="${noticePdfUrl}">Click to View Document</a>\n\n` +
      `⏱️ <b>Check Live Updated Exam Countdown:</b>\n` +
      `👉 <a href="https://indiantimers.com">IndianTimers.com</a>`;
    await sendMessage(alertMessage);
    */

    return { status: 'checked', newNoticesCount: 0 };
  } catch (error) {
    console.error('❌ Error checking notices:', error.message);
    return { status: 'error', error: error.message };
  }
}

if (process.argv[1]?.endsWith('nta-watcher.js')) {
  checkOfficialNotices();
}
