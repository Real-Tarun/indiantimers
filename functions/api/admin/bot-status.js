/**
 * Admin API Endpoint: /api/admin/bot-status
 * 
 * Provides global ON / OFF toggle controller for the automated Telegram Bot.
 * Allows Admin to pause or resume automated morning countdowns, quizzes, and study polls.
 */

// In-memory fallback if KV is temporarily unbound
let inMemoryBotStatus = {
  enabled: true,
  updatedAt: new Date().toISOString(),
};

export async function onRequestGet(context) {
  let status = { ...inMemoryBotStatus };

  if (context.env?.COMMUNITY_KV) {
    try {
      const raw = await context.env.COMMUNITY_KV.get('stats:bot_status');
      if (raw) {
        status = JSON.parse(raw);
      }
    } catch (err) {
      console.warn('Error reading bot_status from KV:', err.message);
    }
  }

  return new Response(JSON.stringify(status), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store, private',
    },
  });
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const enabled = typeof body.enabled === 'boolean' ? body.enabled : true;
    const nowIso = new Date().toISOString();

    const newStatus = {
      enabled,
      updatedAt: nowIso,
      toggledBy: context.data?.adminEmail || 'admin',
    };

    inMemoryBotStatus = newStatus;

    if (context.env?.COMMUNITY_KV) {
      try {
        await context.env.COMMUNITY_KV.put('stats:bot_status', JSON.stringify(newStatus));
      } catch (kvErr) {
        console.warn('Error saving bot_status to KV:', kvErr.message);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...newStatus,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, private',
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
