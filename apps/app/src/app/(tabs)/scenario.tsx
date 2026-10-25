import { DisclaimerLine } from '@/components/DisclaimerLine';
import { DisclosurePanel } from '@/components/DisclosurePanel';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';

export default function ScenarioScreen() {
  const { ready, disclosureAccepted, acceptDisclosure } = usePreferences();
  return (
    <Screen>
      <TopBar title={copy.scenario.title} />
      {ready && !disclosureAccepted ? (
        <DisclosurePanel onContinue={acceptDisclosure} />
      ) : null}
      <EmptyState message={copy.scenario.empty} />
      <DisclaimerLine />
    </Screen>
  );
}
