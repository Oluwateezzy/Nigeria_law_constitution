import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  Newsreader_400Regular,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme, View } from 'react-native';
import '@/account/crypto-polyfill';
import { AuthProvider } from '@/account/AuthProvider';
import { CrashBoundary } from '@/crash/CrashBoundary';
import { PlusAlias } from '@/billing/PlusAlias';
import { NotesProvider } from '@/notes/NotesProvider';
import { hasCompletedOnboarding, OnboardingSlider } from '@/onboarding';
import { PreferencesProvider } from '@/persistence/PreferencesProvider';
import { SearchProvider } from '@/search/SearchProvider';
import { SyncProvider } from '@/sync/SyncProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { palette } from '@/theme/tokens';

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Newsreader_400Regular,
    Newsreader_600SemiBold,
  });

  if (!loaded && !error) {
    const background =
      systemScheme === 'dark' ? palette.dark.bg : palette.light.bg;
    return <View style={{ flex: 1, backgroundColor: background }} />;
  }

  return (
    <ThemeProvider>
      <CrashBoundary>
        <PreferencesProvider>
          <SearchProvider>
            <AuthProvider>
              <PlusAlias />
              <NotesProvider>
                <SyncProvider>
                  <ThemedStack />
                </SyncProvider>
              </NotesProvider>
            </AuthProvider>
          </SearchProvider>
        </PreferencesProvider>
      </CrashBoundary>
    </ThemeProvider>
  );
}

function ThemedStack() {
  const { scheme, colors, reduceMotion } = useTheme();
  const [isOnboardingChecked, setIsOnboardingChecked] = useState(false);
  const [completedOnboarding, setCompletedOnboarding] = useState(false);

  useEffect(() => {
    let mounted = true;
    hasCompletedOnboarding().then((done) => {
      if (mounted) {
        setCompletedOnboarding(done);
        setIsOnboardingChecked(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (!isOnboardingChecked) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  if (!completedOnboarding) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <OnboardingSlider onComplete={() => setCompletedOnboarding(true)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: reduceMotion ? 'none' : 'slide_from_right',
          animationDuration: reduceMotion ? 0 : 300,
        }}
      />
    </View>
  );
}
