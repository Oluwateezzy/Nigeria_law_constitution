import { shouldAliasPurchase } from '@nigeria-law/domain';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';
import { readSupabasePublicConfig } from '@/account/client';
import { aliasStore, purchaseStore, restoreStore } from './store';

export type PurchaseResult =
  | { kind: 'started' }
  | { kind: 'purchased' }
  | { kind: 'restored' }
  | { kind: 'cancelled' }
  | { kind: 'unavailable' };

export async function purchasePlus(input: {
  installId: string;
  accessToken: string | null;
}): Promise<PurchaseResult> {
  if (Platform.OS === 'web') return startCheckout(input, 'checkout');
  const result = await purchaseStore(input.installId);
  if (result === 'purchased') return { kind: 'purchased' };
  if (result === 'cancelled') return { kind: 'cancelled' };
  return { kind: 'unavailable' };
}

export async function restorePlus(input: {
  installId: string;
}): Promise<PurchaseResult> {
  if (Platform.OS === 'web') return { kind: 'unavailable' };
  const result = await restoreStore(input.installId);
  return result === 'restored' ? { kind: 'restored' } : { kind: 'unavailable' };
}

export async function managePlus(input: {
  installId: string;
  accessToken: string | null;
}): Promise<PurchaseResult> {
  if (Platform.OS !== 'web') return { kind: 'unavailable' };
  return startCheckout(input, 'portal');
}

export async function aliasPurchase(input: {
  userId: string | null;
  installId: string;
  accessToken: string | null;
}): Promise<void> {
  if (!shouldAliasPurchase(input.userId) || !input.installId) return;
  await aliasStore(input.userId);
  const config = readSupabasePublicConfig();
  if (!config || !input.accessToken) return;
  await fetch(`${config.url}/functions/v1/billing`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: config.anonKey,
      Authorization: `Bearer ${input.accessToken}`,
    },
    body: JSON.stringify({ action: 'alias', installId: input.installId }),
  });
}

async function startCheckout(
  input: { installId: string; accessToken: string | null },
  action: 'checkout' | 'portal',
): Promise<PurchaseResult> {
  const config = readSupabasePublicConfig();
  if (!config || !input.installId) return { kind: 'unavailable' };
  const response = await fetch(`${config.url}/functions/v1/billing`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      apikey: config.anonKey,
      Authorization: `Bearer ${input.accessToken ?? config.anonKey}`,
    },
    body: JSON.stringify({ action, installId: input.installId }),
  });
  if (!response.ok) return { kind: 'unavailable' };
  const payload = (await response.json()) as { url?: string };
  if (!payload.url) return { kind: 'unavailable' };
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.assign(payload.url);
    return { kind: 'started' };
  }
  await WebBrowser.openBrowserAsync(payload.url);
  return { kind: 'started' };
}
