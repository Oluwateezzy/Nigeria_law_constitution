import {
  Newsreader_400Regular,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View } from 'react-native';
import '@/account/crypto-polyfill';
import { AuthProvider } from '@/account/AuthProvider';
import { CrashBoundary } from '@/crash/CrashBoundary';
import { PlusAlias } from '@/billing/PlusAlias';
import { NotesProvider } from '@/notes/NotesProvider';
import { PreferencesProvider } from '@/persistence/PreferencesProvider';
import { SearchProvider } from '@/search/SearchProvider';
import { SyncProvider } from '@/sync/SyncProvider';
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider';
import { palette } from '@/theme/tokens';

export default function RootLayout() {
  const systemScheme = useColorScheme();
  const [loaded, error] = useFonts({
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
  const { scheme, colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      />
    </View>
  );
}
