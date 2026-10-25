import { router } from 'expo-router';
import { PlusPurchase } from '@/billing/PlusPurchase';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';

export default function PlusScreen() {
  const preferences = usePreferences();
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={copy.ask.plusTitle}
        actionLabel={copy.settings.close}
        onAction={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/settings/ai');
        }}
      />
      <PlusPurchase lane={preferences.quota.lane ?? 'free'} showPrice />
    </Screen>
  );
}
