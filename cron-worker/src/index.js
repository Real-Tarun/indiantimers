/**
 * Cloudflare Worker: indiantimers-cron
 * 
 * Executes Telegram Exam Broadcasts & Quizzes on natural, human schedules (~every 2.5 hours)
 * across the day, fully powered by Gemini AI with zero pre-saved or repeating messages.
 */

const ADMIN_SECRET = 'it_admin_secret_2027_k9x';
const BROADCAST_ENDPOINT = 'https://indiantimers.com/api/admin/bot-broadcast?key=' + ADMIN_SECRET;

function getActionForCurrentTime() {
  // Current time in Indian Standard Time (IST: UTC + 5:30)
  const now = new Date();
  const utcMs = now.getTime() + (now.getTimezoneOffset() * 60000);
  const istTime = new Date(utcMs + (5.5 * 3600000));
  const hour = istTime.getHours();

  if (hour >= 6 && hour <= 8) {
    return 'morning';     // 07:48 AM IST: Morning Radar & Dynamic Mindset
  } else if (hour >= 9 && hour <= 11) {
    return 'trick';       // 10:12 AM IST: Desi Mnemonic & Shortcut Trick
  } else if (hour >= 12 && hour <= 13) {
    return 'quiz';        // 12:48 PM IST: Midday Interactive Quiz Poll #1
  } else if (hour >= 14 && hour <= 16) {
    return 'slump';       // 03:12 PM IST: Afternoon Slump Breaker & Study Hack
  } else if (hour >= 17 && hour <= 18) {
    return 'quiz';        // 05:48 PM IST: Evening Interactive Quiz Poll #2
  } else if (hour >= 19 && hour <= 20) {
    return 'strategy';    // 08:12 PM IST: High-Yield PYQ Trend / Strategy Factoid
  } else {
    return 'poll';        // 10:12 PM IST: Daily Study Hours Accountability Poll
  }
}

async function triggerBroadcast(action) {
  console.log(`[Cron Trigger] Executing action: ${action}`);
  const res = await fetch(BROADCAST_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  const data = await res.json();
  console.log(`[Cron Trigger Result]`, data);
  return data;
}

export default {
  // 1. Scheduled Cloudflare Cron Trigger (Runs 7x daily)
  async scheduled(event, env, ctx) {
    const action = getActionForCurrentTime();
    ctx.waitUntil(triggerBroadcast(action));
  },

  // 2. HTTP Request Handler (For manual testing, monitoring or pingers)
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const actionParam = url.searchParams.get('action');
    const action = actionParam || getActionForCurrentTime();

    try {
      const result = await triggerBroadcast(action);
      return new Response(JSON.stringify({
        success: true,
        triggeredAction: action,
        cronSchedule: 'Active (7 natural broadcasts/day via Cloudflare Edge)',
        result,
      }, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ success: false, error: err.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
