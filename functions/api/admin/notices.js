import { adminStore } from '../../../src/lib/monitor/store.ts';

export async function onRequestGet(context) {
  const adminEmail = context.data?.adminEmail || 'admin@indiantimers.com';
  const notices = adminStore.getAllNotices();
  const sources = adminStore.getSources();

  return new Response(
    JSON.stringify({
      authenticatedAs: adminEmail,
      notices,
      sources,
      counts: {
        total: notices.length,
        pending: notices.filter((n) => n.status === 'pending_review').length,
        approved: notices.filter((n) => n.status === 'approved').length,
        rejected: notices.filter((n) => n.status === 'rejected').length,
      },
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

export async function onRequestPost(context) {
  const adminEmail = context.data?.adminEmail || 'admin@indiantimers.com';

  try {
    const body = await context.request.json();
    const { action, noticeId, overrides, comment } = body;

    if (!noticeId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing noticeId or action parameter.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'approve' || action === 'edit_and_approve') {
      const result = adminStore.applyApproval(noticeId, adminEmail, overrides);
      if (!result.success) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Notice approved and examination record successfully updated.',
          auditEntry: result.auditEntry,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'reject' || action === 'ignore') {
      const ok = adminStore.rejectNotice(noticeId, adminEmail, comment);
      if (!ok) {
        return new Response(
          JSON.stringify({ error: 'Failed to reject notice. ID may not exist.' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, message: 'Notice dismissed.' }),
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
