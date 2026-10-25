import registry from '../registry.json';

export type RegistryEntry = {
  id: string;
  shipping: boolean;
};

export function registryEntries(): RegistryEntry[] {
  return registry.instruments;
}
