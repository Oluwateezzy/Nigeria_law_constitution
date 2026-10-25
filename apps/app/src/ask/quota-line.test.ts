import { plusHostedLimit, plusOffer } from '@nigeria-law/domain';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { copy } from '../copy';
import { quotaLine } from './quota-line';

describe('Plus copy', () => {
  it('reads the Plus limit from the proxy constant', () => {
    expect(plusHostedLimit).toBe(100);
    expect(copy.plus.allowance).toBe(
      `${plusHostedLimit} hosted requests per day.`,
    );
    expect(copy.ask.plusBody).toContain(String(plusHostedLimit));
    expect(copy.plus.price).toBe(plusOffer.display);
    expect(copy.plus.price).toBe('₦1,500 per month');
  });

  it('shows the remaining Plus count with the reset time', () => {
    const line = quotaLine({
      remaining: 99,
      limit: plusHostedLimit,
      lane: 'plus',
      resetsAt: '2026-10-26T00:00:00+01:00',
    });
    expect(line).toContain('99');
    expect(line).toContain('2026-10-26T00:00:00+01:00');
    expect(
      quotaLine({
        remaining: 0,
        limit: plusHostedLimit,
        lane: 'plus',
        resetsAt: '2026-10-26T00:00:00+01:00',
      }),
    ).toContain(String(plusHostedLimit));
  });

  it('keeps the price off the reader', () => {
    const reader = readFileSync(
      path.join(process.cwd(), 'src/reader/ReaderScreen.tsx'),
      'utf8',
    );
    const bar = readFileSync(
      path.join(process.cwd(), 'src/components/ReaderBar.tsx'),
      'utf8',
    );
    expect(reader.includes(plusOffer.display)).toBe(false);
    expect(bar.includes(plusOffer.display)).toBe(false);
    expect(bar.includes('₦')).toBe(false);
  });
});
