import { findSection, shippingInstruments } from '@nigeria-law/content';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { ContinueCard } from '@/components/ContinueCard';
import { GradientCard } from '@/components/GradientCard';
import { PressableCard } from '@/components/PressableCard';
import { Screen } from '@/components/Screen';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { continueSectionLabel } from '@/reader/library';
import { readerHref } from '@/reader/linking';
import { fonts, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

function FadeUp({
  delay,
  children,
  reduceMotion,
}: {
  delay: number;
  children: ReactNode;
  reduceMotion: boolean;
}) {
  const opacity = useRef(new Animated.Value(reduceMotion ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduceMotion ? 0 : 16)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(1);
      translateY.setValue(0);
      return;
    }
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        delay,
        useNativeDriver: Platform.OS !== 'web',
      }),
    ]).start();
  }, [delay, opacity, reduceMotion, translateY]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { colors, scheme, elevation, gradient, reduceMotion } = useTheme();
  const { ready, position, refreshPosition } = usePreferences();
  const [heroQuery, setHeroQuery] = useState('');
  const scrollRef = useRef<ScrollViewInstance>(null);
  const instruments = shippingInstruments();

  useFocusEffect(
    useCallback(() => {
      refreshPosition();
      scrollRef.current?.scrollTo({ y: 0, animated: !reduceMotion });
    }, [refreshPosition, reduceMotion]),
  );

  const reading = position
    ? instruments.find((item) => findSection(item, position.sectionId))
    : undefined;
  const located =
    reading && position ? findSection(reading, position.sectionId) : null;

  const handleExplain = (textToExplain?: string) => {
    const q = (textToExplain ?? heroQuery).trim();
    if (q.length > 0) {
      router.push(`/scenario?q=${encodeURIComponent(q)}` as Href);
    } else {
      router.push('/scenario' as Href);
    }
  };

  // 3-Column Quick Access Grid (Architecture §26.1: Crimes, Trivia, Notes)
  const quickAccessItems = [
    {
      id: 'crimes',
      icon: '⚖️',
      title: 'Crimes',
      subtitle: 'Bail & jail times',
      route: '/more' as Href,
      badge: 'DIRECTORY',
    },
    {
      id: 'trivia',
      icon: '🏆',
      title: 'Trivia',
      subtitle: 'Know your law',
      route: '/explore' as Href,
      badge: 'DAILY QUIZ',
    },
    {
      id: 'notes',
      icon: '📝',
      title: 'Notes',
      subtitle: 'Saved sections',
      route: '/notes' as Href,
      badge: 'LIBRARY',
    },
  ];

  return (
    <Screen>
      <TopBar
        title={copy.productName}
        showBrandMark={true}
        actionLabel="Settings"
        onAction={() => router.push('/settings')}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* V2-P3-T1: Hero Card: What Does The Law Say (FadeUp delay: 0ms) */}
        <FadeUp delay={0} reduceMotion={reduceMotion}>
          <GradientCard
            colors={scheme === 'dark' ? ['#044B2C', '#0A2518'] : gradient.hero}
            style={styles.heroCard}
          >
            <View style={styles.heroHeader}>
              <View style={styles.heroSparkleBadge}>
                <Text style={styles.heroSparkleIcon}>✨</Text>
                <Text style={styles.heroBadgeText}>AI LEGAL INTELLIGENCE</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>What Does The Law Say?</Text>
            <Text style={styles.heroSubtitle}>
              Describe any real-life situation in plain English. Get direct
              answers backed by exact legal citations.
            </Text>

            {/* Interactive Text Input in Hero Card */}
            <View style={styles.heroInputContainer}>
              <TextInput
                value={heroQuery}
                onChangeText={setHeroQuery}
                placeholder="e.g. Can police search my phone without a warrant?"
                placeholderTextColor="#656D76"
                style={styles.heroTextInput}
                accessibilityLabel="Describe your situation"
                returnKeyType="go"
                onSubmitEditing={() => handleExplain()}
              />
              <Pressable
                onPress={() => handleExplain()}
                accessibilityRole="button"
                accessibilityLabel="Explain this situation"
                style={({ pressed }) => [
                  styles.heroExplainButton,
                  { opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Text style={styles.heroExplainText}>Explain →</Text>
              </Pressable>
            </View>

            {/* Quick Scenario Suggestion Chips */}
            <View style={styles.chipRow}>
              {[
                'Arrest without warrant',
                'Tenancy eviction notice',
                'Freedom of expression',
              ].map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => handleExplain(tag)}
                  style={({ pressed }) => [
                    styles.chip,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Ask about ${tag}`}
                >
                  <Text style={styles.chipText}>{tag}</Text>
                </Pressable>
              ))}
            </View>
          </GradientCard>
        </FadeUp>

        {/* Continue Reading Card (Visible when reading position exists) (FadeUp delay: 100ms) */}
        {ready && position ? (
          <FadeUp delay={100} reduceMotion={reduceMotion}>
            <View style={styles.section}>
              <ContinueCard
                kicker={copy.library.continue}
                title={reading?.shortTitle ?? 'Continue Reading'}
                detail={continueSectionLabel(
                  located
                    ? {
                        number: located.section.number,
                        heading: located.section.heading,
                      }
                    : null,
                  position.sectionId,
                )}
                onPress={() => {
                  if (!located || !reading) return;
                  router.push(
                    readerHref(
                      reading.id,
                      located.section.number,
                      position.anchor,
                    ) as Href,
                  );
                }}
              />
            </View>
          </FadeUp>
        ) : null}

        {/* Quick Access Grid (Architecture §26.1: 3 Columns - Crimes, Trivia, Notes) (FadeUp delay: 200ms) */}
        <FadeUp delay={200} reduceMotion={reduceMotion}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              Quick Access
            </Text>

            <View style={styles.quickGrid}>
              {quickAccessItems.map((item) => (
                <PressableCard
                  key={item.id}
                  onPress={() => router.push(item.route)}
                  accessibilityLabel={item.title}
                  style={styles.quickGridCard}
                  contentStyle={styles.quickGridContent}
                  elevationLevel={1}
                >
                  <Text style={styles.quickGridIcon}>{item.icon}</Text>
                  <Text style={[styles.quickGridTitle, { color: colors.ink }]}>
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      styles.quickGridSubtitle,
                      { color: colors.inkMuted },
                    ]}
                    numberOfLines={1}
                  >
                    {item.subtitle}
                  </Text>
                </PressableCard>
              ))}
            </View>
          </View>
        </FadeUp>

        {/* Recent Public Discussions Preview Card (FadeUp delay: 300ms) */}
        <FadeUp delay={300} reduceMotion={reduceMotion}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>
                Recent Discussions
              </Text>
              <Pressable
                onPress={() => router.push('/discuss' as Href)}
                accessibilityRole="button"
                accessibilityLabel="View all discussions"
              >
                <Text style={[styles.sectionLink, { color: colors.primary }]}>
                  View All →
                </Text>
              </Pressable>
            </View>

            {!ready ? (
              <View style={{ gap: space.sm }}>
                <SkeletonLoader height={80} borderRadius={radius.card} />
              </View>
            ) : (
              <PressableCard
                onPress={() => router.push('/discuss' as Href)}
                accessibilityLabel="Legal Community Discussions"
                elevationLevel={1}
                style={styles.communityCard}
                contentStyle={styles.communityContent}
              >
                <View
                  style={[
                    styles.communityIconWrap,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text style={styles.communityIcon}>💬</Text>
                </View>
                <View style={styles.communityText}>
                  <View style={styles.discussionMeta}>
                    <Text
                      style={[styles.discussionTag, { color: colors.primary }]}
                    >
                      POLICE ACT 2020 §66
                    </Text>
                    <Text
                      style={[styles.discussionTime, { color: colors.inkMuted }]}
                    >
                      24 replies
                    </Text>
                  </View>
                  <Text
                    style={[styles.communityTitle, { color: colors.ink }]}
                    numberOfLines={2}
                  >
                    Police Powers to Search Mobile Phones at Checkpoints
                  </Text>
                </View>
              </PressableCard>
            )}
          </View>
        </FadeUp>
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
  heroCard: {
    marginVertical: space.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  heroSparkleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  heroSparkleIcon: {
    fontSize: 12,
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.interSemiBold,
    fontSize: 10,
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: fonts.interBold,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    marginBottom: 6,
  },
  heroSubtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontFamily: fonts.interRegular,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: space.md,
  },
  heroInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: radius.field,
    paddingHorizontal: space.sm,
    paddingVertical: 6,
    marginBottom: space.sm,
  },
  heroTextInput: {
    flex: 1,
    color: '#1B1F24',
    fontFamily: fonts.interRegular,
    fontSize: 14,
    paddingHorizontal: space.sm,
    paddingVertical: 4,
  },
  heroExplainButton: {
    backgroundColor: '#006B3F',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  heroExplainText: {
    color: '#FFFFFF',
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: space.xs,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontFamily: fonts.interMedium,
    fontSize: 11,
    fontWeight: '500',
  },
  section: {
    marginTop: space.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  sectionTitle: {
    fontFamily: fonts.interBold,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
    marginBottom: space.sm,
  },
  sectionLink: {
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  quickGrid: {
    flexDirection: 'row',
    gap: space.sm,
  },
  quickGridCard: {
    flex: 1,
  },
  quickGridContent: {
    padding: space.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  quickGridIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  quickGridTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    textAlign: 'center',
  },
  quickGridSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 11,
    textAlign: 'center',
  },
  communityCard: {
    width: '100%',
  },
  communityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
  },
  communityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityIcon: {
    fontSize: 20,
  },
  communityText: {
    flex: 1,
  },
  discussionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  discussionTag: {
    fontFamily: fonts.interSemiBold,
    fontSize: 10,
    fontWeight: '600',
  },
  discussionTime: {
    fontFamily: fonts.interRegular,
    fontSize: 11,
  },
  communityTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
});
