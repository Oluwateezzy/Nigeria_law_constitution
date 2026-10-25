export type ThemePreference = 'light' | 'dark' | 'system';

export const themePreferenceKey = 'theme-preference';

export type ThemePreferenceStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
};

export function resolveColorScheme(
  preference: ThemePreference,
  systemScheme: 'light' | 'dark' | null | undefined,
): 'light' | 'dark' {
  if (preference === 'light' || preference === 'dark') {
    return preference;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export async function readThemePreference(
  store: ThemePreferenceStore,
): Promise<ThemePreference> {
  const value = await store.getItem(themePreferenceKey);
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}

export async function writeThemePreference(
  store: ThemePreferenceStore,
  preference: ThemePreference,
): Promise<void> {
  await store.setItem(themePreferenceKey, preference);
}
