/**
 * Bot Control & Remote Kill-Switch Module
 * Checks IndianTimers Admin Dashboard API to respect Admin ON / OFF toggle.
 */

export async function isBotEnabled() {
  try {
    const adminKey = process.env.ADMIN_SECRET_KEY || 'it_admin_secret_2027_k9x';
    const res = await fetch(`https://indiantimers.com/api/admin/bot-status?key=${adminKey}`, {
      headers: { 'Cache-Control': 'no-cache' },
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.enabled === false) {
        return false;
      }
    }
  } catch (err) {
    // Fail-safe: If API is unreachable, default to enabled
  }
  return true;
}
