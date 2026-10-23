import { supportStore } from '../../../src/lib/support/store.ts';

/**
 * Protected Admin Endpoint: /api/admin/donations
 * 
 * Enforced by functions/api/admin/_middleware.js (Cloudflare Access / Bearer secret)
 * Allows editorial admins to view, verify, approve, and reject donor UTR submissions.
 */
export async function onRequestGet(context) {
  const adminEmail = context.data?.adminEmail || 'admin@indiantimers.com';

  // Hydrate from KV if available
  if (context.env?.COMMUNITY_KV) {
    try {
      const kv = context.env.COMMUNITY_KV;
      const [approvedRaw, pendingRaw] = await Promise.all([
        kv.get('donations:approved'),
        kv.get('donations:pending'),
      ]);

      let approvedList = null;
      let pendingList = null;

      if (approvedRaw) {
        try { approvedList = JSON.parse(approvedRaw); } catch {}
      }
      if (pendingRaw) {
        try { pendingList = JSON.parse(pendingRaw); } catch {}
      }

      if (approvedList || pendingList) {
        supportStore.hydrateFromKV(approvedList || [], pendingList || []);
      }
    } catch (kvErr) {
      console.error('KV reading error in /api/admin/donations:', kvErr);
    }
  }

  const adminData = supportStore.getAdminData();

  return new Response(
    JSON.stringify({
      authenticatedAs: adminEmail,
      ...adminData,
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, private',
      },
    }
  );
}

export async function onRequestPost(context) {
  const adminEmail = context.data?.adminEmail || 'admin@indiantimers.com';

  try {
    const body = await context.request.json();
    const { action, donationId, note } = body;

    if (!donationId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required donationId or action parameter.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve') {
      const ok = supportStore.approveDonation(donationId, adminEmail, note);
      if (!ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to approve donation. Record not found.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Sync to KV
      if (context.env?.COMMUNITY_KV) {
        try {
          const kv = context.env.COMMUNITY_KV;
          const adminData = supportStore.getAdminData();
          await Promise.all([
            kv.put('donations:approved', JSON.stringify(adminData.approved)),
            kv.put('donations:pending', JSON.stringify(adminData.pending)),
          ]);
        } catch (kvErr) {
          console.error('KV sync error on approve:', kvErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Donation successfully approved and published to the public leaderboard!',
          adminData: supportStore.getAdminData(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reject') {
      const ok = supportStore.rejectDonation(donationId, adminEmail, note);
      if (!ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to reject donation. Record not found.' }),
          { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Sync to KV
      if (context.env?.COMMUNITY_KV) {
        try {
          const kv = context.env.COMMUNITY_KV;
          const adminData = supportStore.getAdminData();
          await Promise.all([
            kv.put('donations:pending', JSON.stringify(adminData.pending)),
            kv.put('donations:rejected', JSON.stringify(adminData.rejected)),
          ]);
        } catch (kvErr) {
          console.error('KV sync error on reject:', kvErr);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Donation submission dismissed / rejected.',
          adminData: supportStore.getAdminData(),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: `Unknown action "${action}"` }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Server error: ${err instanceof Error ? err.message : String(err)}` }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
