import { router } from 'expo-router';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';

export default function LibraryScreen() {
  return (
    <Screen>
      <TopBar
        title={copy.productName}
        actionLabel="Settings"
        onAction={() => router.push('/settings')}
      />
      <SearchField />
      <EmptyState message={copy.library.constitutionEmpty} />
    </Screen>
  );
}
