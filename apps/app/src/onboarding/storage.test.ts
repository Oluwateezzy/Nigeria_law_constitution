import { describe, expect, it } from 'vitest';
import {
  hasCompletedOnboarding,
  setCompletedOnboarding,
  resetOnboarding,
  type OnboardingStorage,
} from './storage';

function createMockStorage(initialState: Record<string, string> = {}): OnboardingStorage {
  const store = new Map<string, string>(Object.entries(initialState));
  return {
    getItem: async (key: string) => store.get(key) ?? null,
    setItem: async (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: async (key: string) => {
      store.delete(key);
    },
  };
}

describe('onboarding storage', () => {
  it('defaults to false for new users', async () => {
    const storage = createMockStorage();
    const completed = await hasCompletedOnboarding(storage);
    expect(completed).toBe(false);
  });

  it('sets hasCompletedOnboarding to true and persists', async () => {
    const storage = createMockStorage();
    await setCompletedOnboarding(true, storage);
    const completed = await hasCompletedOnboarding(storage);
    expect(completed).toBe(true);
  });

  it('resets onboarding state when requested', async () => {
    const storage = createMockStorage({ '@nigeria_law_has_completed_onboarding': 'true' });
    expect(await hasCompletedOnboarding(storage)).toBe(true);
    await resetOnboarding(storage);
    expect(await hasCompletedOnboarding(storage)).toBe(false);
  });

  it('handles read errors gracefully without throwing', async () => {
    const brokenStorage: OnboardingStorage = {
      getItem: async () => {
        throw new Error('Disk full');
      },
      setItem: async () => {},
      removeItem: async () => {},
    };
    const completed = await hasCompletedOnboarding(brokenStorage);
    expect(completed).toBe(false);
  });
});
