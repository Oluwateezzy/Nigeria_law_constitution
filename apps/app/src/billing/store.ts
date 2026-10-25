export async function purchaseStore(
  _installId: string,
): Promise<'purchased' | 'cancelled' | 'unavailable'> {
  return 'unavailable';
}

export async function restoreStore(
  _installId: string,
): Promise<'restored' | 'unavailable'> {
  return 'unavailable';
}

export async function aliasStore(_userId: string): Promise<void> {}
