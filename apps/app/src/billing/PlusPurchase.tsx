import { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useAccount } from '@/account/AuthProvider';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { managePlus, purchasePlus, restorePlus } from './purchase';

export function PlusPurchase({
  lane,
  showPrice,
}: {
  lane: 'free' | 'plus';
  showPrice: boolean;
}) {
  const { colors } = useTheme();
  const account = useAccount();
  const preferences = usePreferences();
  const [status, setStatus] = useState<string | null>(null);
  const plus = lane === 'plus' || preferences.quota.lane === 'plus';

  async function buy() {
    try {
      const result = await purchasePlus({
        installId: preferences.installId,
        accessToken: account.accessToken,
      });
      setStatus(messageFor(result.kind));
    } catch {
      setStatus(copy.plus.unavailable);
    }
  }

  async function restore() {
    try {
      const result = await restorePlus({ installId: preferences.installId });
      setStatus(messageFor(result.kind));
    } catch {
      setStatus(copy.plus.unavailable);
    }
  }

  async function manage() {
    try {
      const result = await managePlus({
        installId: preferences.installId,
        accessToken: account.accessToken,
      });
      setStatus(messageFor(result.kind));
    } catch {
      setStatus(copy.plus.unavailable);
    }
  }

  return (
    <View>
      {showPrice ? (
        <Text
          style={{
            marginTop: space.unit * 3,
            color: colors.ink,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {copy.plus.price}
        </Text>
      ) : null}
      <Text
        style={{
          marginTop: space.unit,
          color: colors.inkMuted,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {copy.plus.allowance}
      </Text>
      {plus && Platform.OS === 'web' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.plus.manage}
          onPress={() => {
            void manage();
          }}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accent }}>{copy.plus.manage}</Text>
        </Pressable>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.ask.subscribe}
          onPress={() => {
            void buy();
          }}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accent }}>{copy.ask.subscribe}</Text>
        </Pressable>
      )}
      {Platform.OS !== 'web' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.plus.restore}
          onPress={() => {
            void restore();
          }}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text style={{ color: colors.accent }}>{copy.plus.restore}</Text>
        </Pressable>
      ) : null}
      {status ? (
        <Text
          style={{
            color: colors.inkMuted,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {status}
        </Text>
      ) : null}
    </View>
  );
}

function messageFor(kind: string): string | null {
  if (kind === 'purchased' || kind === 'started' || kind === 'restored') {
    return copy.plus.waiting;
  }
  if (kind === 'cancelled') return null;
  return copy.plus.unavailable;
}
