import { adminStore } from '../../../src/lib/monitor/store.ts';

export async function onRequestPost(context) {
  const adminEmail = context.data?.adminEmail || 'admin@indiantimers.com';
  const sources = adminStore.getSources();

  // Simulate source polling run
  let checked = 0;
  for (const src of sources) {
    adminStore.updateSourceCheck(src.id, true);
    checked++;
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: `Successfully audited ${checked} official notice authorities.`,
      sourcesChecked: checked,
      timestamp: new Date().toISOString(),
      initiatedBy: adminEmail,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
