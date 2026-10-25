import {
  findSection,
  registryEntries,
  shippingInstrument,
} from '@nigeria-law/content';
import { router, useFocusEffect, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View, type TextInputInstance } from 'react-native';
import { ContinueCard } from '@/components/ContinueCard';
import { InstrumentRow } from '@/components/InstrumentRow';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { SearchResultRow } from '@/components/SearchResultRow';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { catalogueRows, continueSectionLabel } from '@/reader/library';
import { readerHref } from '@/reader/linking';
import { useSearch } from '@/search/SearchProvider';
import type { SearchResult } from '@/search/repository';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function LibraryScreen() {
  const { colors } = useTheme();
  const instrument = shippingInstrument();
  const catalogue = catalogueRows({
    instruments: [instrument],
    registry: registryEntries(),
  });
  const { ready, position, refreshPosition, recentQueries, rememberSearch } =
    usePreferences();
  const searchIndex = useSearch();
  const params = useLocalSearchParams<{ fromInstrument?: string | string[] }>();
  const fromInstrument = firstParam(params.fromInstrument);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [limitedInstrument, setLimitedInstrument] = useState<string | null>(
    null,
  );
  const [results, setResults] = useState<SearchResult[]>([]);
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
    }, [refreshPosition]),
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
  const located = position
    ? findSection(instrument, position.sectionId)
    : undefined;
  const searching = query.trim().length > 0;
  const showRecent = focused && !searching && recentQueries.length > 0;

  function openResult(result: SearchResult) {
    rememberSearch(query);
    router.push(
      readerHref(result.instrumentId, result.number, result.anchor) as Href,
    );
  }

  return (
    <Screen>
      <TopBar
        title={copy.productName}
        actionLabel="Settings"
        onAction={() => router.push('/settings')}
      />
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
          style={{
            alignSelf: 'flex-start',
            marginTop: space.unit * 3,
            minHeight: space.target,
            justifyContent: 'center',
            paddingHorizontal: space.unit * 3,
            borderRadius: radius.field,
            borderWidth: 1,
            borderColor: limitToInstrument ? colors.accent : colors.line,
            backgroundColor: limitToInstrument ? colors.accent : colors.bgRaised,
          }}
        >
          <Text
            style={{
              color: limitToInstrument ? colors.bg : colors.ink,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            {copy.search.inThisInstrument}
          </Text>
        </Pressable>
      ) : null}
      <ScrollView
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {searching ? (
          <View style={{ marginTop: space.unit * 2 }}>
            {!searchIndex.ready ? (
              <Text
                style={{
                  marginTop: space.unit * 4,
                  color: colors.inkMuted,
                  fontSize: typeScale.ui.fontSize,
                  lineHeight: typeScale.ui.lineHeight,
                }}
              >
                {copy.search.preparing}
              </Text>
            ) : null}
            {searchIndex.ready && results.length === 0 ? (
              <Text
                style={{
                  marginTop: space.unit * 4,
                  color: colors.inkMuted,
                  fontSize: typeScale.ui.fontSize,
                  lineHeight: typeScale.ui.lineHeight,
                }}
              >
                {copy.search.noResults}
              </Text>
            ) : null}
            {results.map((result) => (
              <SearchResultRow
                key={`${result.sectionId}:${result.anchor ?? ''}`}
                result={result}
                onPress={() => openResult(result)}
              />
            ))}
          </View>
        ) : (
          <View>
            {showRecent ? (
              <View style={{ marginTop: space.unit * 4 }}>
                <Text
                  style={{
                    color: colors.inkMuted,
                    fontSize: typeScale.ui.fontSize,
                    lineHeight: typeScale.ui.lineHeight,
                  }}
                >
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
                    style={{
                      minHeight: space.target,
                      justifyContent: 'center',
                      borderBottomWidth: 1,
                      borderBottomColor: colors.line,
                    }}
                  >
                    <Text
                      style={{
                        color: colors.ink,
                        fontSize: typeScale.ui.fontSize,
                        lineHeight: typeScale.ui.lineHeight,
                      }}
                    >
                      {item}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
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
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
