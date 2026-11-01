import { router, type Href } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { fonts, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function MoreScreen() {
  const { colors, elevation } = useTheme();

  const sections = [
    {
      title: 'FEATURES & EXPLORATION',
      items: [
        {
          label: 'What Does The Law Say? (Scenario)',
          subtitle: 'Ask real-life legal questions with statutory citations',
          route: '/scenario' as Href,
          icon: '✨',
        },
        {
          label: 'Crimes & Penalties Directory',
          subtitle: 'Search offences, jail terms, and bail eligibility',
          route: '/scenario' as Href,
          icon: '⚖️',
        },
        {
          label: 'Know Your Law Trivia',
          subtitle: 'Test your legal knowledge and rights',
          route: '/scenario' as Href,
          icon: '🏆',
        },
      ],
    },
    {
      title: 'PREFERENCES & CONFIGURATION',
      items: [
        {
          label: 'General Settings',
          subtitle: 'Theme, reading size, text display preferences',
          route: '/settings' as Href,
          icon: '⚙️',
        },
        {
          label: 'AI & Citation Intelligence',
          subtitle: 'Model selection, API keys, quota management',
          route: '/settings/ai' as Href,
          icon: '🤖',
        },
        {
          label: 'Account & Backup Sync',
          subtitle: 'Sign in, cloud backup, restore notes and history',
          route: '/settings/account' as Href,
          icon: '👤',
        },
      ],
    },
    {
      title: 'LEGAL & ABOUT',
      items: [
        {
          label: 'About What Does The Law Say',
          subtitle: 'Open legal access for Nigeria • Version 2.0.0',
          route: '/settings' as Href,
          icon: '🇳🇬',
        },
        {
          label: 'Terms of Use & Privacy',
          subtitle: 'Data handling and legal disclaimer',
          route: '/settings' as Href,
          icon: '🛡️',
        },
      ],
    },
  ];

  return (
    <Screen>
      <TopBar title="More" />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={[styles.sectionHeader, { color: colors.inkMuted }]}>
              {section.title}
            </Text>

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
              {section.items.map((item, index) => (
                <Pressable
                  key={item.label}
                  onPress={() => router.push(item.route)}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  style={({ pressed }) => [
                    styles.row,
                    index < section.items.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.line,
                    },
                    {
                      backgroundColor: pressed
                        ? colors.line + '40'
                        : 'transparent',
                    },
                  ]}
                >
                  <Text style={styles.icon}>{item.icon}</Text>
                  <View style={styles.rowText}>
                    <Text style={[styles.label, { color: colors.ink }]}>
                      {item.label}
                    </Text>
                    <Text
                      style={[styles.subtitle, { color: colors.inkMuted }]}
                    >
                      {item.subtitle}
                    </Text>
                  </View>
                  <Text style={[styles.chevron, { color: colors.inkMuted }]}>
                    ›
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  section: {
    marginTop: space.lg,
  },
  sectionHeader: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: space.sm,
    paddingHorizontal: space.xs,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: space.md,
    gap: space.md,
    minHeight: 56,
  },
  icon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  rowText: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.interSemiBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  subtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
    marginTop: 2,
  },
  chevron: {
    fontSize: 20,
    fontWeight: '300',
  },
});
