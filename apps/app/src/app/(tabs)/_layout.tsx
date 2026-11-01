import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.bgRaised,
          borderTopColor: colors.line,
          borderTopWidth: 1,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 0),
        },
        tabBarLabelStyle: {
          fontFamily: fonts.interMedium,
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="scenario" options={{ title: 'Scenario' }} />
      <Tabs.Screen name="notes" options={{ title: 'Notes' }} />
    </Tabs>
  );
}
