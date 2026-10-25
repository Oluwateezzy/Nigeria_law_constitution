import AsyncStorage from '@react-native-async-storage/async-storage';
import { MemoryDatabase } from './database';

const storageKey = 'local-database';

export async function openDeviceDatabase(): Promise<MemoryDatabase> {
  const raw = await AsyncStorage.getItem(storageKey);
  return MemoryDatabase.load(parseSnapshot(raw), async (snapshot) => {
    await AsyncStorage.setItem(storageKey, JSON.stringify(snapshot));
  });
}

function parseSnapshot(raw: string | null): Record<string, string> {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
}
