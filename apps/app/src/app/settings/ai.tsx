import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { readOwnKey, writeOwnKey } from '@/ask/keys';
import { PlusPurchase } from '@/billing/PlusPurchase';
import { validateOwnKey, type AskHttp } from '@/ask/send';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import type { OwnKeyProvider } from '@nigeria-law/domain';

const http: AskHttp = async (request) => {
  const response = await fetch(request.url, {
    method: request.method,
    headers: request.headers,
  });
  return { status: response.status, body: await response.text() };
};

export default function AiSettingsScreen() {
  const { colors, elevation } = useTheme();
  const preferences = usePreferences();
  const [provider, setProvider] = useState<OwnKeyProvider>('openai');
  const [secret, setSecret] = useState('');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void readOwnKey().then((key) => {
      if (!key) return;
      setProvider(key.provider);
      setSaved(true);
    });
  }, []);

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={copy.ai.title}
        actionLabel={copy.settings.close}
        onAction={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/settings');
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tier / Quota Card */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.inkMuted }]}>
            AI INTELLIGENCE TIER
          </Text>
          <PlusPurchase lane={preferences.quota.lane ?? 'free'} showPrice />
        </View>

        {/* Bring Your Own Key Card */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionHeading, { color: colors.inkMuted }]}>
            CUSTOM API KEY
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
            <Text style={[styles.cardTitle, { color: colors.ink }]}>
              {copy.ai.useOwnKey}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.inkMuted }]}>
              Connect your own OpenAI or Anthropic API key for unlimited queries
              without standard lane rate limits.
            </Text>

            {Platform.OS === 'web' && !saved ? (
              <View
                style={[
                  styles.warningBox,
                  {
                    backgroundColor: colors.accentSoft,
                    borderColor: colors.accent,
                  },
                ]}
              >
                <Text style={[styles.warningText, { color: colors.accent }]}>
                  ⚠️ {copy.ai.webWarning}
                </Text>
              </View>
            ) : null}

            {/* Provider Segmented Pill Selector */}
            <View
              style={[
                styles.segmentedRow,
                { backgroundColor: colors.bg, borderColor: colors.line },
              ]}
            >
              {(['openai', 'anthropic'] as const).map((item) => (
                <Pressable
                  key={item}
                  accessibilityRole="button"
                  accessibilityLabel={
                    item === 'openai' ? copy.ai.openai : copy.ai.anthropic
                  }
                  onPress={() => setProvider(item)}
                  style={[
                    styles.segmentButton,
                    provider === item && {
                      backgroundColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      {
                        color:
                          provider === item ? '#FFFFFF' : colors.inkMuted,
                      },
                    ]}
                  >
                    {item === 'openai' ? 'OpenAI (GPT-4o)' : 'Anthropic (Claude)'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {saved ? (
              <View style={styles.activeKeyWrap}>
                <View
                  style={[
                    styles.activeBadge,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text style={[styles.activeBadgeText, { color: colors.primary }]}>
                    ✓ {copy.ownKeyActive} ({provider.toUpperCase()})
                  </Text>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.ai.remove}
                  onPress={() => {
                    void writeOwnKey(null).then(() => {
                      setSaved(false);
                      setSecret('');
                    });
                  }}
                  style={styles.removeButton}
                >
                  <Text style={[styles.removeButtonText, { color: colors.danger }]}>
                    Remove Key
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ marginTop: space.md }}>
                <TextInput
                  value={secret}
                  onChangeText={(text) => {
                    setSecret(text);
                    if (error) setError(null);
                  }}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  accessibilityLabel={copy.ai.key}
                  placeholder={`Enter your ${
                    provider === 'openai' ? 'sk-...' : 'sk-ant-...'
                  } key`}
                  placeholderTextColor={colors.inkMuted}
                  style={[
                    styles.input,
                    {
                      borderColor: error ? colors.danger : colors.line,
                      color: colors.ink,
                      backgroundColor: colors.bg,
                    },
                  ]}
                />

                {error ? (
                  <Text style={[styles.errorText, { color: colors.danger }]}>
                    {error}
                  </Text>
                ) : null}

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.ai.save}
                  disabled={secret.trim().length === 0}
                  onPress={() => {
                    void validateOwnKey(provider, secret.trim(), http).then(
                      (accepted) => {
                        if (!accepted) {
                          setError(copy.ask.badKey);
                          return;
                        }
                        void writeOwnKey({ provider, secret: secret.trim() }).then(
                          () => {
                            setSaved(true);
                            setError(null);
                            setSecret('');
                          },
                        );
                      },
                    );
                  }}
                  style={({ pressed }) => [
                    styles.saveButton,
                    {
                      backgroundColor:
                        secret.trim().length === 0
                          ? colors.line
                          : colors.primary,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text style={styles.saveButtonText}>{copy.ai.save}</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
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
  sectionWrap: {
    marginTop: space.lg,
  },
  sectionHeading: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: space.sm,
    paddingHorizontal: space.xs,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.lg,
  },
  cardTitle: {
    fontFamily: fonts.interBold,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: space.md,
  },
  warningBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.sm,
    marginBottom: space.md,
  },
  warningText: {
    fontFamily: fonts.interMedium,
    fontSize: 12,
    lineHeight: 16,
  },
  segmentedRow: {
    flexDirection: 'row',
    borderRadius: radius.full,
    borderWidth: 1,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  segmentText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 12,
    fontWeight: '600',
  },
  activeKeyWrap: {
    marginTop: space.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  activeBadge: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  activeBadgeText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  removeButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  removeButtonText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.field,
    paddingHorizontal: space.md,
    fontFamily: fonts.interRegular,
    fontSize: 14,
    marginBottom: space.sm,
  },
  errorText: {
    fontFamily: fonts.interMedium,
    fontSize: 12,
    marginBottom: space.sm,
  },
  saveButton: {
    minHeight: 48,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: space.xs,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
});
