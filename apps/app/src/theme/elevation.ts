import { Platform, type ViewStyle } from 'react-native';
import type { ColorSchemeName } from './tokens';

export type ElevationLevel = 1 | 2 | 3;

interface ShadowSpec {
  offsetY: number;
  radius: number;
  opacity: number;
  elevation: number;
}

const shadowSpecs: Record<ColorSchemeName, Record<ElevationLevel, ShadowSpec>> = {
  light: {
    1: { offsetY: 1, radius: 3, opacity: 0.08, elevation: 2 },
    2: { offsetY: 4, radius: 12, opacity: 0.1, elevation: 4 },
    3: { offsetY: 8, radius: 24, opacity: 0.12, elevation: 8 },
  },
  dark: {
    1: { offsetY: 1, radius: 3, opacity: 0.3, elevation: 2 },
    2: { offsetY: 4, radius: 12, opacity: 0.4, elevation: 4 },
    3: { offsetY: 8, radius: 24, opacity: 0.5, elevation: 8 },
  },
};

export function getElevation(
  level: ElevationLevel,
  scheme: ColorSchemeName = 'light',
): ViewStyle {
  const spec = shadowSpecs[scheme][level];

  if (Platform.OS === 'web') {
    const rgba =
      scheme === 'light'
        ? `rgba(0, 0, 0, ${spec.opacity})`
        : `rgba(0, 0, 0, ${spec.opacity})`;
    return {
      // @ts-expect-error web boxShadow in RNW
      boxShadow: `0px ${spec.offsetY}px ${spec.radius}px ${rgba}`,
    };
  }

  if (Platform.OS === 'android') {
    return {
      elevation: spec.elevation,
    };
  }

  // iOS & default
  return {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: spec.offsetY },
    shadowOpacity: spec.opacity,
    shadowRadius: spec.radius,
  };
}

export const elevation = {
  light: {
    1: getElevation(1, 'light'),
    2: getElevation(2, 'light'),
    3: getElevation(3, 'light'),
  },
  dark: {
    1: getElevation(1, 'dark'),
    2: getElevation(2, 'dark'),
    3: getElevation(3, 'dark'),
  },
} as const;
