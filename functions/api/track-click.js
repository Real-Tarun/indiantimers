/**
 * Serverless Cloudflare Pages Function: /api/track-click
 * 
 * Ultra-lightweight, non-blocking telemetry endpoint for WhatsApp & Telegram channel clicks.
 * Safe for Cloudflare Free Tier (100,000 free function requests/day).
 * 0ms latency for students (invoked via navigator.sendBeacon).
 */

// Edge Worker in-memory counter (warm instance caching)
let edgeCache = {
  whatsappClicks: 0,
  telegramClicks: 0,
  uniqueUsers: 0,
};

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const channel = body.channel;
    const isUnique = !!body.isUnique;
    const placement = body.placement || 'general';

    if (channel === 'whatsapp') {
      edgeCache.whatsappClicks++;
      if (isUnique) edgeCache.uniqueUsers++;
    } else if (channel === 'telegram') {
      edgeCache.telegramClicks++;
      if (isUnique) edgeCache.uniqueUsers++;
    }

    // Optional Cloudflare KV persistence if bound in Pages Settings
    if (context.env?.COMMUNITY_KV) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const key = `clicks:${channel}:${today}`;
        const current = parseInt(await context.env.COMMUNITY_KV.get(key) || '0', 10);
        await context.env.COMMUNITY_KV.put(key, String(current + 1), { expirationTtl: 86400 * 90 });
      } catch (kvErr) {
        // Non-blocking fallback
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recorded: { channel, isUnique, placement },
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200, // Return 200 so beacon never causes client errors
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
