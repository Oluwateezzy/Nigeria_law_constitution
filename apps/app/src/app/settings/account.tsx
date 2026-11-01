import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAccount } from '@/account/AuthProvider';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function AccountScreen() {
  const { colors, elevation } = useTheme();
  const {
    signedIn,
    label,
    sendMagicLink,
    signInWithProvider,
    signOut,
    deleteAccount,
  } = useAccount();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleteDevice, setDeleteDevice] = useState(false);
  const openedSignedIn = useRef(signedIn);

  useEffect(() => {
    if (!openedSignedIn.current && signedIn) router.replace('/settings');
  }, [signedIn]);

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={copy.account.title}
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
        {signedIn && label ? (
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
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              Active Account
            </Text>
            <Text style={[styles.userLabel, { color: colors.primary }]}>
              👤 {label}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.inkMuted }]}>
              Your reading positions and saved notes are automatically backed up
              and synchronized across your devices.
            </Text>
          </View>
        ) : (
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
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              Sign In or Register
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.inkMuted }]}>
              Synchronize notes, bookmarks, and quota across all your devices
              securely.
            </Text>

            {Platform.OS === 'ios' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.account.apple}
                onPress={() => {
                  void signInWithProvider('apple').then(setMessage);
                }}
                style={({ pressed }) => [
                  styles.oauthButton,
                  {
                    backgroundColor: colors.ink,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={styles.oauthButtonTextApple}>
                   Continue with Apple
                </Text>
              </Pressable>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.account.google}
              onPress={() => {
                void signInWithProvider('google').then(setMessage);
              }}
              style={({ pressed }) => [
                styles.oauthButton,
                {
                  backgroundColor: colors.bg,
                  borderColor: colors.line,
                  borderWidth: 1,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={[styles.oauthButtonTextGoogle, { color: colors.ink }]}>
                🌐 Continue with Google
              </Text>
            </Pressable>

            <View style={styles.dividerRow}>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.line }]}
              />
              <Text style={[styles.dividerText, { color: colors.inkMuted }]}>
                OR WITH EMAIL
              </Text>
              <View
                style={[styles.dividerLine, { backgroundColor: colors.line }]}
              />
            </View>

            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              accessibilityLabel={copy.account.email}
              placeholder="Enter your email address"
              placeholderTextColor={colors.inkMuted}
              style={[
                styles.input,
                {
                  borderColor: colors.line,
                  color: colors.ink,
                  backgroundColor: colors.bg,
                },
              ]}
            />

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.account.sendLink}
              onPress={() => {
                void sendMagicLink(email).then((error) => {
                  setMessage(error ?? copy.account.linkSent);
                });
              }}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Text style={styles.primaryButtonText}>
                {copy.account.sendLink} →
              </Text>
            </Pressable>
          </View>
        )}

        {message ? (
          <View
            style={[
              styles.alertCard,
              {
                backgroundColor: colors.primarySoft,
                borderColor: colors.primary,
              },
            ]}
          >
            <Text style={[styles.alertText, { color: colors.primary }]}>
              ℹ️ {message}
            </Text>
          </View>
        ) : null}

        {signedIn ? (
          <View
            style={[
              styles.card,
              elevation[1],
              {
                backgroundColor: colors.bgRaised,
                borderColor: colors.line,
                marginTop: space.lg,
              },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              Account Management
            </Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.account.signOut}
              onPress={() => {
                void signOut().then(() => router.replace('/'));
              }}
              style={({ pressed }) => [
                styles.actionRow,
                { borderBottomColor: colors.line, borderBottomWidth: 1 },
              ]}
            >
              <Text style={[styles.actionRowText, { color: colors.ink }]}>
                Sign Out
              </Text>
              <Text style={[styles.chevron, { color: colors.inkMuted }]}>›</Text>
            </Pressable>

            {confirming ? (
              <View style={{ marginTop: space.md }}>
                <Text style={[styles.deleteWarning, { color: colors.danger }]}>
                  ⚠️ {copy.account.deleteLine}
                </Text>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.account.deleteDevice}
                  accessibilityState={{ selected: deleteDevice }}
                  onPress={() => setDeleteDevice((value) => !value)}
                  style={styles.checkboxRow}
                >
                  <Text style={{ fontSize: 16 }}>
                    {deleteDevice ? '☑️' : '◻️'}
                  </Text>
                  <Text style={[styles.checkboxLabel, { color: colors.ink }]}>
                    {copy.account.deleteDevice}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={copy.account.deleteAccount}
                  onPress={() => {
                    void deleteAccount(deleteDevice).then((error) => {
                      if (error) {
                        setMessage(error);
                        return;
                      }
                      router.replace('/');
                    });
                  }}
                  style={[
                    styles.dangerButton,
                    { backgroundColor: colors.dangerSoft },
                  ]}
                >
                  <Text
                    style={[styles.dangerButtonText, { color: colors.danger }]}
                  >
                    Confirm Permanent Account Deletion
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.account.deleteAccount}
                onPress={() => setConfirming(true)}
                style={styles.actionRow}
              >
                <Text
                  style={[styles.actionRowText, { color: colors.danger }]}
                >
                  {copy.account.deleteAccount}
                </Text>
                <Text style={[styles.chevron, { color: colors.danger }]}>›</Text>
              </Pressable>
            )}
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
  card: {
    marginTop: space.md,
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.lg,
  },
  sectionTitle: {
    fontFamily: fonts.interBold,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: space.md,
  },
  userLabel: {
    fontFamily: fonts.interSemiBold,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: space.sm,
  },
  oauthButton: {
    minHeight: 48,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  oauthButtonTextApple: {
    color: '#FFFFFF',
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  oauthButtonTextGoogle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    marginVertical: space.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontFamily: fonts.interMedium,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '500',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.field,
    paddingHorizontal: space.md,
    fontFamily: fonts.interRegular,
    fontSize: 14,
    marginBottom: space.md,
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    fontWeight: '600',
  },
  alertCard: {
    marginTop: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: space.md,
  },
  alertText: {
    fontFamily: fonts.interMedium,
    fontSize: 13,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: space.md,
  },
  actionRowText: {
    fontFamily: fonts.interMedium,
    fontSize: 15,
  },
  chevron: {
    fontSize: 18,
  },
  deleteWarning: {
    fontFamily: fonts.interRegular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: space.sm,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingVertical: space.xs,
    marginBottom: space.md,
  },
  checkboxLabel: {
    fontFamily: fonts.interRegular,
    fontSize: 13,
  },
  dangerButton: {
    minHeight: 44,
    borderRadius: radius.field,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
});
