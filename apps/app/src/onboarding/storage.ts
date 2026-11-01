import AsyncStorage from '@react-native-async-storage/async-storage';

export const ONBOARDING_COMPLETED_KEY = '@nigeria_law_has_completed_onboarding';

export interface OnboardingStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

export const defaultStorage: OnboardingStorage = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export async function hasCompletedOnboarding(
  storage: OnboardingStorage = defaultStorage,
): Promise<boolean> {
  try {
    const value = await storage.getItem(ONBOARDING_COMPLETED_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function setCompletedOnboarding(
  completed: boolean = true,
  storage: OnboardingStorage = defaultStorage,
): Promise<void> {
  try {
    if (completed) {
      await storage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    } else {
      await storage.removeItem(ONBOARDING_COMPLETED_KEY);
    }
  } catch {
    // Ignore storage write errors on sandboxed environments
  }
}

export async function resetOnboarding(
  storage: OnboardingStorage = defaultStorage,
): Promise<void> {
  await setCompletedOnboarding(false, storage);
}
