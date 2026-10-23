import { supportStore } from '../../../src/lib/support/store.ts';

/**
 * Public Endpoint: GET /api/support/leaderboard
 * 
 * Returns the public hall of fame, top 5 champions, and verified supporters list.
 */
export async function onRequestGet(context) {
  // Check if Cloudflare KV is bound and populated
  if (context.env?.COMMUNITY_KV) {
    try {
      const kv = context.env.COMMUNITY_KV;
      const approvedRaw = await kv.get('donations:approved');
      if (approvedRaw) {
        try {
          const approvedList = JSON.parse(approvedRaw);
          if (Array.isArray(approvedList) && approvedList.length > 0) {
            supportStore.hydrateFromKV(approvedList, []);
          }
        } catch {}
      }
    } catch (kvErr) {
      console.error('KV reading error in /api/support/leaderboard:', kvErr);
    }
  }

  const leaderboard = supportStore.getLeaderboard();

  return new Response(JSON.stringify(leaderboard), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
