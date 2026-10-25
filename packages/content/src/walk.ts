import type { Instrument, Section, Unit } from './schema';

export type LocatedSection = {
  section: Section;
  path: string;
};

function unitLabel(unit: Unit): string {
  if (unit.kind === 'chapter' && unit.number)
    return `Chapter ${unit.number}. ${unit.heading}`;
  if (
    unit.kind === 'schedule' &&
    unit.number &&
    !unit.heading.startsWith(unit.number)
  ) {
    return `${unit.number} Schedule. ${unit.heading}`;
  }
  const romanPart =
    unit.kind === 'part' &&
    !!unit.number &&
    /^[IVXLC]+$/.test(unit.number) &&
    unit.id.endsWith(`-p${unit.number.toLowerCase()}`);
  if (romanPart && unit.number) return `Part ${unit.number}. ${unit.heading}`;
  if (unit.kind === 'part' && unit.number)
    return `${unit.number} - ${unit.heading}`;
  return unit.heading;
}

export function locateSections(instrument: Instrument): LocatedSection[] {
  const located: LocatedSection[] = [];
  const walk = (units: readonly Unit[], trail: string[]) => {
    for (const unit of units) {
      const next = [...trail, unitLabel(unit)];
      for (const section of unit.sections ?? []) {
        const leaf =
          section.heading && section.heading !== unit.heading
            ? `${section.number}. ${section.heading}`
            : section.number;
        located.push({ section, path: [...next, leaf].join(' / ') });
      }
      if (unit.units) walk(unit.units, next);
    }
  };
  walk(instrument.units, []);
  return located;
}

export function findSection(
  instrument: Instrument,
  id: string,
): LocatedSection | undefined {
  const wanted = id.trim();
  return locateSections(instrument).find((item) => item.section.id === wanted);
}
