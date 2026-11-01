import { describe, expect, it } from 'vitest';
import { getElevation } from './elevation';
import { getGlassStyle } from './glass';
import { easings, motion, motionDuration, springConfig } from './motion';
import { palette } from './tokens';

describe('V2 Theme Utilities (V2-P1-T4)', () => {
  it('returns valid elevation styles for light and dark schemes', () => {
    const lightL1 = getElevation(1, 'light');
    const lightL2 = getElevation(2, 'light');
    const lightL3 = getElevation(3, 'light');
    const darkL1 = getElevation(1, 'dark');

    expect(lightL1).toBeDefined();
    expect(lightL2).toBeDefined();
    expect(lightL3).toBeDefined();
    expect(darkL1).toBeDefined();
  });

  it('generates platform-aware glassmorphism styles', () => {
    const glassLight = getGlassStyle('light');
    const glassDark = getGlassStyle('dark');

    expect(glassLight.backgroundColor).toBe(palette.light.bgGlass);
    expect(glassLight.borderColor).toBe(palette.light.line);

    expect(glassDark.backgroundColor).toBe(palette.dark.bgGlass);
    expect(glassDark.borderColor).toBe(palette.dark.line);

    const glassNoBorder = getGlassStyle('light', { border: false });
    expect(glassNoBorder.borderWidth).toBeUndefined();
  });

  it('provides V2 motion durations and respect reduced-motion flag', () => {
    expect(motion.screen).toBe(300);
    expect(motion.card).toBe(150);
    expect(motion.sheet).toBe(250);
    expect(motion.onboarding).toBe(400);
    expect(motion.trivia).toBe(300);
    expect(motion.tab).toBe(200);
    expect(motion.shimmer).toBe(1500);

    // Reduced motion returns 0 for instant feedback
    expect(motionDuration('screen', true)).toBe(0);
    expect(motionDuration('card', true)).toBe(0);
    expect(motionDuration('sheet', true)).toBe(0);
    expect(motionDuration('shimmer', true)).toBe(0);

    // Standard motion returns full duration
    expect(motionDuration('screen', false)).toBe(300);
    expect(motionDuration('card', false)).toBe(150);
    expect(motionDuration('sheet', false)).toBe(250);
    expect(motionDuration('shimmer', false)).toBe(1500);
  });

  it('provides spring configs for sheet and onboarding transitions', () => {
    expect(springConfig.sheet.damping).toBe(20);
    expect(springConfig.sheet.stiffness).toBe(100);

    expect(springConfig.onboarding.damping).toBe(25);
    expect(springConfig.onboarding.stiffness).toBe(120);
  });

  it('provides easing curves for animations', () => {
    expect(easings.linear(0.5)).toBe(0.5);
    expect(easings.easeOut(0)).toBe(0);
    expect(easings.easeOut(1)).toBe(1);
    expect(easings.easeInOut(0)).toBe(0);
    expect(easings.easeInOut(1)).toBe(1);
    expect(easings.curves.easeInOut).toEqual([0.42, 0, 0.58, 1]);
    expect(easings.curves.easeOut).toEqual([0, 0, 0.2, 1]);
  });
});
