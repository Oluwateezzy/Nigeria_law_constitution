import instrument from '../corpus/cfrn-1999.js';
import type { Instrument } from './schema';

export function shippingInstrument(): Instrument {
  return instrument;
}

export function contentVersionOf(
  value: { contentVersion: string } = instrument,
): string {
  return value.contentVersion;
}
