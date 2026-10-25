import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const banned =
  /^(react|react-native|react-dom|expo)$|^(react-|expo-|@expo\/|@react-native|@supabase\/)/;

describe('domain dependencies', () => {
  it('does not depend on React, Expo, or Supabase', () => {
    const pkg = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    const names = [
      ...Object.keys(pkg.dependencies ?? {}),
      ...Object.keys(pkg.devDependencies ?? {}),
      ...Object.keys(pkg.peerDependencies ?? {}),
    ];
    expect(names.filter((name) => banned.test(name))).toEqual([]);
  });
});
