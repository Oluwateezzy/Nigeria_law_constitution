import { freeHostedLimit, limitForLane, plusHostedLimit } from './quota';
import type { QuotaLane } from './quota';

export const plusOffer = {
  productId: 'plus_monthly',
  entitlementId: 'plus',
  amount: 1500,
  currency: 'NGN',
  period: 'month',
  display: '₦1,500 per month',
  stripeUnitAmount: 150_000,
} as const;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EntitlementRow = {
  subject_id: string;
  subject_kind: 'install' | 'user';
  lane: 'plus';
  source: 'stripe' | 'revenuecat';
  expires_at: string | null;
  provider_customer: string | null;
};

export type EntitlementUpdate = {
  rows: EntitlementRow[];
  expireCustomer: string | null;
};

export function entitlementActive(
  expiresAt: string | null,
  now: Date,
): boolean {
  if (!expiresAt) return true;
  const time = new Date(expiresAt).getTime();
  return Number.isFinite(time) && time > now.getTime();
}

export function resolveProxyLane(input: {
  claimed?: string | null;
  rows: readonly { expiresAt: string | null }[];
  now: Date;
}): QuotaLane {
  void input.claimed;
  const active = input.rows.some((row) =>
    entitlementActive(row.expiresAt, input.now),
  );
  return active ? 'plus' : 'free';
}

export function proxyLimit(input: {
  claimed?: string | null;
  rows: readonly { expiresAt: string | null }[];
  now: Date;
}): number {
  return limitForLane(resolveProxyLane(input));
}

export function shouldAliasPurchase(
  userId: string | null | undefined,
): userId is string {
  return typeof userId === 'string' && uuidPattern.test(userId);
}

export function rowsFromStripeEvent(
  event: unknown,
  now: Date,
): EntitlementUpdate {
  const record = asRecord(event);
  const type = typeof record?.type === 'string' ? record.type : '';
  const object = asRecord(asRecord(record?.data)?.object);
  if (!object) return emptyUpdate();
  const metadata = asRecord(object.metadata);
  const subjects = stripeSubjects(metadata, object.client_reference_id);
  const customer = typeof object.customer === 'string' ? object.customer : null;
  if (type === 'checkout.session.completed') {
    if (object.mode !== 'subscription') return emptyUpdate();
    const expires = periodEnd(object.current_period_end);
    return {
      rows: subjects.map((subject) =>
        row(subject, 'stripe', expires, customer),
      ),
      expireCustomer: null,
    };
  }
  if (type === 'customer.subscription.deleted') {
    const ended = periodEnd(object.ended_at) ?? now.toISOString();
    const expires =
      new Date(ended).getTime() > now.getTime() ? now.toISOString() : ended;
    return {
      rows: subjects.map((subject) =>
        row(subject, 'stripe', expires, customer),
      ),
      expireCustomer: customer,
    };
  }
  return emptyUpdate();
}

export function rowsFromRevenueCatEvent(
  event: unknown,
  now: Date,
): EntitlementUpdate {
  const record = asRecord(event);
  const body = asRecord(record?.event) ?? record;
  if (!body) return emptyUpdate();
  const type = typeof body.type === 'string' ? body.type : '';
  const entitlements = body.entitlement_ids;
  if (
    Array.isArray(entitlements) &&
    !entitlements.includes(plusOffer.entitlementId)
  ) {
    return emptyUpdate();
  }
  const ids = revenueCatIds(body);
  if (ids.length === 0) return emptyUpdate();
  const expiry = millis(body.expiration_at_ms);
  if (type === 'EXPIRATION') {
    const expires =
      expiry && new Date(expiry).getTime() <= now.getTime()
        ? expiry
        : now.toISOString();
    return {
      rows: ids.flatMap((id) => bothKinds(id, expires)),
      expireCustomer: null,
    };
  }
  if (
    type === 'INITIAL_PURCHASE' ||
    type === 'RENEWAL' ||
    type === 'UNCANCELLATION' ||
    type === 'CANCELLATION'
  ) {
    return {
      rows: ids.flatMap((id) => bothKinds(id, expiry)),
      expireCustomer: null,
    };
  }
  return emptyUpdate();
}

export { freeHostedLimit, plusHostedLimit };

function bothKinds(id: string, expires: string | null): EntitlementRow[] {
  return [
    row({ id, kind: 'install' }, 'revenuecat', expires, null),
    row({ id, kind: 'user' }, 'revenuecat', expires, null),
  ];
}

function row(
  subject: { id: string; kind: 'install' | 'user' },
  source: 'stripe' | 'revenuecat',
  expires: string | null,
  customer: string | null,
): EntitlementRow {
  return {
    subject_id: subject.id,
    subject_kind: subject.kind,
    lane: 'plus',
    source,
    expires_at: expires,
    provider_customer: customer,
  };
}

function stripeSubjects(
  metadata: Record<string, unknown> | null,
  reference: unknown,
): { id: string; kind: 'install' | 'user' }[] {
  const subjects: { id: string; kind: 'install' | 'user' }[] = [];
  const user = uuid(metadata?.user_id);
  const install = uuid(metadata?.install_id) ?? uuid(reference);
  if (user) subjects.push({ id: user, kind: 'user' });
  if (install && install !== user)
    subjects.push({ id: install, kind: 'install' });
  return subjects;
}

function revenueCatIds(body: Record<string, unknown>): string[] {
  const ids = [
    uuid(body.app_user_id),
    uuid(body.original_app_user_id),
    ...(Array.isArray(body.aliases)
      ? body.aliases.map((item) => uuid(item))
      : []),
  ];
  return [...new Set(ids.filter((id): id is string => id !== null))];
}

function periodEnd(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }
  return null;
}

function millis(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  return null;
}

function uuid(value: unknown): string | null {
  return typeof value === 'string' && uuidPattern.test(value) ? value : null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function emptyUpdate(): EntitlementUpdate {
  return { rows: [], expireCustomer: null };
}
