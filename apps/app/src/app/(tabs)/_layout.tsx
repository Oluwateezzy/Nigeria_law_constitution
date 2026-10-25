import { Tabs } from 'expo-router';
import { useTheme } from '@/theme/ThemeProvider';

export default function TabLayout() {
  const { colors } = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.inkMuted,
        tabBarStyle: {
          backgroundColor: colors.bgRaised,
          borderTopColor: colors.line,
        },
        tabBarLabelStyle: {
          fontSize: 13,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Library' }} />
      <Tabs.Screen name="scenario" options={{ title: 'Scenario' }} />
      <Tabs.Screen name="notes" options={{ title: 'Notes' }} />
    </Tabs>
  );
}
