import {
  locateSections,
  readerPathLabel,
  resolveSectionJump,
  shippingInstrument,
  type LocatedSection,
} from '@nigeria-law/content';
import { MoveGate, elapsedNow } from '@nigeria-law/domain';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { askUsesColumn } from '@/ask/layout';
import { AskPanel } from '@/components/AskPanel';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { EmptyState } from '@/components/EmptyState';
import { ProvisionBody } from '@/components/ProvisionBody';
import { ReaderBar } from '@/components/ReaderBar';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { TextField } from '@/components/TextField';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { useNotes } from '@/notes/NotesProvider';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { readerPan, setSwipeHandler } from '@/reader/gesture';
import { setSheetOpen } from '@/reader/sheet';
import { parseReaderUrl, readerHref } from '@/reader/linking';
import { columnMaxWidth } from '@/reader/measure';
import { provisionLines } from '@/reader/provision-lines';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function ReaderScreen() {
  const params = useLocalSearchParams<{
    instrumentId: string;
    sectionKey: string;
    anchor?: string;
  }>();
  const instrumentId = firstParam(params.instrumentId);
  const sectionKey = firstParam(params.sectionKey);
  const paramAnchor = firstParam(params.anchor);
  const instrument = shippingInstrument();
  const located = useMemo(
    () => (instrument.id === instrumentId ? locateSections(instrument) : []),
    [instrument, instrumentId],
  );
  const routeIndex = located.findIndex(
    (item) => item.section.number === sectionKey,
  );

  if (instrument.id !== instrumentId) {
    return (
      <MissingSection
        title={copy.reader.library}
        message={copy.reader.unknownInstrument}
        actionLabel={copy.reader.library}
        onAction={() => router.replace('/' as Href)}
      />
    );
  }
  if (routeIndex < 0) {
    return (
      <MissingSection
        title={instrument.shortTitle}
        message={copy.reader.unknown}
        actionLabel={copy.reader.outline}
        onAction={() => router.replace(`/read/${instrumentId}` as Href)}
      />
    );
  }

  return (
    <SectionReader
      instrumentId={instrumentId}
      sectionKey={sectionKey}
      paramAnchor={paramAnchor}
      located={located}
      routeIndex={routeIndex}
    />
  );
}

