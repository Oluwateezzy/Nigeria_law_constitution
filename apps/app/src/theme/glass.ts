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

  const baseStyle: Record<string, unknown> = {
    backgroundColor: currentPalette.bgGlass,
  };

  if (border) {
    baseStyle.borderColor = currentPalette.line;
    baseStyle.borderWidth = 1;
  }

  if (Platform.OS === 'web') {
    baseStyle.backdropFilter = 'blur(20px)';
    baseStyle.WebkitBackdropFilter = 'blur(20px)';
  }

  return baseStyle as ViewStyle;
}
