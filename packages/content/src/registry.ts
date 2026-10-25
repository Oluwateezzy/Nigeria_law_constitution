import registry from '../registry.json';

export type RegistryEntry = {
  id: string;
  shipping: boolean;
  hold?: string;
};

export function registryEntries(): RegistryEntry[] {
  return registry.instruments.map((entry) => {
    const hold =
      'hold' in entry && typeof entry.hold === 'string'
        ? entry.hold
        : undefined;
    return {
      id: entry.id,
      shipping: entry.shipping,
      ...(hold ? { hold } : {}),
    };
  });
}
