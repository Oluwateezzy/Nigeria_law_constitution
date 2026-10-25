import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useAccount } from '@/account/AuthProvider';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { useNotes } from '@/notes/NotesProvider';
import { type TextSizeStep } from '@/persistence/database';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { useSync } from '@/sync/SyncProvider';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const steps: { step: TextSizeStep; label: string }[] = [
  { step: 0, label: copy.settings.textSmaller },
  { step: 1, label: copy.settings.textDefault },
  { step: 2, label: copy.settings.textLarger },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const { textSize, setTextSize } = usePreferences();
  const { exportNotes } = useNotes();
  const { label } = useAccount();
  const { askUpload, chooseUpload } = useSync();
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
      <ScrollView style={{ flex: 1 }}>
        <Text
          style={{
            marginTop: space.unit * 6,
            color: colors.ink,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {copy.settings.body}
        </Text>
        <Text
          accessibilityRole="header"
          style={{
            marginTop: space.unit * 6,
            color: colors.ink,
            fontSize: typeScale.heading.fontSize,
            lineHeight: typeScale.heading.lineHeight,
          }}
        >
          {copy.settings.textSize}
        </Text>
        <View style={{ marginTop: space.unit * 2 }}>
          {steps.map((item) => {
            const selected = textSize === item.step;
            return (
              <Pressable
                key={item.step}
                accessibilityRole="button"
                accessibilityLabel={item.label}
                accessibilityState={{ selected }}
                onPress={() => setTextSize(item.step)}
                style={{ minHeight: space.target, justifyContent: 'center' }}
              >
                <Text
                  style={{
                    color: selected ? colors.accent : colors.ink,
                    fontSize: typeScale.ui.fontSize,
                    lineHeight: typeScale.ui.lineHeight,
                  }}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.settings.exportNotes}
          onPress={() => {
            void exportNotes();
          }}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text
            style={{
              color: colors.accent,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            {copy.settings.exportNotes}
          </Text>
        </Pressable>
        {askUpload ? (
          <View style={{ marginTop: space.unit * 6 }}>
            <Text
              style={{
                color: colors.ink,
                fontSize: typeScale.ui.fontSize,
                lineHeight: typeScale.ui.lineHeight,
              }}
            >
              {copy.account.uploadTitle}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.account.upload}
              onPress={() => {
                void chooseUpload('upload');
              }}
              style={{ minHeight: space.target, justifyContent: 'center' }}
            >
              <Text style={{ color: colors.accent }}>
                {copy.account.upload}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.account.keepLocal}
              onPress={() => {
                void chooseUpload('keep');
              }}
              style={{ minHeight: space.target, justifyContent: 'center' }}
            >
              <Text style={{ color: colors.ink }}>
                {copy.account.keepLocal}
              </Text>
            </Pressable>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.settings.saveAccount}
          onPress={() => router.push('/settings/account')}
          style={{
            minHeight: space.target,
            justifyContent: 'center',
            marginTop: space.unit * 4,
          }}
        >
          <Text
            style={{
              color: colors.accent,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            {copy.settings.saveAccount}
          </Text>
        </Pressable>
        {label ? (
          <Text
            style={{
              color: colors.ink,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            {label}
          </Text>
        ) : null}
        <Text
          style={{
            marginTop: space.unit * 2,
            marginBottom: space.unit * 6,
            color: colors.inkMuted,
            fontSize: typeScale.disclaimer.fontSize,
            lineHeight: typeScale.disclaimer.lineHeight,
          }}
        >
          {copy.settings.deviceCopy}
        </Text>
      </ScrollView>
    </Screen>
  );
}
