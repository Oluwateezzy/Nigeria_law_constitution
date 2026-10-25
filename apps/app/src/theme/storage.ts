import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemePreferenceStore } from './preference';

export const themePreferenceStore: ThemePreferenceStore = {
  getItem(key) {
    return AsyncStorage.getItem(key);
  },
  setItem(key, value) {
    return AsyncStorage.setItem(key, value);
  },
};
