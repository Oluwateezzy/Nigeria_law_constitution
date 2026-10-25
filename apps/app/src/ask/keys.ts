import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { OwnKey } from './send';

const storageKey = 'own-api-key';

export async function readOwnKey(): Promise<OwnKey | null> {
  const raw = await readRaw();
  if (!raw) return null;
  const parsed = JSON.parse(raw) as OwnKey;
  if (parsed.provider !== 'openai' && parsed.provider !== 'anthropic') return null;
  if (!parsed.secret) return null;
  return parsed;
}

export async function writeOwnKey(value: OwnKey | null): Promise<void> {
  if (!value) {
    await removeRaw();
    return;
  }
  await writeRaw(JSON.stringify(value));
}

async function readRaw(): Promise<string | null> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(storageKey);
  }
  return SecureStore.getItemAsync(storageKey);
}

async function writeRaw(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(storageKey, value);
    return;
  }
  await SecureStore.setItemAsync(storageKey, value);
}

async function removeRaw(): Promise<void> {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(storageKey);
    return;
  }
  await SecureStore.deleteItemAsync(storageKey);
}
