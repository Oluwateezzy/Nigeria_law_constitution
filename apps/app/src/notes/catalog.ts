import { locateSections, shippingInstrument } from '@nigeria-law/content';
import type { NoteSection } from './present';

export function noteSections(): NoteSection[] {
  const instrument = shippingInstrument();
  return locateSections(instrument).map((item) => ({
    id: item.section.id,
    number: item.section.number,
    heading: item.section.heading ?? '',
    instrumentId: instrument.id,
    instrumentTitle: instrument.shortTitle,
  }));
}
