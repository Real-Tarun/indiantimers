/**
 * Protected Admin Endpoint: /api/admin/clicks
 * 
 * Returns aggregated click statistics for WhatsApp and Telegram community links.
 * Guarded by Admin Security Middleware (requires active session cookie or bearer token).
 */

export async function onRequestGet(context) {
  let stats = {
    whatsapp: {
      totalClicks: 0,
      uniqueUsers: 0,
    },
    telegram: {
      totalClicks: 0,
      uniqueUsers: 0,
    },
    kvEnabled: !!context.env?.COMMUNITY_KV,
    lastQueried: new Date().toISOString(),
  };

  // If KV is bound, fetch daily counts for last 7 days
  if (context.env?.COMMUNITY_KV) {
    try {
      const today = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];

        const waCount = parseInt(await context.env.COMMUNITY_KV.get(`clicks:whatsapp:${dateStr}`) || '0', 10);
        const tgCount = parseInt(await context.env.COMMUNITY_KV.get(`clicks:telegram:${dateStr}`) || '0', 10);

        stats.whatsapp.totalClicks += waCount;
        stats.telegram.totalClicks += tgCount;
      }
    } catch {
      // Non-blocking fallback
    }
  }

  return new Response(JSON.stringify(stats), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, private',
    },
  });
}
