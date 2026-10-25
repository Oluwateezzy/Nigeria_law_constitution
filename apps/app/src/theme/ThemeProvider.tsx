import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AccessibilityInfo, useColorScheme } from 'react-native';
import { motionDuration } from './motion';
import {
  readThemePreference,
  resolveColorScheme,
  type ThemePreference,
} from './preference';
import { themePreferenceStore } from './storage';
import { palette, type Palette } from './tokens';

type ThemeValue = {
  scheme: 'light' | 'dark';
  colors: Palette;
  preference: ThemePreference;
  reduceMotion: boolean;
  motionDuration: (kind: 'section' | 'sheet') => number;
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

  const value = useMemo<ThemeValue>(() => {
    const scheme = resolveColorScheme(preference, systemScheme);
    return {
      scheme,
      colors: palette[scheme],
      preference,
      reduceMotion,
      motionDuration: (kind) => motionDuration(kind, reduceMotion),
    };
  }, [preference, reduceMotion, systemScheme]);

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
