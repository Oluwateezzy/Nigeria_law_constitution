import { describe, expect, it } from 'vitest';
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

  it('reports the reduced-motion duration', () => {
    expect(motionDuration('section', true)).toBe(0);
    expect(motionDuration('sheet', true)).toBe(0);
    expect(motionDuration('section', false)).toBe(220);
    expect(motionDuration('sheet', false)).toBe(200);
  });
});
