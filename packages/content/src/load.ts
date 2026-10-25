import instrument from '../corpus/cfrn-1999.js';
import type { Instrument } from './schema';

const bundled: Instrument[] = [instrument];

export function shippingInstruments(): readonly Instrument[] {
  return bundled;
}

export function findShippingInstrument(id: string): Instrument | null {
  return bundled.find((item) => item.id === id) ?? null;
}

export function shippingInstrument(): Instrument {
  return bundled[0]!;
}

export function contentVersionOf(
  value: { contentVersion: string } = instrument,
): string {
  return value.contentVersion;
}
