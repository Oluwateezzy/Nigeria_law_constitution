import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-font', () => ({
  useFonts: vi.fn(),
  loadAsync: vi.fn(),
}));

if (typeof require !== 'undefined' && require.extensions) {
  require.extensions['.ttf'] = () => 'mock-font-asset';
}

describe('V2 Typography & Font Loading (V2-P1-T3)', () => {
  it('exports valid font assets from @expo-google-fonts/inter and @expo-google-fonts/newsreader', async () => {
    const inter = await import('@expo-google-fonts/inter');
    const newsreader = await import('@expo-google-fonts/newsreader');
    const { fonts } = await import('./tokens');

    expect(inter.Inter_400Regular).toBeDefined();
    expect(inter.Inter_500Medium).toBeDefined();
    expect(inter.Inter_600SemiBold).toBeDefined();
    expect(inter.Inter_700Bold).toBeDefined();

    expect(newsreader.Newsreader_400Regular).toBeDefined();
    expect(newsreader.Newsreader_600SemiBold).toBeDefined();

    expect(fonts.inter).toBe('Inter_400Regular');
    expect(fonts.interMedium).toBe('Inter_500Medium');
    expect(fonts.interSemi).toBe('Inter_600SemiBold');
    expect(fonts.interBold).toBe('Inter_700Bold');
    expect(fonts.newsreader).toBe('Newsreader_400Regular');
    expect(fonts.newsreaderSemi).toBe('Newsreader_600SemiBold');
  });
});
