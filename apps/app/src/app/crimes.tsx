import { router, type Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PressableCard } from '@/components/PressableCard';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function CrimesScreen() {
  const { colors, elevation } = useTheme();

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title="Crimes & Penalties"
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
              CATALOGUE PREVIEW • PHASE 7
            </Text>
          </View>
        </View>

        <Text style={[styles.title, { color: colors.ink }]}>
          Crimes, Penalties & Bail Directory
        </Text>

        <Text style={[styles.subtitle, { color: colors.inkMuted }]}>
          A structured, searchable index of offences under the Criminal Code Act,
          Penal Code, and contemporary penal statutes.
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
          <Text style={styles.cardIcon}>⚖️</Text>
          <Text style={[styles.cardTitle, { color: colors.ink }]}>
            Upcoming Features
          </Text>
          <View style={styles.featureList}>
            <Text style={[styles.featureItem, { color: colors.inkMuted }]}>
              • Specific statutory offence definitions & sections
            </Text>
            <Text style={[styles.featureItem, { color: colors.inkMuted }]}>
              • Prescribed minimum and maximum jail terms
            </Text>
            <Text style={[styles.featureItem, { color: colors.inkMuted }]}>
              • Fine schedules and alternative penalties
            </Text>
            <Text style={[styles.featureItem, { color: colors.inkMuted }]}>
              • Bail eligibility & constitutional bail conditions
            </Text>
          </View>
        </View>

        <View style={{ marginTop: space.lg, gap: space.sm }}>
          <Text style={[styles.ctaHeading, { color: colors.ink }]}>
            Have a specific criminal law question right now?
          </Text>

          <PressableCard
            onPress={() =>
              router.push('/scenario?q=What%20are%20the%20penalties%20for%20theft%20and%20robbery' as Href)
            }
            accessibilityLabel="Ask in Scenario"
            elevationLevel={1}
            contentStyle={{ padding: space.md }}
          >
            <Text style={[styles.askPrompt, { color: colors.primary }]}>
              Ask about offences in "What Does The Law Say" →
            </Text>
            <Text style={[styles.askDetail, { color: colors.inkMuted }]}>
              Get instant legal explanations cited with statutory provisions.
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
