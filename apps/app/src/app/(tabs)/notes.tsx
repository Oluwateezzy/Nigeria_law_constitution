import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { noteSections } from '@/notes/catalog';
import { useNotes } from '@/notes/NotesProvider';
import { groupLivingNotes, unattachedGroupId } from '@/notes/present';
import { readerHref } from '@/reader/linking';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function NotesScreen() {
  const { colors } = useTheme();
  const { notes, openNote, openStandalone } = useNotes();
  const groups = groupLivingNotes(notes, noteSections());
  return (
    <Screen>
      <TopBar
        title="Notes"
        actionLabel={copy.notes.new}
        onAction={openStandalone}
      />
      {groups.length === 0 ? (
        <EmptyState message={copy.notes.empty} />
      ) : (
        <ScrollView style={{ flex: 1 }}>
          {groups.map((group) => (
            <View key={group.id} style={{ marginTop: space.unit * 4 }}>
              <Text
                accessibilityRole="header"
                style={{
                  color: colors.ink,
                  fontSize: typeScale.heading.fontSize,
                  lineHeight: typeScale.heading.lineHeight,
                }}
              >
                {group.id === unattachedGroupId
                  ? copy.notes.unattached
                  : group.title}
              </Text>
              {group.items.map((item) => (
                <View
                  key={item.id}
                  style={{
                    paddingVertical: space.unit * 2,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.line,
                  }}
                >
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={item.title}
                    onPress={() => openNote(item.id)}
                    style={{
                      minHeight: space.target,
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      numberOfLines={1}
                      style={{
                        color: colors.ink,
                        fontSize: typeScale.ui.fontSize,
                        lineHeight: typeScale.ui.lineHeight,
                      }}
                    >
                      {item.title}
                    </Text>
                  </Pressable>
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
                        minHeight: space.target,
                        justifyContent: 'center',
                      }}
                    >
                      <Text
                        style={{
                          color: colors.accent,
                          fontSize: typeScale.ui.fontSize,
                          lineHeight: typeScale.ui.lineHeight,
                        }}
                      >
                        {copy.notes.sectionLink} {item.sectionNumber}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}
