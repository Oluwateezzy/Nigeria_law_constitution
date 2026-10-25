import {
  outlineModel,
  shippingInstrument,
  type OutlineSection,
  type OutlineUnit,
} from '@nigeria-law/content';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useSyncExternalStore } from 'react';
import { ScrollView, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { OutlineRow } from '@/components/OutlineRow';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import {
  getExpanded,
  subscribeExpanded,
  toggleExpanded,
} from '@/reader/expanded';
import { readerHref } from '@/reader/linking';

export function OutlineScreen() {
  const params = useLocalSearchParams<{ instrumentId: string }>();
  const instrumentId = firstParam(params.instrumentId);
  const instrument = shippingInstrument();
  const units = outlineModel(instrument);

  if (instrument.id !== instrumentId) {
    return (
      <Screen edges={['top', 'bottom']}>
        <TopBar
          title={copy.reader.library}
          actionLabel={copy.reader.library}
          onAction={() => router.replace('/' as Href)}
        />
        <EmptyState message={copy.reader.unknownInstrument} />
      </Screen>
    );
  }

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={instrument.shortTitle}
        actionLabel={copy.settings.close}
        onAction={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/' as Href);
        }}
      />
      <ScrollView style={{ flex: 1 }}>
        {units.map((unit) => (
          <UnitBlock
            key={unit.id}
            unit={unit}
            depth={0}
            instrumentId={instrument.id}
          />
        ))}
      </ScrollView>
    </Screen>
  );
}

function UnitBlock({
  unit,
  depth,
  instrumentId,
}: {
  unit: OutlineUnit;
  depth: number;
  instrumentId: string;
}) {
  const expanded = useSyncExternalStore(
    subscribeExpanded,
    getExpanded,
    getExpanded,
  );
  const open = expanded.has(unit.id);
  return (
    <View>
      <OutlineRow
        title={unit.heading}
        kicker={outlineKicker(unit)}
        depth={depth}
        expanded={open}
        onPress={() => toggleExpanded(unit.id)}
      />
      {open ? (
        <View>
          {unit.sections.map((section) => (
            <SectionBlock
              key={section.id}
              section={section}
              depth={depth + 1}
              instrumentId={instrumentId}
            />
          ))}
          {unit.units.map((child) => (
            <UnitBlock
              key={child.id}
              unit={child}
              depth={depth + 1}
              instrumentId={instrumentId}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function SectionBlock({
  section,
  depth,
  instrumentId,
}: {
  section: OutlineSection;
  depth: number;
  instrumentId: string;
}) {
  const same =
    section.heading &&
    section.heading.toLowerCase() === section.number.toLowerCase();
  return (
    <OutlineRow
      title={section.heading ?? section.number}
      kicker={same ? null : section.number}
      depth={depth}
      onPress={() =>
        router.push(readerHref(instrumentId, section.number) as Href)
      }
    />
  );
}

function outlineKicker(unit: OutlineUnit): string | null {
  if (!unit.number) {
    return null;
  }
  if (unit.kind === 'chapter') {
    return `Chapter ${unit.number}`;
  }
  if (unit.kind === 'part') {
    return `Part ${unit.number}`;
  }
  if (unit.kind === 'schedule' && !unit.heading.startsWith(unit.number)) {
    return `${unit.number} Schedule`;
  }
  return null;
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}
