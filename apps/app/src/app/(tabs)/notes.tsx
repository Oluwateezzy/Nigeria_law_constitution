import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';

export default function NotesScreen() {
  return (
    <Screen>
      <TopBar title="Notes" />
      <EmptyState message={copy.notes.empty} />
    </Screen>
  );
}
