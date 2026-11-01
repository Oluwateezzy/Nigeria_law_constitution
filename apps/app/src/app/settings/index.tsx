import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAccount } from '@/account/AuthProvider';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { useNotes } from '@/notes/NotesProvider';
import { type TextSizeStep } from '@/persistence/database';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { useSync } from '@/sync/SyncProvider';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const steps: { step: TextSizeStep; label: string }[] = [
  { step: 0, label: copy.settings.textSmaller },
  { step: 1, label: copy.settings.textDefault },
  { step: 2, label: copy.settings.textLarger },
];

export default function SettingsScreen() {
  const { colors, preference, setPreference, elevation } = useTheme();
  const { textSize, setTextSize } = usePreferences();
  const { exportNotes } = useNotes();
  const { label } = useAccount();
  const { askUpload, chooseUpload } = useSync();

  const themeOptions: { value: 'system' | 'light' | 'dark'; label: string }[] = [
    { value: 'system', label: 'System' },
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
  ];

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={copy.settings.title}
        actionLabel={copy.settings.close}
        onAction={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/');
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.headerSubtitle, { color: colors.inkMuted }]}>
          {copy.settings.body}
        </Text>

        {/* Text Size Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.inkMuted }]}>
            READING TEXT SIZE
          </Text>

          <View
            style={[
              styles.segmentedCard,
              elevation[1],
              {
                backgroundColor: colors.bgRaised,
                borderColor: colors.line,
              },
            ]}
          >
            {steps.map((item) => {
              const selected = textSize === item.step;
              return (
                <Pressable
                  key={item.step}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                  onPress={() => setTextSize(item.step)}
                  style={[
                    styles.segmentButton,
                    selected && {
                      backgroundColor: colors.primary,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: selected ? '#FFFFFF' : colors.ink,
                        fontFamily: selected
                          ? fonts.interSemiBold
                          : fonts.interRegular,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Theme Preference Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.inkMuted }]}>
            APPEARANCE & THEME
          </Text>

          <View
            style={[
              styles.segmentedCard,
              elevation[1],
              {
                backgroundColor: colors.bgRaised,
                borderColor: colors.line,
              },
            ]}
          >
            {themeOptions.map((item) => {
              const selected = preference === item.value;
              return (
                <Pressable
                  key={item.value}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  accessibilityState={{ selected }}
                  onPress={() => setPreference(item.value)}
                  style={[
                    styles.segmentButton,
                    selected && {
                      backgroundColor: colors.primary,
                      borderRadius: radius.sm,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color: selected ? '#FFFFFF' : colors.ink,
                        fontFamily: selected
                          ? fonts.interSemiBold
                          : fonts.interRegular,
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Notes & Export Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionHeading, { color: colors.inkMuted }]}>
            DATA & BACKUP
          </Text>

          <View
            style={[
              styles.card,
              elevation[1],
              {
                backgroundColor: colors.bgRaised,
                borderColor: colors.line,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.settings.exportNotes}
              onPress={() => {
                void exportNotes();
              }}
              style={({ pressed }) => [
                styles.cardRow,
                {
                  backgroundColor: pressed ? colors.line + '30' : 'transparent',
                },
              ]}
            >
              <View style={styles.rowText}>
                <Text style={[styles.rowTitle, { color: colors.ink }]}>
                  {copy.settings.exportNotes}
                </Text>
                <Text style={[styles.rowSubtitle, { color: colors.inkMuted }]}>
                  Save all personal notes to a JSON export file
                </Text>
              </View>
              <Text style={[styles.rowAction, { color: colors.primary }]}>
                Export →
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Sync & Account Banner */}
        {askUpload ? (
          <View
            style={[
              styles.card,
              styles.alertCard,
              elevation[1],
              {
                backgroundColor: colors.bgRaised,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.alertTitle, { color: colors.primary }]}>
              {copy.account.uploadTitle}
            </Text>
            <View style={styles.alertActions}>
              <Pressable
                onPress={() => void chooseUpload('upload')}
                style={[
                  styles.alertButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.alertButtonText}>
                  {copy.account.upload}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => void chooseUpload('keep')}
                style={[
                  styles.alertButtonSecondary,
                  { borderColor: colors.line },
                ]}
              >
                <Text
                  style={[
                    styles.alertButtonSecondaryText,
                    { color: colors.inkMuted },
                  ]}
                >
                  {copy.account.keepLocal}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
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
  headerSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 14,
    lineHeight: 20,
    marginTop: space.sm,
    marginBottom: space.md,
  },
  section: {
    marginTop: space.lg,
  },
  sectionHeading: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: space.sm,
  },
  segmentedCard: {
    flexDirection: 'row',
    borderRadius: radius.card,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space.md,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
  },
  rowAction: {
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    fontWeight: '600',
    marginLeft: space.sm,
  },
  alertCard: {
    padding: space.md,
    marginTop: space.xl,
    borderWidth: 1.5,
  },
  alertTitle: {
    fontFamily: fonts.interBold,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  alertBody: {
    fontFamily: fonts.interRegular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: space.md,
  },
  alertActions: {
    flexDirection: 'row',
    gap: space.sm,
  },
  alertButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  alertButtonSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  alertButtonSecondaryText: {
    fontFamily: fonts.interMedium,
    fontSize: 13,
  },
});
