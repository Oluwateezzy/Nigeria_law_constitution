import {
  rowsFromRevenueCatEvent,
  type EntitlementRow,
} from '../../../packages/domain/src/entitlement.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ code: 'unauthorized' }, 405);
  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  const header = request.headers.get('Authorization') ?? '';
  if (!secret || (header !== `Bearer ${secret}` && header !== secret)) {
    return json({ code: 'unauthorized' }, 401);
  }
  let event: unknown;
  try {
    event = await request.json();
  } catch {
    return json({ code: 'unauthorized' }, 400);
  }
  const env = serviceEnv();
  if (!env) return json({ code: 'unavailable' }, 503);
  const update = rowsFromRevenueCatEvent(event, new Date());
  for (const row of update.rows) await upsertEntitlement(env, row);
  return json({ received: true }, 200);
});

function serviceEnv(): { url: string; service: string } | null {
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !service) return null;
  return { url, service };
}

async function upsertEntitlement(
  env: { url: string; service: string },
  row: EntitlementRow,
): Promise<void> {
  await fetch(`${env.url}/rest/v1/entitlements`, {
    method: 'POST',
    headers: {
      apikey: env.service,
      Authorization: `Bearer ${env.service}`,
      'content-type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(row),
  });
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
