import { DisclaimerLine } from '@/components/DisclaimerLine';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';

export default function ScenarioScreen() {
  return (
    <Screen>
      <TopBar title="Scenario" />
      <EmptyState message={copy.scenario.empty} />
      <DisclaimerLine />
    </Screen>
  );
}
