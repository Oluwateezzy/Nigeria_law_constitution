import { Platform, type ViewStyle } from 'react-native';
import { palette, type ColorSchemeName } from './tokens';

export interface GlassOptions {
  border?: boolean;
  intensity?: number;
}

export function getGlassStyle(
  scheme: ColorSchemeName = 'light',
  options: GlassOptions = {},
): ViewStyle {
  const { border = true } = options;
  const currentPalette = palette[scheme];

  const baseStyle: ViewStyle = {
    backgroundColor: currentPalette.bgGlass,
  };

  if (border) {
    baseStyle.borderColor = currentPalette.line;
    baseStyle.borderWidth = 1;
  }

  if (Platform.OS === 'web') {
    return {
      ...baseStyle,
      // @ts-expect-error web backdropFilter in RNW
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
    };
  }

  // Native: Semi-transparent background with border gives frosted glass aesthetic
  return baseStyle;
}
