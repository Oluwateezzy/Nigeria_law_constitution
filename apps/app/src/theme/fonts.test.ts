import { describe, expect, it } from 'vitest';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Newsreader_400Regular,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import { fonts } from './tokens';

describe('V2 Typography & Font Loading (V2-P1-T3)', () => {
  it('exports valid font assets from @expo-google-fonts/inter', () => {
    expect(Inter_400Regular).toBeDefined();
    expect(Inter_500Medium).toBeDefined();
    expect(Inter_600SemiBold).toBeDefined();
    expect(Inter_700Bold).toBeDefined();
  });

  it('exports valid font assets from @expo-google-fonts/newsreader', () => {
    expect(Newsreader_400Regular).toBeDefined();
    expect(Newsreader_600SemiBold).toBeDefined();
  });

  it('matches token font family names to font definitions', () => {
    expect(fonts.inter).toBe('Inter_400Regular');
    expect(fonts.interMedium).toBe('Inter_500Medium');
    expect(fonts.interSemi).toBe('Inter_600SemiBold');
    expect(fonts.interBold).toBe('Inter_700Bold');
    expect(fonts.newsreader).toBe('Newsreader_400Regular');
    expect(fonts.newsreaderSemi).toBe('Newsreader_600SemiBold');
  });
});
