import { describe, expect, it } from 'vitest';
import { checkCorpusFiles, checkInstrument } from './check-corpus';
import { exampleInstrument } from './fixture';
import { shippingInstrument } from './load';

describe('corpus check', () => {
  it('passes the shipping constitution', () => {
    expect(checkCorpusFiles()).toEqual([]);
    expect(shippingInstrument().review.status).toBe('reviewed');
  });

  it('fails when a section id is duplicated', () => {
    const instrument = exampleInstrument();
    const section = instrument.units[0]?.sections?.[0];
    instrument.units[0]?.sections?.push({
      ...section!,
      blocks: section!.blocks,
    });
    const issues = checkInstrument(instrument);
    expect(issues.some((issue) => issue.includes('duplicate section id'))).toBe(
      true,
    );
  });

  it('fails when an Act has an empty extent', () => {
    const instrument = exampleInstrument();
    instrument.extent = '';
    const issues = checkInstrument(instrument);
    expect(
      issues.some((issue) => issue.includes('missing extent on an Act')),
    ).toBe(true);
  });

  it('fails when a draft is marked as the shipping corpus', () => {
    const instrument = exampleInstrument();
    const issues = checkInstrument(instrument, {
      registry: { instruments: [{ id: 'example', shipping: true }] },
      production: true,
    });
    expect(
      issues.some((issue) => issue.includes('shipping corpus is not reviewed')),
    ).toBe(true);
  });

  it('fails when provenance is missing', () => {
    const instrument = shippingInstrument();
    const issues = checkInstrument(instrument, { provenance: {} });
    expect(issues.some((issue) => issue.includes('missing provenance'))).toBe(
      true,
    );
  });
});
