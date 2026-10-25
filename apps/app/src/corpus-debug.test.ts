import { describe, expect, it } from 'vitest';
import { shippingInstrument } from '@nigeria-law/content';

describe('bundled corpus', () => {
  it('loads the shipping constitution as reviewed', () => {
    const instrument = shippingInstrument();
    expect(instrument.id).toBe('cfrn-1999');
    expect(instrument.review.status).toBe('reviewed');
    expect(instrument.legalTextHash).toMatch(/^[a-f0-9]{64}$/);
    expect(instrument.indexHash).toMatch(/^[a-f0-9]{64}$/);
  });
});
