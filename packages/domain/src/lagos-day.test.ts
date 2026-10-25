import { describe, expect, it } from 'vitest';
import { lagosDay } from './lagos-day';

describe('lagosDay', () => {
  it('covers 23:30 and 00:30 UTC', () => {
    expect(lagosDay(new Date('2026-10-25T23:30:00.000Z'))).toBe('2026-10-26');
    expect(lagosDay(new Date('2026-10-26T00:30:00.000Z'))).toBe('2026-10-26');
  });

  it('rolls at 00:00 Africa/Lagos', () => {
    expect(lagosDay(new Date('2026-10-25T22:59:59.000Z'))).toBe('2026-10-25');
    expect(lagosDay(new Date('2026-10-25T23:00:00.000Z'))).toBe('2026-10-26');
  });
});
