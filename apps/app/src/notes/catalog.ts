import { locateSections, shippingInstruments } from '@nigeria-law/content';
import type { NoteSection } from './present';

export function noteSections(): NoteSection[] {
  return shippingInstruments().flatMap((instrument) =>
    locateSections(instrument).map((item) => ({
      id: item.section.id,
      number: item.section.number,
      heading: item.section.heading ?? '',
      instrumentId: instrument.id,
      instrumentTitle: instrument.shortTitle,
    })),
  );
}
