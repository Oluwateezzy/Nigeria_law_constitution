import { stepIndex } from '@nigeria-law/domain';
import { describe, expect, it } from 'vitest';
import { exampleInstrument } from './fixture';
import { shippingInstrument } from './load';
import type { Unit } from './schema';
import {
  flattenOutlineSections,
  flattenOutlineUnits,
  outlineModel,
} from './outline';
import { resolveSectionJump } from './resolve-jump';
import { locateSections, readerPathLabel } from './walk';

describe('outline model', () => {
  it('lists units and sections in file order', () => {
    const instrument = shippingInstrument();
    const model = outlineModel(instrument);
    expect(flattenOutlineUnits(model).map((unit) => unit.id)).toEqual(
      flattenFileUnits(instrument.units).map((unit) => unit.id),
    );
    expect(flattenOutlineSections(model).map((section) => section.id)).toEqual(
      locateSections(instrument).map((item) => item.section.id),
    );
    expect(
      model
        .filter((unit) => unit.kind === 'chapter')
        .map((unit) => unit.heading),
    ).toEqual(
      instrument.units
        .filter((unit) => unit.kind === 'chapter')
        .map((unit) => unit.heading),
    );
  });
});

describe('section order around schedules', () => {
  it('steps from the last body section into the first schedule', () => {
    const located = locateSections(shippingInstrument());
    const index = located.findIndex((item) => item.section.number === '320');
    const next = stepIndex(index, located.length, 1);
    expect(next).toBe(index + 1);
    expect(located[next!]?.section.id).toBe('cfrn-1999:s:sch1-pt1');
    expect(readerPathLabel('Constitution', located[next!]!.trail)).toContain(
      'First Schedule',
    );
    expect(stepIndex(0, located.length, -1)).toBeNull();
    expect(stepIndex(located.length - 1, located.length, 1)).toBeNull();
    expect(located[0]?.section.number).toBe('preamble');
    expect(located.at(-1)?.section.id).toBe('cfrn-1999:s:sch7');
  });
});

describe('resolveSectionJump', () => {
  it('opens a real section and subsection, and stays unmatched otherwise', () => {
    const instrument = shippingInstrument();
    expect(resolveSectionJump(instrument, '36')?.section.id).toBe(
      'cfrn-1999:s:36',
    );
    expect(resolveSectionJump(instrument, '36(1)')).toMatchObject({
      anchor: 'sub-1',
      section: { id: 'cfrn-1999:s:36' },
    });
    expect(resolveSectionJump(instrument, '9999')).toBeNull();
    expect(resolveSectionJump(exampleInstrument(), '1(1)')?.anchor).toBe(
      'sub-1',
    );
    expect(resolveSectionJump(exampleInstrument(), '1(9)')).toBeNull();
  });
});

function flattenFileUnits(units: readonly Unit[]): Unit[] {
  return units.flatMap((unit) => [unit, ...flattenFileUnits(unit.units ?? [])]);
}
