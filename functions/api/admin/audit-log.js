import { adminStore } from '../../../src/lib/monitor/store.ts';

export async function onRequestGet(context) {
  const auditLogs = adminStore.getAuditLogs();

  return new Response(
    JSON.stringify({
      auditLogs,
      totalCount: auditLogs.length,
      retrievedAt: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
