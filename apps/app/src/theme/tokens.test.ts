import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { motionDuration } from './motion';
import {
  elevationTokens,
  fonts,
  gradient,
  palette,
  radius,
  space,
  type,
} from './tokens';

describe('V2 theme tokens (V2-P1-T2 & V2-P1-T3)', () => {
  it('lists the V2 palette hex values matching architecture §19.3', () => {
    expect(palette).toEqual({
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
    });
  });

  it('verifies gradients and elevation tokens', () => {
    expect(gradient.hero.light).toEqual(['#006B3F', '#004D2C']);
    expect(gradient.hero.dark).toEqual(['#0D2818', '#006B3F']);
    expect(gradient.trivia.light).toEqual(['#D4A017', '#B8860B']);
    expect(gradient.trivia.dark).toEqual(['#2D2200', '#D4A017']);

    expect(elevationTokens.light[1].shadowOpacity).toBe(0.08);
    expect(elevationTokens.light[2].shadowOpacity).toBe(0.10);
    expect(elevationTokens.light[3].shadowOpacity).toBe(0.12);
    expect(elevationTokens.dark[1].shadowOpacity).toBe(0.3);
    expect(elevationTokens.dark[2].shadowOpacity).toBe(0.4);
    expect(elevationTokens.dark[3].shadowOpacity).toBe(0.5);
  });

  it('verifies spacing and radius tokens from architecture §19.5', () => {
    expect(space.xs).toBe(4);
    expect(space.sm).toBe(8);
    expect(space.md).toBe(16);
    expect(space.lg).toBe(24);
    expect(space.xl).toBe(32);
    expect(space.screen).toBe(20);

    expect(radius.sm).toBe(8);
    expect(radius.md).toBe(12);
    expect(radius.lg).toBe(16);
    expect(radius.xl).toBe(24);
    expect(radius.full).toBe(9999);
  });

  it('verifies V2 typography scale and font families from architecture §19.4', () => {
    expect(fonts.inter).toBe('Inter_400Regular');
    expect(fonts.interMedium).toBe('Inter_500Medium');
    expect(fonts.interSemi).toBe('Inter_600SemiBold');
    expect(fonts.interBold).toBe('Inter_700Bold');
    expect(fonts.newsreader).toBe('Newsreader_400Regular');
    expect(fonts.newsreaderSemi).toBe('Newsreader_600SemiBold');

    expect(type.display.fontSize).toBe(28);
    expect(type.display.lineHeight).toBe(34);
    expect(type.display.fontFamily).toBe(fonts.interBold);

    expect(type.h1.fontSize).toBe(24);
    expect(type.h1.lineHeight).toBe(30);

    expect(type.h2.fontSize).toBe(20);
    expect(type.h2.lineHeight).toBe(26);

    expect(type.body.fontSize).toBe(15);
    expect(type.body.lineHeight).toBe(22);
    expect(type.body.fontFamily).toBe(fonts.inter);

    expect(type.caption.fontSize).toBe(13);
    expect(type.caption.lineHeight).toBe(18);

    expect(type.badge.fontSize).toBe(12);
    expect(type.badge.lineHeight).toBe(16);
    expect(type.badge.fontFamily).toBe(fonts.interMedium);

    expect(type.sectionNumber.fontSize).toBe(40);
    expect(type.sectionNumber.fontFamily).toBe(fonts.newsreaderSemi);

    expect(type.provision.fontSize).toBe(21);
    expect(type.provision.fontFamily).toBe(fonts.newsreader);
  });

  it('meets WCAG 2.1 AA contrast ratio (>= 4.5:1) for body text and primary actions', () => {
    const textPairs = [
      // Light theme pairs
      { name: 'Light ink on bg', fg: palette.light.ink, bg: palette.light.bg, min: 4.5 },
      { name: 'Light ink on bgRaised', fg: palette.light.ink, bg: palette.light.bgRaised, min: 4.5 },
      { name: 'Light inkMuted on bg', fg: palette.light.inkMuted, bg: palette.light.bg, min: 4.5 },
      { name: 'Light inkMuted on bgRaised', fg: palette.light.inkMuted, bg: palette.light.bgRaised, min: 4.5 },
      { name: 'Light primary on bg', fg: palette.light.primary, bg: palette.light.bg, min: 4.5 },
      { name: 'Light danger on bg', fg: palette.light.danger, bg: palette.light.bg, min: 4.5 },

      // Dark theme pairs
      { name: 'Dark ink on bg', fg: palette.dark.ink, bg: palette.dark.bg, min: 4.5 },
      { name: 'Dark ink on bgRaised', fg: palette.dark.ink, bg: palette.dark.bgRaised, min: 4.5 },
      { name: 'Dark inkMuted on bg', fg: palette.dark.inkMuted, bg: palette.dark.bg, min: 4.5 },
      { name: 'Dark inkMuted on bgRaised', fg: palette.dark.inkMuted, bg: palette.dark.bgRaised, min: 4.5 },
      { name: 'Dark primary on bg', fg: palette.dark.primary, bg: palette.dark.bg, min: 4.5 },
      { name: 'Dark accent on bg', fg: palette.dark.accent, bg: palette.dark.bg, min: 4.5 },
      { name: 'Dark danger on bg', fg: palette.dark.danger, bg: palette.dark.bg, min: 4.5 },
    ];

    for (const { name, fg, bg, min } of textPairs) {
      const ratio = contrastRatio(fg, bg);
      expect(ratio, `${name} failed WCAG AA with ratio ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(min);
    }
  });

  it('reports the reduced-motion duration for all motion kinds', () => {
    expect(motionDuration('screen', true)).toBe(0);
    expect(motionDuration('card', true)).toBe(0);
    expect(motionDuration('sheet', true)).toBe(0);
    expect(motionDuration('onboarding', true)).toBe(0);
    expect(motionDuration('trivia', true)).toBe(0);

    expect(motionDuration('screen', false)).toBe(300);
    expect(motionDuration('card', false)).toBe(150);
    expect(motionDuration('sheet', false)).toBe(250);
    expect(motionDuration('onboarding', false)).toBe(400);
    expect(motionDuration('trivia', false)).toBe(300);
  });
});
