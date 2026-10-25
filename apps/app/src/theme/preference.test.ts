import { describe, expect, it } from 'vitest';
import {
  readThemePreference,
  resolveColorScheme,
  themePreferenceKey,
  writeThemePreference,
  type ThemePreferenceStore,
} from './preference';

function memoryStore(): ThemePreferenceStore & { values: Map<string, string> } {
  const values = new Map<string, string>();
  return {
    values,
    async getItem(key) {
      return values.get(key) ?? null;
    },
    async setItem(key, value) {
      values.set(key, value);
    },
  };
}

describe('theme preference', () => {
  it('follows the system until a saved choice exists', async () => {
    const store = memoryStore();
    expect(await readThemePreference(store)).toBe('system');
    expect(resolveColorScheme('system', 'dark')).toBe('dark');
    expect(resolveColorScheme('system', 'light')).toBe('light');
    await writeThemePreference(store, 'dark');
    expect(store.values.get(themePreferenceKey)).toBe('dark');
    expect(await readThemePreference(store)).toBe('dark');
    expect(resolveColorScheme('light', 'dark')).toBe('light');
  });
});
