import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';
import { motionDuration } from './motion';
import { palette } from './tokens';

describe('theme tokens', () => {
  it('lists the palette hex values', () => {
    expect(palette).toEqual({
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
    });
  });

  it('keeps ink and accent at 4.5:1 on both backgrounds', () => {
    const pairs = [
      [palette.light.ink, palette.light.bg, 15.8],
      [palette.light.accent, palette.light.bg, 11.25],
      [palette.dark.ink, palette.dark.bg, 16.05],
      [palette.dark.accent, palette.dark.bg, 10.12],
    ] as const;
    for (const [foreground, background, ratio] of pairs) {
      const contrast = contrastRatio(foreground, background);
      expect(contrast).toBeGreaterThanOrEqual(4.5);
      expect(contrast).toBeCloseTo(ratio, 1);
    }
  });

  it('reports the reduced-motion duration', () => {
    expect(motionDuration('section', true)).toBe(0);
    expect(motionDuration('sheet', true)).toBe(0);
    expect(motionDuration('section', false)).toBe(220);
    expect(motionDuration('sheet', false)).toBe(200);
  });
});
