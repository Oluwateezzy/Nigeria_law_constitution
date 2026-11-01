import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { fonts, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function MoreScreen() {
  const { colors, scheme, elevation, reduceMotion } = useTheme();
  const scrollRef = useRef<ScrollViewInstance>(null);

  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    }, [reduceMotion]),
  );

  const sections = [
    {
      title: 'EXPLORATION & CITATIONS',
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
          route: '/scenario?q=Crimes%20and%20penalties' as Href,
          icon: '⚖️',
        },
        {
          label: 'Know Your Law Trivia',
          subtitle: 'Test your legal knowledge and civic rights',
          route: '/scenario?q=Daily%20trivia%20challenge' as Href,
          icon: '🏆',
        },
      ],
    },
    {
      title: 'PREFERENCES & CONFIGURATION',
      items: [
        {
          label: 'Reading & Theme Settings',
          subtitle: 'Text size, light/dark mode, reduced motion',
          route: '/settings' as Href,
          icon: '⚙️',
        },
        {
          label: 'AI & Citation Intelligence',
          subtitle: 'Model quota, own API key configuration',
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
      title: 'LEGAL & COMPLIANCE',
      items: [
        {
          label: 'Terms of Use',
          subtitle: 'Open legal access policy and usage terms',
          route: '/settings/terms' as Href,
          icon: '📄',
        },
        {
          label: 'Privacy Policy',
          subtitle: 'Offline-first, on-device data and telemetry',
          route: '/settings/privacy' as Href,
          icon: '🛡️',
        },
        {
          label: 'Support & Community Feedback',
          subtitle: 'Report a legal typo or suggest an Act',
          action: () => {
            Linking.openURL('mailto:support@nigerialaw.app?subject=Feedback');
          },
          icon: '📬',
        },
      ],
    },
  ];

  return (
    <Screen>
      <TopBar title="More" />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
              {section.items.map((item, index) => {
                const handlePress = () => {
                  if ('action' in item && item.action) {
                    item.action();
                  } else if ('route' in item && item.route) {
                    router.push(item.route);
                  }
                };

                return (
                  <Pressable
                    key={item.label}
                    onPress={handlePress}
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
                          ? colors.line + '30'
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
                );
              })}
            </View>
          </View>
        ))}

        {/* About App Section with Brand Logo (V2-P3-T5) */}
        <View
          style={[
            styles.aboutCard,
            elevation[1],
            {
              backgroundColor: colors.bgRaised,
              borderColor: colors.line,
            },
          ]}
        >
          <Image
            source={
              scheme === 'dark'
                ? require('../../../assets/brand/logo-mono-dark.png')
                : require('../../../assets/brand/logo.png')
            }
            style={styles.aboutLogo}
            resizeMode="contain"
          />
          <Text style={[styles.aboutTitle, { color: colors.ink }]}>
            What Does The Law Say
          </Text>
          <Text style={[styles.aboutVersion, { color: colors.primary }]}>
            Version 2.0.0 (Build 2026.11)
          </Text>
          <Text style={[styles.aboutDesc, { color: colors.inkMuted }]}>
            Open access to the Laws of the Federation of Nigeria and the 1999
            Constitution. Fast, offline-first, verified.
          </Text>
          <Text style={[styles.aboutCopyright, { color: colors.inkMuted }]}>
            © 2026 Nigeria Legal Initiative • Non-commercial legal awareness
          </Text>
        </View>
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
  aboutCard: {
    alignItems: 'center',
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.lg,
    marginTop: space.xl,
    marginBottom: space.lg,
  },
  aboutLogo: {
    width: 64,
    height: 64,
    marginBottom: space.sm,
  },
  aboutTitle: {
    fontFamily: fonts.interBold,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 2,
  },
  aboutVersion: {
    fontFamily: fonts.interMedium,
    fontSize: 12,
    marginBottom: space.sm,
  },
  aboutDesc: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    marginBottom: space.md,
    maxWidth: 300,
  },
  aboutCopyright: {
    fontFamily: fonts.interRegular,
    fontSize: 11,
    textAlign: 'center',
  },
});
