import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { showAccountLine } from '@/account/line';
import { EmptyState } from '@/components/EmptyState';
import { PressableCard } from '@/components/PressableCard';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { noteSections } from '@/notes/catalog';
import { useNotes } from '@/notes/NotesProvider';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { groupLivingNotes, unattachedGroupId } from '@/notes/present';
import { readerHref } from '@/reader/linking';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function NotesScreen() {
  const { colors, elevation, reduceMotion } = useTheme();
  const { notes, openNote, openStandalone } = useNotes();
  const { accountLineDismissed, dismissAccountLine } = usePreferences();
  const scrollRef = useRef<ScrollViewInstance>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    }, [reduceMotion]),
  );
  const groups = groupLivingNotes(notes, noteSections());
  const showLine = showAccountLine(notes.length, accountLineDismissed);
  return (
    <Screen>
      <TopBar
        title="Notes"
        actionLabel={copy.notes.new}
        onAction={openStandalone}
      />
      {showLine ? (
        <View
          style={{
            marginTop: space.unit * 3,
            flexDirection: 'row',
            alignItems: 'center',
            gap: space.unit * 3,
          }}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.signIn}
            onPress={() => router.push('/settings/account')}
            style={{
              flex: 1,
              minHeight: space.target,
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                color: colors.ink,
                fontSize: typeScale.ui.fontSize,
                lineHeight: typeScale.ui.lineHeight,
              }}
            >
              {copy.signIn}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.account.hideLine}
            onPress={dismissAccountLine}
            style={{ minHeight: space.target, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.primary }}>
              {copy.account.hideLine}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {groups.length === 0 ? (
        <EmptyState message={copy.notes.empty} />
      ) : (
        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: space.xl }}
          showsVerticalScrollIndicator={false}
        >
          {groups.map((group) => (
            <View key={group.id} style={{ marginTop: space.lg }}>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.ink,
                  fontFamily: fonts.interBold,
                  fontSize: 16,
                  lineHeight: 22,
                  fontWeight: '700',
                  marginBottom: space.sm,
                }}
              >
                {group.id === unattachedGroupId
                  ? copy.notes.unattached
                  : group.title}
              </Text>
              <View style={{ gap: space.sm }}>
                {group.items.map((item) => (
                  <PressableCard
                    key={item.id}
                    onPress={() => openNote(item.id)}
                    accessibilityLabel={item.title}
                    elevationLevel={1}
                    contentStyle={{ padding: space.md }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        color: colors.ink,
                        fontFamily: fonts.interSemiBold,
                        fontSize: 16,
                        lineHeight: 22,
                        fontWeight: '600',
                        marginBottom: item.bodyPreview ? 4 : space.xs,
                      }}
                    >
                      {item.title}
                    </Text>
                    {item.bodyPreview ? (
                      <Text
                        numberOfLines={2}
                        style={{
                          color: colors.inkMuted,
                          fontFamily: fonts.interRegular,
                          fontSize: 14,
                          lineHeight: 20,
                          marginBottom: space.xs,
                        }}
                      >
                        {item.bodyPreview}
                      </Text>
                    ) : null}
                    {item.sectionId && item.sectionNumber && item.instrumentId ? (
                      <Pressable
                        accessibilityRole="link"
                        accessibilityLabel={`${copy.notes.sectionLink} ${item.sectionNumber}`}
                        onPress={() => {
                          const instrumentId = item.instrumentId;
                          const sectionNumber = item.sectionNumber;
                          if (!instrumentId || !sectionNumber) return;
                          router.push(
                            readerHref(instrumentId, sectionNumber) as Href,
                          );
                        }}
                        style={{
                          marginTop: space.xs,
                          alignSelf: 'flex-start',
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontFamily: fonts.interSemiBold,
                            fontSize: 13,
                            lineHeight: 18,
                            fontWeight: '600',
                          }}
                        >
                          {copy.notes.sectionLink} {item.sectionNumber} →
                        </Text>
                      </Pressable>
                    ) : null}
                  </PressableCard>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
