import { plusOffer } from '@nigeria-law/domain';

type PurchasesModule = (typeof import('react-native-purchases'))['default'];

async function purchases(installId: string): Promise<PurchasesModule | null> {
  const key = process.env.EXPO_PUBLIC_REVENUECAT_SDK_KEY;
  if (!key) return null;
  try {
    const loaded = await import('react-native-purchases');
    loaded.default.configure({ apiKey: key, appUserID: installId });
    return loaded.default;
  } catch {
    return null;
  }
}

export async function purchaseStore(
  installId: string,
): Promise<'purchased' | 'cancelled' | 'unavailable'> {
  const client = await purchases(installId);
  if (!client) return 'unavailable';
  try {
    const offerings = await client.getOfferings();
    const packages = offerings.current?.availablePackages ?? [];
    const chosen =
      packages.find(
        (item) =>
          item.identifier === plusOffer.productId ||
          item.product.identifier === plusOffer.productId,
      ) ?? offerings.current?.monthly;
    if (!chosen) return 'unavailable';
    await client.purchasePackage(chosen);
    return 'purchased';
  } catch (error) {
    const cancelled =
      typeof error === 'object' &&
      error !== null &&
      'userCancelled' in error &&
      error.userCancelled === true;
    return cancelled ? 'cancelled' : 'unavailable';
  }
}

export async function restoreStore(
  installId: string,
): Promise<'restored' | 'unavailable'> {
  const client = await purchases(installId);
  if (!client) return 'unavailable';
  try {
    await client.restorePurchases();
    return 'restored';
  } catch {
    return 'unavailable';
  }
}

export async function aliasStore(userId: string): Promise<void> {
  const key = process.env.EXPO_PUBLIC_REVENUECAT_SDK_KEY;
  if (!key) return;
  try {
    const loaded = await import('react-native-purchases');
    await loaded.default.logIn(userId);
  } catch {
    // The server alias still runs. The store alias retries on the next sign-in.
  }
}
