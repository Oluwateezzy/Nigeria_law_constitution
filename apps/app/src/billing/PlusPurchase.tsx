import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useAccount } from '@/account/AuthProvider';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';
import { managePlus, purchasePlus, restorePlus } from './purchase';

export function PlusPurchase({
  lane,
  showPrice,
}: {
  lane: 'free' | 'plus';
  showPrice: boolean;
}) {
  const { colors, elevation } = useTheme();
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
    <View
      style={[
        styles.card,
        elevation[1],
        {
          backgroundColor: colors.bgRaised,
          borderColor: plus ? colors.primary : colors.line,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.badge,
            { backgroundColor: plus ? colors.primarySoft : colors.line },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: plus ? colors.primary : colors.inkMuted },
            ]}
          >
            {plus ? 'PRO TIER ACTIVE' : 'FREE TIER'}
          </Text>
        </View>
        {showPrice && !plus ? (
          <Text style={[styles.priceTag, { color: colors.primary }]}>
            {copy.plus.price}
          </Text>
        ) : null}
      </View>

      <Text style={[styles.allowance, { color: colors.ink }]}>
        {copy.plus.allowance}
      </Text>

      <View style={styles.actionsRow}>
        {plus && Platform.OS === 'web' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.plus.manage}
            onPress={() => {
              void manage();
            }}
            style={({ pressed }) => [
              styles.buttonSecondary,
              {
                borderColor: colors.line,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.buttonSecondaryText, { color: colors.ink }]}>
              {copy.plus.manage}
            </Text>
          </Pressable>
        ) : !plus ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.ask.subscribe}
            onPress={() => {
              void buy();
            }}
            style={({ pressed }) => [
              styles.buttonPrimary,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={styles.buttonPrimaryText}>{copy.ask.subscribe} →</Text>
          </Pressable>
        ) : null}

        {Platform.OS !== 'web' ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.plus.restore}
            onPress={() => {
              void restore();
            }}
            style={({ pressed }) => [
              styles.restoreButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[styles.restoreButtonText, { color: colors.primary }]}>
              {copy.plus.restore}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {status ? (
        <Text style={[styles.statusText, { color: colors.inkMuted }]}>
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

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1.5,
    padding: space.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.sm,
  },
  badge: {
    paddingHorizontal: space.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  priceTag: {
    fontFamily: fonts.interBold,
    fontSize: 15,
    fontWeight: '700',
  },
  allowance: {
    fontFamily: fonts.interRegular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: space.md,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  buttonPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimaryText: {
    color: '#FFFFFF',
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonSecondary: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSecondaryText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  restoreButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
  },
  restoreButtonText: {
    fontFamily: fonts.interMedium,
    fontSize: 13,
  },
  statusText: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
    marginTop: space.sm,
  },
});
