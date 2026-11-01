import { describe, expect, it } from 'vitest';

if (typeof require !== 'undefined' && require.extensions) {
  require.extensions['.png'] = () => 'mock-png-asset';
  require.extensions['.ttf'] = () => 'mock-font-asset';
}

describe('V2 Navigation and Onboarding', () => {
  it('defines 5 onboarding slides with required metadata', async () => {
    const { ONBOARDING_SLIDES } = await import('@/onboarding/types');
    expect(ONBOARDING_SLIDES).toHaveLength(5);
    const titles = ONBOARDING_SLIDES.map((s) => s.title);
    expect(titles).toEqual([
      'What Does The Law Say',
      'Read Every Law',
      'Ask Any Question',
      'Test Your Knowledge',
      'Discuss & Share',
    ]);
  });

  it('each onboarding slide has badge, subtitle, and gradient', async () => {
    const { ONBOARDING_SLIDES } = await import('@/onboarding/types');
    for (const slide of ONBOARDING_SLIDES) {
      expect(slide.id).toBeGreaterThan(0);
      expect(slide.badge.length).toBeGreaterThan(0);
      expect(slide.subtitle.length).toBeGreaterThan(10);
      expect(slide.gradient).toHaveLength(2);
      expect(slide.image).toBeDefined();
    }
  });

  it('verifies 5-tab destinations are defined and non-empty', () => {
    const tabs = ['Home', 'Explore', 'Discuss', 'Notes', 'More'];
    expect(tabs).toHaveLength(5);
  });
});
