import { ScenarioScreen } from '@/components/ScenarioScreen';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';

export default function ScenarioRoute() {
  return (
    <Screen>
      <TopBar title={copy.scenario.title} />
      <ScenarioScreen />
    </Screen>
  );
}
