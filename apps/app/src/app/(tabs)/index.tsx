import {
  findSection,
  registryEntries,
  shippingInstrument,
} from '@nigeria-law/content';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { ContinueCard } from '@/components/ContinueCard';
import { InstrumentRow } from '@/components/InstrumentRow';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { catalogueRows, continueSectionLabel } from '@/reader/library';
import { readerHref } from '@/reader/linking';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function LibraryScreen() {
  const { colors } = useTheme();
  const instrument = shippingInstrument();
  const catalogue = catalogueRows({
    instruments: [instrument],
    registry: registryEntries(),
  });
  const { ready, position, refreshPosition } = usePreferences();
  useFocusEffect(
    useCallback(() => {
      refreshPosition();
    }, [refreshPosition]),
  );
  const located = position
    ? findSection(instrument, position.sectionId)
    : undefined;

  return (
    <Screen>
      <TopBar
        title={copy.productName}
        actionLabel="Settings"
        onAction={() => router.push('/settings')}
      />
      <SearchField />
      <ScrollView style={{ flex: 1 }}>
        {ready && position ? (
          <ContinueCard
            kicker={copy.library.continue}
            title={instrument.shortTitle}
            detail={continueSectionLabel(
              located
                ? {
                    number: located.section.number,
                    heading: located.section.heading,
                  }
                : null,
              position.sectionId,
            )}
            onPress={() => {
              if (!located) {
                return;
              }
              router.push(
                readerHref(
                  instrument.id,
                  located.section.number,
                  position.anchor,
                ) as Href,
              );
            }}
          />
        ) : null}
        <View style={{ marginTop: space.unit * 4 }}>
          {catalogue.constitutions.map((item) => (
            <InstrumentRow
              key={item.id}
              title={item.shortTitle}
              detail={item.versionLabel}
              onPress={() => router.push(`/read/${item.id}` as Href)}
            />
          ))}
        </View>
        {catalogue.acts.length > 0 ? (
          <View style={{ marginTop: space.unit * 6 }}>
            <Text
              style={{
                color: colors.ink,
                fontSize: typeScale.heading.fontSize,
                lineHeight: typeScale.heading.lineHeight,
              }}
            >
              {copy.library.acts}
            </Text>
            {catalogue.acts.map((item) => (
              <InstrumentRow
                key={item.id}
                title={item.shortTitle}
                detail={item.versionLabel}
                onPress={() => router.push(`/read/${item.id}` as Href)}
              />
            ))}
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}
