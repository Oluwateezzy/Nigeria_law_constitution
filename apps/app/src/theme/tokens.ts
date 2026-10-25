export const palette = {
  light: {
    bg: '#F6F3EC',
    bgRaised: '#FFFCF7',
    ink: '#1C1915',
    inkMuted: '#6B645C',
    line: '#E4DDD2',
    accent: '#0E3B2E',
    danger: '#8C2F2F',
  },
  dark: {
    bg: '#141210',
    bgRaised: '#1E1B17',
    ink: '#F3EDE3',
    inkMuted: '#B7AFA4',
    line: '#3A342C',
    accent: '#8FCBB4',
    danger: '#E3A0A0',
  },
} as const;

export const fonts = {
  newsreader: 'Newsreader_400Regular',
  newsreaderSemi: 'Newsreader_600SemiBold',
} as const;

export const type = {
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
  heading: {
    fontSize: 22,
    lineHeight: 28,
  },
  ui: {
    fontSize: 15,
    lineHeight: 20,
  },
  disclaimer: {
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
  unit: 4,
  screen: 20,
  target: 44,
} as const;

export const measureCh = 68;

export const radius = {
  field: 12,
  card: 16,
} as const;

export type ColorSchemeName = 'light' | 'dark';
export type Palette = (typeof palette)[ColorSchemeName];
