import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PressableCard } from '@/components/PressableCard';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function MasterTriviaScreen() {
  const { colors, elevation } = useTheme();

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title="Know Your Law Trivia"
        actionLabel="Close"
        onAction={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/');
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.badgeContainer}>
          <View
            style={[
              styles.phaseBadge,
              { backgroundColor: colors.primarySoft },
            ]}
          >
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              INTERACTIVE QUIZ • PHASE 5
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.ink }]}>
          Master Legal Trivia Challenge
        </Text>

        <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
          Test your knowledge of the 1999 Constitution, fundamental human
          rights, separation of powers, and civic laws.
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
          <Text style={styles.cardIcon}>🏆</Text>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>
            What to Expect in Phase 5
          </Text>
          <View style={styles.featureList}>
            <Text style={[styles.featureItem, { color: colors.inkMuted }]}>
              • 10-question rapid daily quiz sessions
            </Text>
            <Text style={[styles.featureItem, { color: colors.inkMuted }]}>
              • Balanced difficulty: Easy, Medium, and Hard tiers
            </Text>
            <Text style={[styles.featureItem, { color: colors.inkMuted }]}>
              • Instant explanations linked to exact constitutional sections
            </Text>
            <Text style={[styles.featureItem, { color: colors.inkMuted }]}>
              • Offline progress tracking and celebration scores
            </Text>
          </View>
        </View>

        <View style={{ marginTop: space.lg, gap: space.sm }}>
          <Text style={[styles.ctaHeading, { color: colors.ink }]}>
            Want to test your legal knowledge right now?
          </Text>

          <PressableCard
            onPress={() =>
              router.push('/scenario?q=Give%20me%20a%20legal%20trivia%20question%20about%20the%201999%20Constitution' as Href)
            }
            accessibilityLabel="Ask Trivia Question"
            elevationLevel={1}
            contentStyle={{ padding: space.md }}
          >
            <Text style={[styles.askPrompt, { color: colors.primary }]}>
              Ask for a quiz question in "What Does The Law Say" →
            </Text>
            <Text style={[styles.askDetail, { color: colors.inkMuted }]}>
              Challenge our legal intelligence engine with constitutional questions.
            </Text>
          </PressableCard>
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
  badgeContainer: {
    marginTop: space.md,
    marginBottom: space.sm,
  },
  phaseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  badgeText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  title: {
    fontFamily: fonts.interBold,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    marginBottom: space.xs,
  },
  subtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: space.lg,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.lg,
  },
  cardIcon: {
    fontSize: 32,
    marginBottom: space.sm,
  },
  cardTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: space.sm,
  },
  featureList: {
    gap: space.xs,
  },
  featureItem: {
    fontFamily: fonts.interRegular,
    fontSize: 14,
    lineHeight: 20,
  },
  ctaHeading: {
    fontFamily: fonts.interSemiBold,
    fontSize: 15,
    fontWeight: '600',
  },
  askPrompt: {
    fontFamily: fonts.interSemiBold,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  askDetail: {
    fontFamily: fonts.interRegular,
    fontSize: 13,
  },
});
