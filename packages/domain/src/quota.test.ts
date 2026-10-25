import { describe, expect, it } from 'vitest';
import { freeHostedLimit, lagosResetsAt, QuotaBook } from './quota';

describe('hosted quota', () => {
  it('resets on the Lagos date even when the device clock is not in Lagos', () => {
    const eveningInLagos = new Date('2026-10-25T22:30:00.000Z');
    const afterMidnightInLagos = new Date('2026-10-25T23:30:00.000Z');
    expect(lagosResetsAt(eveningInLagos)).toBe('2026-10-26T00:00:00+01:00');
    expect(lagosResetsAt(afterMidnightInLagos)).toBe('2026-10-27T00:00:00+01:00');
  });

  it('folds the install into the account once and does not grant a second allowance', () => {
    const now = new Date('2026-10-25T15:00:00.000Z');
    const book = new QuotaBook();
    book.seedInstall('install-1', now, 3);
    book.seedUser('user-1', now, 1);
    const signedIn = {
      installId: 'install-1',
      userId: 'user-1',
      ip: '203.0.113.8',
      lane: 'free' as const,
      now,
    };
    const first = book.snapshot(signedIn);
    const second = book.snapshot(signedIn);
    expect(first.used).toBe(4);
    expect(second.used).toBe(4);
    expect(first.remaining).toBe(1);
    expect(first.used).not.toBe(0);
    expect(first.remaining).not.toBe(freeHostedLimit);
    expect(first.used).not.toBe(3 + freeHostedLimit);
  });
});
