import { plusOffer } from '../../../packages/domain/src/entitlement.ts';

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (request) => {
  if (request.method !== 'POST') return json({ code: 'unavailable' }, 405);
  let body: { action?: string; installId?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json({ code: 'unavailable' }, 400);
  }
  const installId = body.installId ?? '';
  if (!uuidPattern.test(installId)) return json({ code: 'unavailable' }, 400);
  const env = serviceEnv();
  if (!env) return json({ code: 'unavailable' }, 503);
  const userId = await signedInUser(request, env);
  if (body.action === 'checkout')
    return checkout(request, env, installId, userId);
  if (body.action === 'portal') return portal(request, env, installId, userId);
  if (body.action === 'alias') return alias(env, installId, userId);
  return json({ code: 'unavailable' }, 400);
});

async function checkout(
  request: Request,
  env: ServiceEnv,
  installId: string,
  userId: string | null,
): Promise<Response> {
  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  const price = Deno.env.get('STRIPE_PLUS_PRICE_ID');
  if (!secret || !price) return json({ code: 'unavailable' }, 503);
  const origin = request.headers.get('origin') ?? 'http://localhost:8081';
  const form = new URLSearchParams();
  form.set('mode', 'subscription');
  form.set('line_items[0][price]', price);
  form.set('line_items[0][quantity]', '1');
  form.set('client_reference_id', installId);
  form.set('metadata[install_id]', installId);
  form.set('subscription_data[metadata][install_id]', installId);
  if (userId) {
    form.set('metadata[user_id]', userId);
    form.set('subscription_data[metadata][user_id]', userId);
  }
  form.set('success_url', `${origin}/settings/ai`);
  form.set('cancel_url', `${origin}/settings/plus`);
  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'content-type': 'application/x-www-form-urlencoded',
    },
    body: form,
  });
  if (!response.ok) return json({ code: 'unavailable' }, 502);
  const payload = (await response.json()) as { url?: string };
  if (!payload.url) return json({ code: 'unavailable' }, 502);
  return json({ url: payload.url, price: plusOffer.display }, 200);
}

async function portal(
  request: Request,
  env: ServiceEnv,
  installId: string,
  userId: string | null,
): Promise<Response> {
  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secret) return json({ code: 'unavailable' }, 503);
  const customer = await customerFor(env, installId, userId);
  if (!customer) return json({ code: 'unavailable' }, 404);
  const origin = request.headers.get('origin') ?? 'http://localhost:8081';
  const form = new URLSearchParams();
  form.set('customer', customer);
  form.set('return_url', `${origin}/settings/ai`);
  const response = await fetch(
    'https://api.stripe.com/v1/billing_portal/sessions',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'content-type': 'application/x-www-form-urlencoded',
      },
      body: form,
    },
  );
  if (!response.ok) return json({ code: 'unavailable' }, 502);
  const payload = (await response.json()) as { url?: string };
  if (!payload.url) return json({ code: 'unavailable' }, 502);
  return json({ url: payload.url }, 200);
}

async function alias(
  env: ServiceEnv,
  installId: string,
  userId: string | null,
): Promise<Response> {
  if (!userId) return json({ aliased: false }, 200);
  const rows = await restGet(
    env,
    `entitlements?subject_id=eq.${installId}&subject_kind=eq.install&lane=eq.plus&select=expires_at,source,provider_customer`,
  );
  const current = rows[0];
  if (!current) return json({ aliased: false }, 200);
  await fetch(`${env.url}/rest/v1/entitlements`, {
    method: 'POST',
    headers: {
      ...serviceHeaders(env.service),
      'content-type': 'application/json',
      Prefer: 'resolution=merge-duplicates',
    },
    body: JSON.stringify({
      subject_id: userId,
      subject_kind: 'user',
      lane: 'plus',
      source: current.source ?? 'revenuecat',
      expires_at: current.expires_at ?? null,
      provider_customer: current.provider_customer ?? null,
    }),
  });
  return json({ aliased: true }, 200);
}

async function customerFor(
  env: ServiceEnv,
  installId: string,
  userId: string | null,
): Promise<string | null> {
  const queries = [
    userId
      ? `entitlements?subject_id=eq.${userId}&subject_kind=eq.user&lane=eq.plus&select=provider_customer`
      : null,
    `entitlements?subject_id=eq.${installId}&subject_kind=eq.install&lane=eq.plus&select=provider_customer`,
  ].filter((query): query is string => query !== null);
  for (const query of queries) {
    const rows = await restGet(env, query);
    const customer = rows[0]?.provider_customer;
    if (typeof customer === 'string' && customer.length > 0) return customer;
  }
  return null;
}

type ServiceEnv = { url: string; service: string; anon: string };

function serviceEnv(): ServiceEnv | null {
  const url = Deno.env.get('SUPABASE_URL');
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anon = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !service || !anon) return null;
  return { url, service, anon };
}

async function signedInUser(
  request: Request,
  env: ServiceEnv,
): Promise<string | null> {
  const header = request.headers.get('Authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  if (token === env.anon || token === env.service) return null;
  const response = await fetch(`${env.url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: env.anon },
  });
  if (!response.ok) return null;
  const payload = (await response.json()) as { id?: string };
  return payload.id && uuidPattern.test(payload.id) ? payload.id : null;
}

async function restGet(
  env: ServiceEnv,
  query: string,
): Promise<Record<string, unknown>[]> {
  const response = await fetch(`${env.url}/rest/v1/${query}`, {
    headers: serviceHeaders(env.service),
  });
  if (!response.ok) return [];
  const payload = (await response.json()) as unknown;
  return Array.isArray(payload) ? (payload as Record<string, unknown>[]) : [];
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
