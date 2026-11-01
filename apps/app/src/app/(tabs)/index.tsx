import { findSection, shippingInstruments } from '@nigeria-law/content';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ContinueCard } from '@/components/ContinueCard';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { usePreferences } from '@/persistence/PreferencesProvider';
import { continueSectionLabel } from '@/reader/library';
import { readerHref } from '@/reader/linking';
import { fonts, radius, space } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export default function HomeScreen() {
  const { colors, scheme, elevation } = useTheme();
  const { ready, position, refreshPosition } = usePreferences();
  const instruments = shippingInstruments();

  useFocusEffect(
    useCallback(() => {
      refreshPosition();
    }, [refreshPosition]),
  );

  const reading = position
    ? instruments.find((item) => findSection(item, position.sectionId))
    : undefined;
  const located =
    reading && position ? findSection(reading, position.sectionId) : null;

  const quickLinks = [
    {
      title: '1999 Constitution',
      badge: 'SUPREME LAW',
      subtitle: 'Fundamental rights, executive, judiciary',
      route: '/read/constitution-1999/s/cap-1-1' as Href,
      accent: colors.primary,
    },
    {
      title: 'Criminal Code Act',
      badge: 'OFFENCES & BAIL',
      subtitle: 'Crimes, felony penalties, jurisdiction',
      route: '/read/criminal-code-act/s/s-1' as Href,
      accent: '#B45309',
    },
    {
      title: 'Police Act 2020',
      badge: 'CIVIC RIGHTS',
      subtitle: 'Arrest procedures, search warrants, bail',
      route: '/read/police-act-2020/s/s-1' as Href,
      accent: '#0F766E',
    },
    {
      title: 'Evidence Act 2011',
      badge: 'PROCEDURE',
      subtitle: 'Admissibility, burden of proof, witnesses',
      route: '/read/evidence-act-2011/s/s-1' as Href,
      accent: '#6366F1',
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
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Card: What Does The Law Say (Scenario Launcher) */}
        <Pressable
          onPress={() => router.push('/scenario' as Href)}
          accessibilityRole="button"
          accessibilityLabel="What Does The Law Say Scenario Inquiry"
          style={({ pressed }) => [
            styles.heroCard,
            elevation[2],
            {
              backgroundColor: scheme === 'dark' ? '#0F3B2E' : '#006B3F',
              opacity: pressed ? 0.95 : 1,
              transform: [{ scale: pressed ? 0.99 : 1 }],
            },
          ]}
        >
          <View style={styles.heroGlow} />
          <View style={styles.heroHeader}>
            <View style={styles.heroSparkleBadge}>
              <Text style={styles.heroSparkleIcon}>✨</Text>
              <Text style={styles.heroBadgeText}>AI LEGAL INTELLIGENCE</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>What Does The Law Say?</Text>
          <Text style={styles.heroSubtitle}>
            Describe any situation in plain English. Get direct answers backed
            by verified statutory provisions and exact citations.
          </Text>

          {/* Simulated Input Field / Prompt Trigger */}
          <View style={styles.heroInputContainer}>
            <Text style={styles.heroInputPlaceholder}>
              e.g. Can the police search my phone without a warrant?
            </Text>
            <View style={styles.heroAskButton}>
              <Text style={styles.heroAskText}>Ask →</Text>
            </View>
          </View>

          {/* Quick Scenario Chips */}
          <View style={styles.chipRow}>
            {['Arrest Powers', 'Tenancy Notice', 'Workplace Rights'].map(
              (tag) => (
                <View key={tag} style={styles.chip}>
                  <Text style={styles.chipText}>{tag}</Text>
                </View>
              ),
            )}
          </View>
        </Pressable>

        {/* Continue Reading Card */}
        {ready && position ? (
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
        ) : null}

        {/* Quick Access Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>
              Key Legal Instruments
            </Text>
            <Pressable
              onPress={() => router.push('/explore' as Href)}
              accessibilityRole="button"
              accessibilityLabel="View all instruments"
            >
              <Text style={[styles.sectionLink, { color: colors.primary }]}>
                Browse All →
              </Text>
            </Pressable>
          </View>

          <View style={styles.grid}>
            {quickLinks.map((item) => (
              <Pressable
                key={item.title}
                onPress={() => router.push(item.route)}
                accessibilityRole="button"
                accessibilityLabel={item.title}
                style={({ pressed }) => [
                  styles.gridCard,
                  elevation[1],
                  {
                    backgroundColor: colors.bgRaised,
                    borderColor: colors.line,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <View
                  style={[
                    styles.gridBadge,
                    { backgroundColor: item.accent + '15' },
                  ]}
                >
                  <Text style={[styles.gridBadgeText, { color: item.accent }]}>
                    {item.badge}
                  </Text>
                </View>
                <Text style={[styles.gridTitle, { color: colors.ink }]}>
                  {item.title}
                </Text>
                <Text
                  style={[styles.gridSubtitle, { color: colors.inkMuted }]}
                  numberOfLines={2}
                >
                  {item.subtitle}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Community & Discussion Teaser */}
        <View style={styles.section}>
          <Pressable
            onPress={() => router.push('/discuss' as Href)}
            accessibilityRole="button"
            accessibilityLabel="Legal Community & Discussions"
            style={({ pressed }) => [
              styles.communityCard,
              elevation[1],
              {
                backgroundColor: colors.bgRaised,
                borderColor: colors.line,
                opacity: pressed ? 0.92 : 1,
              },
            ]}
          >
            <View style={styles.communityContent}>
              <View
                style={[
                  styles.communityIconWrap,
                  { backgroundColor: colors.primarySoft },
                ]}
              >
                <Text style={styles.communityIcon}>💬</Text>
              </View>
              <View style={styles.communityText}>
                <Text style={[styles.communityTitle, { color: colors.ink }]}>
                  Community Discussions
                </Text>
                <Text
                  style={[styles.communityDesc, { color: colors.inkMuted }]}
                >
                  Create public or private debates with friends, lawyers, and
                  citizens on Nigerian law.
                </Text>
              </View>
            </View>
          </Pressable>
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
  heroCard: {
    borderRadius: radius.card,
    padding: space.lg,
    marginVertical: space.md,
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(212, 160, 23, 0.18)',
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
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: radius.field,
    paddingHorizontal: space.md,
    paddingVertical: 10,
    marginBottom: space.sm,
  },
  heroInputPlaceholder: {
    flex: 1,
    color: '#656D76',
    fontFamily: fonts.interRegular,
    fontSize: 13,
  },
  heroAskButton: {
    backgroundColor: '#006B3F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  heroAskText: {
    color: '#FFFFFF',
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: space.xs,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.9)',
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
  },
  sectionLink: {
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  gridCard: {
    width: '48%',
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  gridBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    marginBottom: space.sm,
  },
  gridBadgeText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 9,
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  gridTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  gridSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
    lineHeight: 16,
  },
  communityCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.md,
  },
  communityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
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
  communityTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 2,
  },
  communityDesc: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
    lineHeight: 17,
  },
});