function SectionReader({
  instrumentId,
  sectionKey,
  paramAnchor,
  located,
  routeIndex,
}: {
  instrumentId: string;
  sectionKey: string;
  paramAnchor: string;
  located: LocatedSection[];
  routeIndex: number;
}) {
  const instrument = shippingInstrument();
  const current = located[routeIndex]!;
  const { colors, motionDuration } = useTheme();
  const { textSize, savePosition } = usePreferences();
  const { openSection, noteFilled } = useNotes();
  const insets = useSafeAreaInsets();
  const windowWidth = useWindowDimensions().width;
  const askColumn = askUsesColumn(windowWidth);
  const [askOpen, setAskOpen] = useState(false);
  const [jumpValue, setJumpValue] = useState('');
  const [jumpError, setJumpError] = useState<string | null>(null);
  const [anchor, setAnchor] = useState<string | null>(
    anchorFromLocation(paramAnchor),
  );
  const chosen = useRef<{ key: string; anchor: string | null } | null>(null);
  const gate = useRef(new MoveGate(located.length, routeIndex));
  const pendingSync = useRef(0);
  const shift = useMemo(() => new Animated.Value(0), []);
  const shake = useMemo(() => new Animated.Value(0), []);
  const previousRoute = useRef(routeIndex);
  const scroller = useRef<ScrollViewInstance>(null);
  const offsets = useRef(new Map<string, number>());

  const duration = motionDuration('section');

  useEffect(() => {
    if (!askOpen || askColumn) return;
    setSheetOpen(true);
    return () => setSheetOpen(false);
  }, [askOpen, askColumn]);
  const provision = typeScale.provisionSteps[textSize];
  const lines = useMemo(
    () => provisionLines(current.section.blocks),
    [current.section.blocks],
  );

  useEffect(() => {
    gate.current.resize(located.length);
    if (routeIndex === gate.current.index) {
      pendingSync.current = 0;
      return;
    }
    if (pendingSync.current > 0) {
      pendingSync.current -= 1;
      return;
    }
    gate.current.setIndex(routeIndex);
  }, [located.length, routeIndex]);

  useEffect(() => {
    if (chosen.current?.key === sectionKey) {
      setAnchor(chosen.current.anchor);
      return;
    }
    setAnchor(anchorFromLocation(paramAnchor));
  }, [paramAnchor, sectionKey]);

  useEffect(() => {
    void savePosition({ sectionId: current.section.id, anchor });
  }, [anchor, current.section.id, savePosition]);

  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }
    const href = readerHref(instrumentId, sectionKey, anchor);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl !== href) {
      window.history.replaceState(window.history.state, '', href);
    }
  }, [anchor, instrumentId, sectionKey]);

  useEffect(() => {
    if (previousRoute.current === routeIndex) {
      return;
    }
    const direction = routeIndex > previousRoute.current ? 1 : -1;
    previousRoute.current = routeIndex;
    if (duration === 0) {
      shift.setValue(0);
      return;
    }
    shift.setValue(direction * 48);
    Animated.timing(shift, {
      toValue: 0,
      duration,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [duration, routeIndex, shift]);

  const scrollToAnchor = useCallback(
    (nextAnchor: string | null) => {
      if (!nextAnchor) {
        scroller.current?.scrollTo({ y: 0, animated: false });
        return;
      }
      const y = offsets.current.get(offsetKey(current.section.id, nextAnchor));
      if (y === undefined) {
        return;
      }
      scroller.current?.scrollTo({
        y: Math.max(0, y - space.unit * 2),
        animated: duration > 0,
      });
    },
    [current.section.id, duration],
  );

  useEffect(() => {
    scrollToAnchor(anchor);
  }, [anchor, current.section.id, scrollToAnchor]);

  function openAt(index: number, nextAnchor: string | null) {
    const target = located[index];
    if (!target) {
      return;
    }
    if (index !== gate.current.index) {
      gate.current.setIndex(index);
      pendingSync.current += 1;
    }
    chosen.current = { key: target.section.number, anchor: nextAnchor };
    setAnchor(nextAnchor);
    setJumpError(null);
    router.replace(
      readerHref(instrument.id, target.section.number, nextAnchor) as Href,
    );
  }

  function move(delta: -1 | 1) {
    const next = gate.current.move(delta, elapsedNow());
    if (next === null) {
      return;
    }
    const target = located[next];
    if (!target) {
      return;
    }
    pendingSync.current += 1;
    chosen.current = { key: target.section.number, anchor: null };
    setAnchor(null);
    setJumpError(null);
    router.replace(readerHref(instrument.id, target.section.number) as Href);
  }

  useEffect(() => setSwipeHandler(move));

  function submitJump() {
    const resolved = resolveSectionJump(instrument, jumpValue);
    if (!resolved) {
      setJumpError(copy.reader.jumpError);
      if (duration === 0) {
        return;
      }
      Animated.sequence([
        Animated.timing(shake, {
          toValue: 6,
          duration: 40,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(shake, {
          toValue: -6,
          duration: 40,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(shake, {
          toValue: 0,
          duration: 40,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]).start();
      return;
    }
    const index = located.findIndex(
      (item) => item.section.id === resolved.section.id,
    );
    setJumpValue('');
    openAt(index, resolved.anchor);
  }

  function close() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(`/read/${instrument.id}` as Href);
  }

  const askPanel = (
    <AskPanel
      sectionId={current.section.id}
      title={current.section.heading ?? current.section.number}
      plainText={current.section.plainText}
      path={readerPathLabel(instrument.shortTitle, current.trail)}
      citation={instrument.citation}
      extent={instrument.extent}
      contentVersion={instrument.contentVersion}
      modal={!askColumn}
      onClose={() => setAskOpen(false)}
    />
  );

  return (
    <View
      style={{ flex: 1, backgroundColor: colors.bg }}
      {...readerPan.panHandlers}
    >
      <View
        style={{
          flex: 1,
          flexDirection: askOpen && askColumn ? 'row' : 'column',
        }}
      >
        <View style={{ flex: 1 }}>
          <SafeAreaView edges={['top']} style={{ flex: 1 }}>
            <View style={{ flex: 1, paddingHorizontal: space.screen }}>
              <TopBar
                title={instrument.shortTitle}
                heading={false}
                actionLabel={copy.settings.close}
                onAction={close}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.searchPlaceholder}
                onPress={() => {
                  router.push(`/?fromInstrument=${instrument.id}` as Href);
                }}
                style={{
                  minHeight: space.target,
                  justifyContent: 'center',
                  alignSelf: 'flex-start',
                }}
              >
                <Text
                  style={{
                    color: colors.accent,
                    fontSize: typeScale.ui.fontSize,
                    lineHeight: typeScale.ui.lineHeight,
                  }}
                >
                  {copy.reader.search}
                </Text>
              </Pressable>
              <Animated.View
                style={{
                  marginTop: space.unit * 3,
                  transform: [{ translateX: shake }],
                }}
              >
                <TextField
                  value={jumpValue}
                  onChangeText={(value) => {
                    setJumpValue(value);
                    setJumpError(null);
                  }}
                  onSubmit={submitJump}
                  placeholder="36"
                  accessibilityLabel={copy.reader.jumpLabel}
                  error={jumpError}
                />
              </Animated.View>
              <ScrollView
                ref={scroller}
                style={{ flex: 1, marginTop: space.unit * 3 }}
                contentContainerStyle={{ paddingBottom: space.unit * 6 }}
                keyboardShouldPersistTaps="handled"
              >
                <Animated.View style={{ transform: [{ translateX: shift }] }}>
                  <View
                    nativeID="provision-column"
                    style={{
                      width: '100%',
                      maxWidth: columnMaxWidth(provision.fontSize),
                      alignSelf: 'center',
                    }}
                  >
                    <SectionHeader
                      path={readerPathLabel(
                        instrument.shortTitle,
                        current.trail,
                      )}
                      number={current.section.number}
                      heading={current.section.heading}
                    />
                    <ProvisionBody
                      lines={lines}
                      textSize={textSize}
                      onLineLayout={(lineAnchor, y) => {
                        offsets.current.set(
                          offsetKey(current.section.id, lineAnchor),
                          y,
                        );
                        if (lineAnchor === anchor) {
                          scrollToAnchor(lineAnchor);
                        }
                      }}
                    />
                  </View>
                </Animated.View>
              </ScrollView>
            </View>
          </SafeAreaView>
          <View
            style={{
              paddingBottom: Math.max(insets.bottom, space.unit * 2),
              paddingHorizontal: space.screen,
              borderTopWidth: 1,
              borderTopColor: colors.line,
              backgroundColor: colors.bgRaised,
            }}
          >
            <ReaderBar
              atStart={routeIndex === 0}
              atEnd={routeIndex === located.length - 1}
              noteFilled={noteFilled(current.section.id)}
              onPrevious={() => move(-1)}
              onNext={() => move(1)}
              onAsk={() => setAskOpen(true)}
              onNote={() =>
                openSection({
                  sectionId: current.section.id,
                  instrumentId,
                })
              }
            />
          </View>
        </View>
        {askOpen && askColumn ? askPanel : null}
      </View>
      {askOpen && !askColumn ? askPanel : null}
    </View>
  );
}

function MissingSection({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar title={title} actionLabel={actionLabel} onAction={onAction} />
      <EmptyState message={message} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={actionLabel}
        onPress={onAction}
        style={{ minHeight: space.target, justifyContent: 'center' }}
      >
        <Text
          style={{
            color: colors.accent,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {actionLabel}
        </Text>
      </Pressable>
    </Screen>
  );
}

function offsetKey(sectionId: string, anchor: string): string {
  return `${sectionId}:${anchor}`;
}

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) {
    return value[0] ?? '';
  }
  return value ?? '';
}

function anchorFromLocation(paramAnchor: string): string | null {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return (
      parseReaderUrl(window.location.href)?.anchor ?? (paramAnchor || null)
    );
  }
  return paramAnchor || null;
}
