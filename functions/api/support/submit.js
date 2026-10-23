import { supportStore } from '../../../src/lib/support/store.ts';

/**
 * Public Endpoint: POST /api/support/submit
 * 
 * Accepts donation UTR verification requests from users.
 * Persists to Cloudflare KV if bound, else updates in-memory supportStore.
 */
export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const { name, amount, utr, email, phone, message, isAnonymous } = body;

    // Validate inputs via supportStore
    const result = supportStore.submitDonation({
      name,
      amount: Number(amount),
      utr,
      email,
      phone,
      message,
      isAnonymous: Boolean(isAnonymous),
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const record = result.record;

    // If Cloudflare KV is bound, write to pending list
    if (context.env?.COMMUNITY_KV) {
      try {
        const kv = context.env.COMMUNITY_KV;
        const pendingRaw = await kv.get('donations:pending');
        let pendingList = [];
        if (pendingRaw) {
          try { pendingList = JSON.parse(pendingRaw); } catch {}
        }
        pendingList.unshift(record);
        await kv.put('donations:pending', JSON.stringify(pendingList));
        // Index by UTR
        await kv.put(`donation:utr:${record.utr.toLowerCase()}`, record.id, { expirationTtl: 86400 * 180 });
      } catch (kvErr) {
        console.error('KV write error in /api/support/submit:', kvErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Your contribution details have been submitted for verification. Thank you! Leaderboard updates every 12 hours.',
        record: {
          id: record.id,
          name: record.name,
          amount: record.amount,
          utr: record.utr,
          status: record.status,
          createdAt: record.createdAt,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Submission failed: ${err instanceof Error ? err.message : String(err)}`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
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
