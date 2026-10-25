import { useEffect } from 'react';
import { shouldAliasPurchase } from '@nigeria-law/domain';
import { useAccount } from '@/account/AuthProvider';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { aliasPurchase } from './purchase';

export function PlusAlias() {
  const account = useAccount();
  const preferences = usePreferences();
  useEffect(() => {
    if (!shouldAliasPurchase(account.userId)) return;
    void aliasPurchase({
      userId: account.userId,
      installId: preferences.installId,
      accessToken: account.accessToken,
    });
  }, [account.accessToken, account.userId, preferences.installId]);
  return null;
}
