import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const { bundleIdentifiers, readAppVariant } = require('./variants.cjs') as {
  bundleIdentifiers: Record<'local' | 'preview' | 'production', string>;
  readAppVariant: (
    value: string | undefined,
  ) => 'local' | 'preview' | 'production';
};

describe('app variants', () => {
  it('gives preview a different bundle id from production', () => {
    expect(bundleIdentifiers.preview).not.toBe(bundleIdentifiers.production);
    expect(bundleIdentifiers.local).not.toBe(bundleIdentifiers.preview);
    expect(readAppVariant(undefined)).toBe('local');
    expect(readAppVariant('preview')).toBe('preview');
  });
});
