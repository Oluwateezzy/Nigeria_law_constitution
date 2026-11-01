export const palette = {
  light: {
    bg: '#FAFBFC',
    bgRaised: '#FFFFFF',
    bgGlass: 'rgba(255, 255, 255, 0.72)',
    ink: '#1B1F24',
    inkMuted: '#656D76',
    line: '#D1D9E0',
    primary: '#006B3F',
    primarySoft: '#E6F4ED',
    accent: '#D4A017',
    accentSoft: '#FFF8E1',
    danger: '#CF222E',
    dangerSoft: '#FFEBE9',
  },
  dark: {
    bg: '#0D1117',
    bgRaised: '#161B22',
    bgGlass: 'rgba(22, 27, 34, 0.72)',
    ink: '#F0F3F6',
    inkMuted: '#8B949E',
    line: '#30363D',
    primary: '#3FB68B',
    primarySoft: '#0D2818',
    accent: '#F5C842',
    accentSoft: '#2D2200',
    danger: '#F85149',
    dangerSoft: '#3D1418',
  },
} as const;

export const gradient = {
  hero: {
    light: ['#006B3F', '#004D2C'] as const,
    dark: ['#0D2818', '#006B3F'] as const,
  },
  trivia: {
    light: ['#D4A017', '#B8860B'] as const,
    dark: ['#2D2200', '#D4A017'] as const,
  },
} as const;

export const fonts = {
  inter: 'Inter_400Regular',
  interMedium: 'Inter_500Medium',
  interSemi: 'Inter_600SemiBold',
  interBold: 'Inter_700Bold',
  newsreader: 'Newsreader_400Regular',
  newsreaderSemi: 'Newsreader_600SemiBold',
} as const;

export const type = {
  display: {
    fontFamily: fonts.interBold,
    fontSize: 28,
    lineHeight: 34,
  },
  h1: {
    fontFamily: fonts.interSemi,
    fontSize: 24,
    lineHeight: 30,
  },
  h2: {
    fontFamily: fonts.interSemi,
    fontSize: 20,
    lineHeight: 26,
  },
  body: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 22,
  },
  caption: {
    fontFamily: fonts.inter,
    fontSize: 13,
    lineHeight: 18,
  },
  badge: {
    fontFamily: fonts.interMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  sectionNumber: {
    fontFamily: fonts.newsreaderSemi,
    fontSize: 40,
    lineHeight: 44,
  },
  provision: {
    fontFamily: fonts.newsreader,
    fontSize: 21,
    lineHeight: 34,
  },
  // Backward compatibility aliases
  heading: {
    fontFamily: fonts.interSemi,
    fontSize: 20,
    lineHeight: 26,
  },
  ui: {
    fontFamily: fonts.inter,
    fontSize: 15,
    lineHeight: 22,
  },
  disclaimer: {
    fontFamily: fonts.inter,
    fontSize: 13,
    lineHeight: 18,
  },
  provisionSteps: [
    { fontSize: 18, lineHeight: 30 },
    { fontSize: 21, lineHeight: 34 },
    { fontSize: 24, lineHeight: 38 },
  ],
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  screen: 20,
  target: 44,
  unit: 4, // backward compatibility
} as const;

export const measureCh = 68;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
  field: 12, // backward compatibility
  card: 16, // backward compatibility
} as const;

export const elevationTokens = {
  light: {
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.08,
      shadowRadius: 3,
      elevation: 2,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 4,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  dark: {
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.3,
      shadowRadius: 3,
      elevation: 2,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 4,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.5,
      shadowRadius: 24,
      elevation: 8,
    },
  },
} as const;

export type ColorSchemeName = 'light' | 'dark';
export type Palette = (typeof palette)[ColorSchemeName];
export type GradientTokens = (typeof gradient)[keyof typeof gradient][ColorSchemeName];
