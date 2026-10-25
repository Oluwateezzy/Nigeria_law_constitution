import { describe, expect, it } from 'vitest';
import {
  plusHostedLimit,
  plusOffer,
  proxyLimit,
  resolveProxyLane,
  rowsFromRevenueCatEvent,
  rowsFromStripeEvent,
  shouldAliasPurchase,
} from './entitlement';
import { freeHostedLimit } from './quota';

const now = new Date('2026-10-25T12:00:00.000Z');
const installId = '11111111-1111-4111-8111-111111111111';
const userId = '22222222-2222-4222-8222-222222222222';

describe('proxy lane', () => {
  it('treats a missing entitlement as the free lane', () => {
    expect(proxyLimit({ claimed: 'plus', rows: [], now })).toBe(
      freeHostedLimit,
    );
    expect(freeHostedLimit).toBe(5);
  });

  it('treats an active entitlement as Plus', () => {
    expect(
      proxyLimit({
        claimed: null,
        rows: [{ expiresAt: '2026-11-25T00:00:00.000Z' }],
        now,
      }),
    ).toBe(plusHostedLimit);
    expect(plusHostedLimit).toBe(100);
  });

  it('treats an expired entitlement as the free lane', () => {
    expect(
      proxyLimit({
        claimed: 'plus',
        rows: [{ expiresAt: '2026-10-01T00:00:00.000Z' }],
        now,
      }),
    ).toBe(5);
    expect(resolveProxyLane({ claimed: 'plus', rows: [], now })).toBe('free');
  });
});

describe('stripe webhook', () => {
  it('writes an active entitlement when checkout completes', () => {
    const update = rowsFromStripeEvent(
      {
        type: 'checkout.session.completed',
        data: {
          object: {
            mode: 'subscription',
            client_reference_id: installId,
            customer: 'cus_plus',
            metadata: { install_id: installId },
            current_period_end: 1_796_000_000,
          },
        },
      },
      now,
    );
    expect(update.rows).toHaveLength(1);
    expect(update.rows[0]?.subject_id).toBe(installId);
    expect(update.rows[0]?.source).toBe('stripe');
    expect(
      proxyLimit({
        rows: [{ expiresAt: update.rows[0]?.expires_at ?? null }],
        now,
      }),
    ).toBe(100);
  });

  it('expires the entitlement when the subscription is deleted', () => {
    const update = rowsFromStripeEvent(
      {
        type: 'customer.subscription.deleted',
        data: {
          object: {
            customer: 'cus_plus',
            metadata: { install_id: installId, user_id: userId },
            ended_at: 1_761_000_000,
          },
        },
      },
      now,
    );
    expect(update.expireCustomer).toBe('cus_plus');
    expect(update.rows.map((row) => row.subject_kind).sort()).toEqual([
      'install',
      'user',
    ]);
    expect(
      proxyLimit({
        claimed: 'plus',
        rows: update.rows.map((row) => ({ expiresAt: row.expires_at })),
        now,
      }),
    ).toBe(5);
  });
});

describe('store webhook', () => {
  it('raises the limit from a purchase fixture without a client write', () => {
    const update = rowsFromRevenueCatEvent(
      {
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: installId,
          entitlement_ids: [plusOffer.entitlementId],
          expiration_at_ms: new Date('2026-11-25T00:00:00.000Z').getTime(),
        },
      },
      now,
    );
    expect(update.rows.some((row) => row.subject_id === installId)).toBe(true);
    expect(
      proxyLimit({
        claimed: null,
        rows: update.rows
          .filter((row) => row.subject_id === installId)
          .map((row) => ({ expiresAt: row.expires_at })),
        now,
      }),
    ).toBe(100);
  });
});

describe('account alias', () => {
  it('does not alias when there is no session', () => {
    expect(shouldAliasPurchase(null)).toBe(false);
    expect(shouldAliasPurchase(undefined)).toBe(false);
    expect(shouldAliasPurchase('')).toBe(false);
    expect(shouldAliasPurchase(userId)).toBe(true);
  });
});
