import {
  findSection,
  registryEntries,
  shippingInstruments,
} from '@nigeria-law/content';
import {
  router,
  useFocusEffect,
  useLocalSearchParams,
  type Href,
} from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
  type TextInputInstance,
} from 'react-native';
import { ContinueCard } from '@/components/ContinueCard';
import { GradientCard } from '@/components/GradientCard';
import { InstrumentRow } from '@/components/InstrumentRow';
import { PressableCard } from '@/components/PressableCard';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { SearchResultRow } from '@/components/SearchResultRow';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';
import {
  actRowDetail,
  catalogueRows,
  continueSectionLabel,
} from '@/reader/library';
import { readerHref } from '@/reader/linking';
import { activeResultIndex, searchCursor } from '@/search/keyboard';
import { useSearch } from '@/search/SearchProvider';
import type { SearchResult } from '@/search/repository';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function ExploreScreen() {
  const { colors, scheme, elevation, gradient, reduceMotion } = useTheme();
  const scrollRef = useRef<ScrollViewInstance>(null);
  const instruments = shippingInstruments();
  const catalogue = catalogueRows({
    instruments: instruments.map((item) => ({
      id: item.id,
      kind: item.kind,
      shortTitle: item.shortTitle,
      versionLabel: item.versionLabel,
      year: item.year,
      extent: item.extent,
      reviewStatus: item.review.status,
    })),
    registry: registryEntries(),
  });
  const { ready, position, refreshPosition, recentQueries, rememberSearch } =
    usePreferences();
  const searchIndex = useSearch();
  const params = useLocalSearchParams<{
    fromInstrument?: string | string[];
    q?: string | string[];
  }>();
  const fromInstrument = firstParam(params.fromInstrument);
  const presetQuery = firstParam(params.q);
  const [query, setQuery] = useState(presetQuery);
  const [focused, setFocused] = useState(presetQuery.length > 0);
  const [appliedPreset, setAppliedPreset] = useState(presetQuery);
  if (presetQuery !== appliedPreset) {
    setAppliedPreset(presetQuery);
    if (presetQuery) {
      setQuery(presetQuery);
      setFocused(true);
    }
  }
  const [limitedInstrument, setLimitedInstrument] = useState<string | null>(
    null,
  );
  const [results, setResults] = useState<SearchResult[]>([]);
  const [cursor, setCursor] = useState({ query: presetQuery, index: 0 });
  const inputRef = useRef<TextInputInstance>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const limitToInstrument =
    fromInstrument.length > 0 && limitedInstrument === fromInstrument;
  const requestId = useRef(0);

  const runSearch = useCallback(
    (value: string, limited: boolean) => {
      const id = requestId.current + 1;
      requestId.current = id;
      const trimmed = value.trim();
      if (!searchIndex.ready || trimmed.length === 0) {
        setResults([]);
        return;
      }
      void searchIndex
        .search(value, limited ? fromInstrument : null)
        .then((next) => {
          if (requestId.current === id) setResults(next);
        });
    },
    [fromInstrument, searchIndex],
  );

  useFocusEffect(
    useCallback(() => {
      refreshPosition();
      scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    }, [refreshPosition, reduceMotion]),
  );

  useEffect(() => {
    return () => {
      if (blurTimer.current) clearTimeout(blurTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!fromInstrument) return;
    inputRef.current?.focus();
  }, [fromInstrument]);

  useEffect(() => {
    if (!searchIndex.ready) return;
    const pending = Promise.resolve().then(() => {
      runSearch(query, limitToInstrument);
    });
    return () => {
      void pending;
    };
  }, [limitToInstrument, query, runSearch, searchIndex.ready]);

  const reading = position
    ? instruments.find((item) => findSection(item, position.sectionId))
    : undefined;
  const located =
    reading && position ? findSection(reading, position.sectionId) : null;
  const searching = query.trim().length > 0;
  const showRecent = focused && !searching && recentQueries.length > 0;

  const openResult = useCallback(
    (result: SearchResult) => {
      rememberSearch(query);
      router.push(
        readerHref(result.instrumentId, result.number, result.anchor) as Href,
      );
    },
    [query, rememberSearch],
  );

  const highlighted = activeResultIndex(query, cursor, results.length);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (query.trim()) url.searchParams.set('q', query);
    else url.searchParams.delete('q');
    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next !== current) {
      window.history.replaceState(window.history.state, '', next);
    }
  }, [query]);

  return (
    <Screen>
      <TopBar
        title="Explore Legal Instruments"
        actionLabel="Settings"
        onAction={() => router.push('/settings')}
      />

      {/* V2 Search Field */}
      <SearchField
        value={query}
        inputRef={inputRef}
        autoFocus={fromInstrument.length > 0}
        onChangeText={(value) => {
          setQuery(value);
          runSearch(value, limitToInstrument);
        }}
        onFocus={() => {
          if (blurTimer.current) clearTimeout(blurTimer.current);
          setFocused(true);
        }}
        onBlur={() => {
          blurTimer.current = setTimeout(() => setFocused(false), 300);
        }}
        onClear={() => {
          setQuery('');
          setResults([]);
          inputRef.current?.focus();
        }}
      />

      {fromInstrument ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.search.inThisInstrument}
          accessibilityState={{ selected: limitToInstrument }}
          onPress={() => {
            const next = limitToInstrument ? null : fromInstrument;
            setLimitedInstrument(next);
            runSearch(query, next === fromInstrument);
          }}
          style={[
            styles.filterChip,
            {
              borderColor: limitToInstrument ? colors.primary : colors.line,
              backgroundColor: limitToInstrument
                ? colors.primary
                : colors.bgRaised,
            },
          ]}
        >
          <Text
            style={[
              styles.filterChipText,
              { color: limitToInstrument ? '#FFFFFF' : colors.ink },
            ]}
          >
            {copy.search.inThisInstrument}
          </Text>
        </Pressable>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {searching ? (
          /* Search Results Overlay */
          <View style={styles.resultsContainer}>
            {!searchIndex.ready ? (
              <View style={{ gap: space.sm, paddingVertical: space.sm }}>
                <SkeletonLoader height={60} borderRadius={radius.card} />
                <SkeletonLoader height={60} borderRadius={radius.card} />
                <SkeletonLoader height={60} borderRadius={radius.card} />
              </View>
            ) : null}
            {searchIndex.ready && results.length === 0 ? (
              <Text style={[styles.statusText, { color: colors.inkMuted }]}>
                {copy.search.noResults}
              </Text>
            ) : null}
            {results.map((result, index) => (
              <SearchResultRow
                key={`${result.sectionId}:${result.anchor ?? ''}`}
                result={result}
                selected={searching && index === highlighted}
                onPress={() => openResult(result)}
              />
            ))}
          </View>
        ) : (
          <View>
            {/* Recent Searches */}
            {showRecent ? (
              <View style={styles.recentSection}>
                <Text style={[styles.recentTitle, { color: colors.inkMuted }]}>
                  {copy.search.recent}
                </Text>
                {recentQueries.map((item) => (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityLabel={item}
                    onPress={() => {
                      setQuery(item);
                      runSearch(item, limitToInstrument);
                      inputRef.current?.focus();
                    }}
                    style={[
                      styles.recentRow,
                      { borderBottomColor: colors.line },
                    ]}
                  >
                    <Text style={[styles.recentText, { color: colors.ink }]}>
                      🔍 {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            {/* Master Trivia Entry Card (V2-P3-T2) */}
            <GradientCard
              colors={
                scheme === 'dark'
                  ? ['#2D2200', '#B8860B']
                  : ['#D4A017', '#B8860B']
              }
              onPress={() => router.push('/scenario?q=Trivia%20challenge' as Href)}
              style={styles.triviaMasterCard}
              accessibilityLabel="Know Your Law Master Trivia"
            >
              <View style={styles.triviaHeader}>
                <Text style={styles.triviaBadge}>🏆 MASTER TRIVIA</Text>
                <Text style={styles.triviaStreak}>⚡ Daily Challenge</Text>
              </View>
              <Text style={styles.triviaTitle}>Know Your Law & Rights</Text>
              <Text style={styles.triviaDesc}>
                Test your knowledge across all Nigerian federal laws. Earn
                civic awareness badges and rights streaks.
              </Text>
            </GradientCard>

            {/* Constitution Card with Elevation & Accent (V2-P3-T2) */}
            <View style={styles.sectionHeaderWrap}>
              <Text style={[styles.sectionHeading, { color: colors.ink }]}>
                The Constitution
              </Text>
            </View>
            {catalogue.constitutions.map((item) => (
              <PressableCard
                key={item.id}
                onPress={() => router.push(`/read/${item.id}` as Href)}
                accessibilityLabel={item.shortTitle}
                elevationLevel={2}
                style={[
                  styles.constitutionCard,
                  {
                    borderColor: colors.primary,
                  },
                ]}
                contentStyle={{ flexDirection: 'row' }}
              >
                <View style={styles.constitutionAccentBar} />
                <View style={styles.constitutionBody}>
                  <View style={styles.constitutionTop}>
                    <View
                      style={[
                        styles.lawBadge,
                        { backgroundColor: colors.primarySoft },
                      ]}
                    >
                      <Text
                        style={[styles.lawBadgeText, { color: colors.primary }]}
                      >
                        SUPREME CHARTER
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.constitutionYear,
                        { color: colors.inkMuted },
                      ]}
                    >
                      1999 as amended
                    </Text>
                  </View>
                  <Text
                    style={[styles.constitutionTitle, { color: colors.ink }]}
                  >
                    {item.shortTitle}
                  </Text>
                  <Text
                    style={[
                      styles.constitutionSubtitle,
                      { color: colors.inkMuted },
                    ]}
                  >
                    Fundamental rights, citizenship, legislative, executive &
                    judicature structures.
                  </Text>
                </View>
              </PressableCard>
            ))}

            {/* Crimes & Penalties Entry Card (V2-P3-T2) */}
            <PressableCard
              onPress={() => router.push('/more' as Href)}
              accessibilityLabel="Crimes and Penalties Directory"
              elevationLevel={1}
              style={styles.crimeEntryCard}
              contentStyle={styles.crimeEntryContent}
            >
              <View
                style={[
                  styles.crimeIconWrap,
                  { backgroundColor: colors.dangerSoft },
                ]}
              >
                <Text style={styles.crimeIcon}>⚖️</Text>
              </View>
              <View style={styles.crimeTextWrap}>
                <Text style={[styles.crimeTitle, { color: colors.ink }]}>
                  Crimes, Penalties & Bail Directory
                </Text>
                <Text
                  style={[styles.crimeSubtitle, { color: colors.inkMuted }]}
                >
                  Lookup statutory jail times, fine minimums, and bailable
                  conditions under federal law.
                </Text>
              </View>
              <Text style={[styles.chevron, { color: colors.inkMuted }]}>
                ›
              </Text>
            </PressableCard>

            {/* Acts List with Trivia Chip on Each (V2-P3-T2) */}
            {catalogue.acts.length > 0 ? (
              <View style={styles.actsSection}>
                <Text style={[styles.sectionHeading, { color: colors.ink }]}>
                  {copy.library.acts} & Federal Statutes
                </Text>

                <View style={styles.actsList}>
                  {catalogue.acts.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.actCard,
                        elevation[1],
                        {
                          backgroundColor: colors.bgRaised,
                          borderColor: colors.line,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => router.push(`/read/${item.id}` as Href)}
                        accessibilityRole="button"
                        accessibilityLabel={item.shortTitle}
                        style={styles.actMainPress}
                      >
                        <Text style={[styles.actTitle, { color: colors.ink }]}>
                          {item.shortTitle}
                        </Text>
                        <Text
                          style={[styles.actDetail, { color: colors.inkMuted }]}
                        >
                          {actRowDetail(item)}
                        </Text>
                      </Pressable>

                      {/* Trivia Chip on each Act */}
                      <Pressable
                        onPress={() =>
                          router.push(
                            `/scenario?q=Trivia%20for%20${encodeURIComponent(
                              item.shortTitle,
                            )}` as Href,
                          )
                        }
                        accessibilityRole="button"
                        accessibilityLabel={`Play trivia for ${item.shortTitle}`}
                        style={[
                          styles.triviaChip,
                          { backgroundColor: colors.accentSoft },
                        ]}
                      >
                        <Text
                          style={[
                            styles.triviaChipText,
                            { color: colors.accent },
                          ]}
                        >
                          🎯 Trivia
                        </Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: space.xl,
  },
  filterChip: {
    alignSelf: 'flex-start',
    marginTop: space.sm,
    minHeight: space.target,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  filterChipText: {
    fontFamily: fonts.interMedium,
    fontSize: typeScale.caption.fontSize,
    lineHeight: typeScale.caption.lineHeight,
  },
  resultsContainer: {
    marginTop: space.md,
  },
  statusText: {
    marginTop: space.lg,
    fontSize: typeScale.ui.fontSize,
    lineHeight: typeScale.ui.lineHeight,
    textAlign: 'center',
  },
  recentSection: {
    marginTop: space.md,
  },
  recentTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 12,
    letterSpacing: 0.5,
    marginBottom: space.xs,
  },
  recentRow: {
    minHeight: space.target,
    justifyContent: 'center',
    borderBottomWidth: 1,
  },
  recentText: {
    fontFamily: fonts.interRegular,
    fontSize: 14,
  },
  triviaMasterCard: {
    marginVertical: space.md,
  },
  triviaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  triviaBadge: {
    color: '#FFFFFF',
    fontFamily: fonts.interBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  triviaStreak: {
    color: '#FFF8E1',
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
  },
  triviaTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.interBold,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    marginBottom: 4,
  },
  triviaDesc: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontFamily: fonts.interRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  sectionHeaderWrap: {
    marginTop: space.lg,
    marginBottom: space.sm,
  },
  sectionHeading: {
    fontFamily: fonts.interBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  constitutionCard: {
    borderRadius: radius.card,
    borderWidth: 1.5,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: space.md,
  },
  constitutionAccentBar: {
    width: 6,
    backgroundColor: '#006B3F',
  },
  constitutionBody: {
    flex: 1,
    padding: space.md,
  },
  constitutionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  lawBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  lawBadgeText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  constitutionYear: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
  },
  constitutionTitle: {
    fontFamily: fonts.interBold,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  constitutionSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 13,
    lineHeight: 18,
  },
  crimeEntryCard: {
    marginVertical: space.sm,
  },
  crimeEntryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    gap: space.md,
  },
  crimeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  crimeIcon: {
    fontSize: 20,
  },
  crimeTextWrap: {
    flex: 1,
  },
  crimeTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '600',
    marginBottom: 2,
  },
  crimeSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
  actsSection: {
    marginTop: space.lg,
  },
  actsList: {
    gap: space.sm,
    marginTop: space.sm,
  },
  actCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.md,
  },
  actMainPress: {
    flex: 1,
  },
  actTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 3,
  },
  actDetail: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
  },
  triviaChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
    marginLeft: space.sm,
  },
  triviaChipText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    fontWeight: '600',
  },
});
