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
  placements: {},
  recentClicks: [],
};

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const channel = body.channel === 'whatsapp' ? 'whatsapp' : (body.channel === 'telegram' ? 'telegram' : null);
    if (!channel) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid channel' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const isUnique = !!body.isUnique;
    const placement = typeof body.placement === 'string' && body.placement ? body.placement.slice(0, 50) : 'general';
    const page = typeof body.page === 'string' && body.page ? body.page.slice(0, 100) : '/';
    const nowIso = new Date().toISOString();

    if (channel === 'whatsapp') {
      edgeCache.whatsappClicks++;
      if (isUnique) edgeCache.uniqueUsers++;
    } else if (channel === 'telegram') {
      edgeCache.telegramClicks++;
      if (isUnique) edgeCache.uniqueUsers++;
    }

    const placeKey = `${channel}:${placement}`;
    edgeCache.placements[placeKey] = (edgeCache.placements[placeKey] || 0) + 1;

    const clickRecord = {
      id: 'clk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      channel,
      placement,
      page,
      isUnique,
      timestamp: nowIso,
    };

    edgeCache.recentClicks.unshift(clickRecord);
    if (edgeCache.recentClicks.length > 50) {
      edgeCache.recentClicks.pop();
    }

    // Cloudflare KV persistence if bound in Pages Settings or wrangler.toml
    if (context.env?.COMMUNITY_KV) {
      try {
        const today = nowIso.split('T')[0];
        const dayKey = `clicks:${channel}:${today}`;
        const totalKey = `stats:total:${channel}`;
        const uniqueKey = `stats:unique:${channel}`;
        const placeKvKey = `stats:place:${channel}:${placement}`;

        const promises = [
          (async () => {
            const curDay = parseInt(await context.env.COMMUNITY_KV.get(dayKey) || '0', 10);
            await context.env.COMMUNITY_KV.put(dayKey, String(curDay + 1), { expirationTtl: 86400 * 90 });
          })(),
          (async () => {
            const curTot = parseInt(await context.env.COMMUNITY_KV.get(totalKey) || '0', 10);
            await context.env.COMMUNITY_KV.put(totalKey, String(curTot + 1));
          })(),
          (async () => {
            const curPlc = parseInt(await context.env.COMMUNITY_KV.get(placeKvKey) || '0', 10);
            await context.env.COMMUNITY_KV.put(placeKvKey, String(curPlc + 1));
          })(),
        ];

        if (isUnique) {
          promises.push((async () => {
            const curUniq = parseInt(await context.env.COMMUNITY_KV.get(uniqueKey) || '0', 10);
            await context.env.COMMUNITY_KV.put(uniqueKey, String(curUniq + 1));
          })());
        }

        promises.push((async () => {
          let recents = [];
          try {
            const raw = await context.env.COMMUNITY_KV.get('stats:recent_clicks');
            if (raw) recents = JSON.parse(raw);
          } catch {}
          recents.unshift(clickRecord);
          if (recents.length > 30) recents = recents.slice(0, 30);
          await context.env.COMMUNITY_KV.put('stats:recent_clicks', JSON.stringify(recents), { expirationTtl: 86400 * 30 });
        })());

        await Promise.allSettled(promises);
      } catch (kvErr) {
        // Non-blocking fallback
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        recorded: { channel, isUnique, placement, page },
        timestamp: nowIso,
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
