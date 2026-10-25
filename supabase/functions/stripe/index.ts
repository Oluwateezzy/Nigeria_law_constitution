import {
  rowsFromStripeEvent,
  type EntitlementRow,
} from '../../../packages/domain/src/entitlement.ts';

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ code: 'unauthorized' }, 405);
  const secret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const body = await request.text();
  if (
    !secret ||
    !(await stripeSignatureOk(
      secret,
      request.headers.get('stripe-signature'),
      body,
    ))
  ) {
    return json({ code: 'unauthorized' }, 401);
  }
  let event: unknown;
  try {
    event = JSON.parse(body);
  } catch {
    return json({ code: 'unauthorized' }, 400);
  }
  const env = serviceEnv();
  if (!env) return json({ code: 'unavailable' }, 503);
  const update = rowsFromStripeEvent(event, new Date());
  for (const row of update.rows) await upsertEntitlement(env, row);
  if (update.expireCustomer) {
    await expireCustomer(
      env,
      update.expireCustomer,
      update.rows[0]?.expires_at ?? new Date().toISOString(),
    );
  }
  return json({ received: true }, 200);
});

async function stripeSignatureOk(
  secret: string,
  header: string | null,
  body: string,
): Promise<boolean> {
  if (!header) return false;
  const fields = new Map(
    header.split(',').map((part) => {
      const [key, value] = part.split('=');
      return [key ?? '', value ?? ''] as const;
    }),
  );
  const timestamp = fields.get('t');
  const signature = fields.get('v1');
  if (!timestamp || !signature) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  const hex = [...new Uint8Array(mac)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  return hex.length === signature.length && hex === signature;
}

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
      ...serviceHeaders(env.service),
      'content-type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify(row),
  });
}

async function expireCustomer(
  env: { url: string; service: string },
  customer: string,
  expiresAt: string,
): Promise<void> {
  await fetch(
    `${env.url}/rest/v1/entitlements?provider_customer=eq.${encodeURIComponent(customer)}`,
    {
      method: 'PATCH',
      headers: {
        ...serviceHeaders(env.service),
        'content-type': 'application/json',
      },
      body: JSON.stringify({ expires_at: expiresAt }),
    },
  );
}

function serviceHeaders(service: string): Record<string, string> {
  return { apikey: service, Authorization: `Bearer ${service}` };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
