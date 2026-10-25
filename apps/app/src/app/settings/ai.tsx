import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { readOwnKey, writeOwnKey } from '@/ask/keys';
import { validateOwnKey, type AskHttp } from '@/ask/send';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { radius, space, type as typeScale } from '@/theme/tokens';
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
  const { colors } = useTheme();
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
      <Text
        style={{
          marginTop: space.unit * 4,
          color: colors.ink,
          fontSize: typeScale.heading.fontSize,
          lineHeight: typeScale.heading.lineHeight,
        }}
      >
        {copy.ai.useOwnKey}
      </Text>
      {Platform.OS === 'web' && !saved ? (
        <Text
          style={{
            marginTop: space.unit * 3,
            color: colors.ink,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {copy.ai.webWarning}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', marginTop: space.unit * 3 }}>
        {(['openai', 'anthropic'] as const).map((item) => (
          <Pressable
            key={item}
            accessibilityRole="button"
            accessibilityLabel={item === 'openai' ? copy.ai.openai : copy.ai.anthropic}
            onPress={() => setProvider(item)}
            style={{ minHeight: space.target, justifyContent: 'center', marginRight: space.unit * 4 }}
          >
            <Text style={{ color: provider === item ? colors.accent : colors.ink }}>
              {item === 'openai' ? copy.ai.openai : copy.ai.anthropic}
            </Text>
          </Pressable>
        ))}
      </View>
      {saved ? (
        <Text
          style={{
            marginTop: space.unit * 3,
            color: colors.ink,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {copy.ownKeyActive}
        </Text>
      ) : (
        <TextInput
          value={secret}
          onChangeText={setSecret}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={copy.ai.key}
          placeholder={copy.ai.key}
          placeholderTextColor={colors.inkMuted}
          style={{
            minHeight: space.target,
            marginTop: space.unit * 3,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.field,
            paddingHorizontal: space.unit * 3,
            color: colors.ink,
            backgroundColor: colors.bgRaised,
          }}
        />
      )}
      {error ? (
        <Text style={{ marginTop: space.unit * 3, color: colors.danger }}>{error}</Text>
      ) : null}
      {saved ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.ai.remove}
          onPress={() => {
            void writeOwnKey(null).then(() => {
              setSaved(false);
              setSecret('');
            });
          }}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accent }}>{copy.ai.remove}</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.ai.save}
          onPress={() => {
            void validateOwnKey(provider, secret.trim(), http).then((accepted) => {
              if (!accepted) {
                setError(copy.ask.badKey);
                return;
              }
              void writeOwnKey({ provider, secret: secret.trim() }).then(() => {
                setSaved(true);
                setError(null);
                setSecret('');
              });
            });
          }}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accent }}>{copy.ai.save}</Text>
        </Pressable>
      )}
    </Screen>
  );
}
