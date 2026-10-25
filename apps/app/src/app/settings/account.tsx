import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useAccount } from '@/account/AuthProvider';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function AccountScreen() {
  const { colors } = useTheme();
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
        onAction={() => router.back()}
      />
      {signedIn && label ? (
        <Text
          style={{
            marginTop: space.unit * 6,
            color: colors.ink,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {label}
        </Text>
      ) : (
        <View style={{ marginTop: space.unit * 4 }}>
          {Platform.OS === 'ios' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.account.apple}
              onPress={() => {
                void signInWithProvider('apple').then(setMessage);
              }}
              style={{ minHeight: space.target, justifyContent: 'center' }}
            >
              <Text style={{ color: colors.accent }}>{copy.account.apple}</Text>
            </Pressable>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.account.google}
            onPress={() => {
              void signInWithProvider('google').then(setMessage);
            }}
            style={{ minHeight: space.target, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.accent }}>{copy.account.google}</Text>
          </Pressable>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            accessibilityLabel={copy.account.email}
            placeholder={copy.account.email}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.account.sendLink}
            onPress={() => {
              void sendMagicLink(email).then((error) => {
                setMessage(error ?? copy.account.linkSent);
              });
            }}
            style={{ minHeight: space.target, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.accent }}>
              {copy.account.sendLink}
            </Text>
          </Pressable>
        </View>
      )}
      {message ? (
        <Text
          accessibilityRole="alert"
          style={{
            marginTop: space.unit * 3,
            color: colors.ink,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {message}
        </Text>
      ) : null}
      {signedIn ? (
        <View style={{ marginTop: space.unit * 6 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.account.signOut}
            onPress={() => {
              void signOut().then(() => router.replace('/'));
            }}
            style={{ minHeight: space.target, justifyContent: 'center' }}
          >
            <Text style={{ color: colors.ink }}>{copy.account.signOut}</Text>
          </Pressable>
          {confirming ? (
            <View style={{ marginTop: space.unit * 4 }}>
              <Text
                style={{
                  color: colors.ink,
                  fontSize: typeScale.ui.fontSize,
                  lineHeight: typeScale.ui.lineHeight,
                }}
              >
                {copy.account.deleteLine}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={copy.account.deleteDevice}
                accessibilityState={{ selected: deleteDevice }}
                onPress={() => setDeleteDevice((value) => !value)}
                style={{ minHeight: space.target, justifyContent: 'center' }}
              >
                <Text style={{ color: colors.ink }}>
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
                style={{ minHeight: space.target, justifyContent: 'center' }}
              >
                <Text style={{ color: colors.danger }}>
                  {copy.account.deleteAccount}
                </Text>
              </Pressable>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={copy.account.deleteAccount}
              onPress={() => setConfirming(true)}
              style={{ minHeight: space.target, justifyContent: 'center' }}
            >
              <Text style={{ color: colors.danger }}>
                {copy.account.deleteAccount}
              </Text>
            </Pressable>
          )}
        </View>
      ) : null}
    </Screen>
  );
}
