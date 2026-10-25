import { describe, expect, it } from 'vitest';
import { checkCorpusFiles, checkInstrument } from './check-corpus';
import { exampleInstrument } from './fixture';
import { registryEntries } from './registry';
import { shippingInstrument, shippingInstruments } from './load';

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

  it('rejects a reviewed Act with an empty extent', () => {
    const instrument = exampleInstrument();
    instrument.extent = ' ';
    instrument.review = {
      status: 'reviewed',
      reviewedOn: '2026-10-25',
      reviewer: 'oluwatobiloba',
    };
    const issues = checkInstrument(instrument);
    expect(
      issues.some((issue) => issue.includes('missing extent on an Act')),
    ).toBe(true);
  });

  it('ships only reviewed registry ids and leaves the priority Acts out', () => {
    const bundled = shippingInstruments().map((item) => item.id);
    const shipping = registryEntries()
      .filter((entry) => entry.shipping)
      .map((entry) => entry.id);
    expect(bundled).toEqual(shipping);
    expect(bundled).toEqual(['cfrn-1999']);
    for (const entry of registryEntries()) {
      if (!entry.shipping) {
        expect(bundled).not.toContain(entry.id);
        expect(entry.hold?.length).toBeGreaterThan(0);
      }
    }
    expect(
      registryEntries().some((entry) => entry.id === 'penal-code-act'),
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
