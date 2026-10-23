/**
 * Bot Control & Remote Kill-Switch Module
 * Checks IndianTimers Admin Dashboard API to respect Master and Individual Schedule toggles.
 */

export async function isBotEnabled(type = '') {
  try {
    const adminKey = process.env.ADMIN_SECRET_KEY || 'it_admin_secret_2027_k9x';
    const res = await fetch(`https://indiantimers.com/api/admin/bot-status?key=${adminKey}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data) {
        if (data.enabled === false) return false;
        if (type === 'morning' && data.morningEnabled === false) return false;
        if (type === 'quiz' && data.quizEnabled === false) return false;
        if (type === 'evening' && data.eveningEnabled === false) return false;
      }
    }
  } catch (err) {
    // Fail-safe: If API is unreachable, default to enabled
  }
  return true;
}
