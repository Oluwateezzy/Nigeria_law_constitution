import type { Instrument, Unit } from './schema';

export type OutlineSection = {
  id: string;
  number: string;
  heading?: string;
};

export type OutlineUnit = {
  id: string;
  kind: Unit['kind'];
  number?: string;
  heading: string;
  sections: OutlineSection[];
  units: OutlineUnit[];
};

function toOutline(unit: Unit): OutlineUnit {
  return {
    id: unit.id,
    kind: unit.kind,
    number: unit.number,
    heading: unit.heading,
    sections: (unit.sections ?? []).map((section) => ({
      id: section.id,
      number: section.number,
      heading: section.heading,
    })),
    units: (unit.units ?? []).map(toOutline),
  };
}

export function outlineModel(instrument: Instrument): OutlineUnit[] {
  return instrument.units.map(toOutline);
}

export function flattenOutlineUnits(
  units: readonly OutlineUnit[],
): OutlineUnit[] {
  return units.flatMap((unit) => [unit, ...flattenOutlineUnits(unit.units)]);
}

export function flattenOutlineSections(
  units: readonly OutlineUnit[],
): OutlineSection[] {
  return units.flatMap((unit) => [
    ...unit.sections,
    ...flattenOutlineSections(unit.units),
  ]);
}
