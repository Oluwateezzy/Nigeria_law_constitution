import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabBarIcon } from '@/components/TabBarIcon';
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
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              focused={focused}
              name="home"
              outlineName="home-outline"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              focused={focused}
              name="compass"
              outlineName="compass-outline"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="discuss"
        options={{
          title: 'Discuss',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              focused={focused}
              name="chatbubbles"
              outlineName="chatbubbles-outline"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              focused={focused}
              name="bookmark"
              outlineName="bookmark-outline"
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ focused, color }) => (
            <TabBarIcon
              focused={focused}
              name="grid"
              outlineName="grid-outline"
              color={color}
            />
          ),
        }}
      />
      {/* Hidden route for backwards compatibility with V1 scenario links */}
      <Tabs.Screen
        name="scenario"
        options={{
          href: null,
          title: 'Scenario',
        }}
      />
    </Tabs>
  );
}
