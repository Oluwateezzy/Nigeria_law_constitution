import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, Platform, useColorScheme } from 'react-native';
import { installWebFocus } from './focus';
import { motionDuration, type MotionKind } from './motion';
import {
  readThemePreference,
  resolveColorScheme,
  writeThemePreference,
  type ThemePreference,
} from './preference';
import { themePreferenceStore } from './storage';
import {
  elevationTokens,
  gradient,
  palette,
  type ColorSchemeName,
  type Palette,
} from './tokens';

export type ThemeValue = {
  scheme: 'light' | 'dark';
  colors: Palette;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => Promise<void>;
  reduceMotion: boolean;
  motionDuration: (kind: MotionKind) => number;
  gradient: {
    hero: readonly [string, string];
    trivia: readonly [string, string];
  };
  elevation: (typeof elevationTokens)[ColorSchemeName];
};

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;
    readThemePreference(themePreferenceStore)
      .then((value) => {
        if (mounted) {
          setPreference(value);
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted) {
          setReduceMotion(value);
        }
      })
      .catch(() => undefined);
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  const handleSetPreference = useCallback(async (next: ThemePreference) => {
    setPreference(next);
    await writeThemePreference(themePreferenceStore, next);
  }, []);

  const value = useMemo<ThemeValue>(() => {
    const scheme = resolveColorScheme(preference, systemScheme);
    return {
      scheme,
      colors: palette[scheme],
      preference,
      setPreference: handleSetPreference,
      reduceMotion,
      motionDuration: (kind) => motionDuration(kind, reduceMotion),
      gradient: {
        hero: gradient.hero[scheme],
        trivia: gradient.trivia[scheme],
      },
      elevation: elevationTokens[scheme],
    };
  }, [handleSetPreference, preference, reduceMotion, systemScheme]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    installWebFocus(value.colors.primary);
  }, [value.colors.primary]);

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return value;
}
