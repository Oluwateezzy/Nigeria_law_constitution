import { useState } from 'react';
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

export default function DiscussScreen() {
  const { colors, elevation } = useTheme();
  const [filter, setFilter] = useState<'public' | 'private'>('public');

  const discussions = [
    {
      id: '1',
      title: 'Police Powers to Search Phones at Checkpoints',
      instrument: 'Police Act 2020 §66 & Constitution §37',
      author: 'Chinedu O. (Legal Practitioner)',
      replies: 24,
      isPublic: true,
      time: '2h ago',
    },
    {
      id: '2',
      title: 'Tenant Eviction Timelines Under Lagos Tenancy Law',
      instrument: 'Tenancy Law 2011 §13',
      author: 'Folake A.',
      replies: 15,
      isPublic: true,
      time: '5h ago',
    },
    {
      id: '3',
      title: 'Admissibility of WhatsApp Chats in Evidence',
      instrument: 'Evidence Act 2011 §84',
      author: 'Ibrahim M. (Bar Candidate)',
      replies: 38,
      isPublic: true,
      time: '1d ago',
    },
  ];

  return (
    <Screen>
      <TopBar title="Discussions" />

      {/* Segmented Filter (Public / Private) */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter('public')}
          accessibilityRole="tab"
          accessibilityState={{ selected: filter === 'public' }}
          style={[
            styles.filterTab,
            filter === 'public' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'public' ? '#FFFFFF' : colors.inkMuted },
            ]}
          >
            Public Forum
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setFilter('private')}
          accessibilityRole="tab"
          accessibilityState={{ selected: filter === 'private' }}
          style={[
            styles.filterTab,
            filter === 'private' && {
              backgroundColor: colors.primary,
              borderColor: colors.primary,
            },
          ]}
        >
          <Text
            style={[
              styles.filterText,
              { color: filter === 'private' ? '#FFFFFF' : colors.inkMuted },
            ]}
          >
            Invited / Private
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Create Discussion CTA Card */}
        <View
          style={[
            styles.createCard,
            elevation[1],
            {
              backgroundColor: colors.bgRaised,
              borderColor: colors.line,
            },
          ]}
        >
          <Text style={[styles.createTitle, { color: colors.ink }]}>
            Start a Legal Discussion
          </Text>
          <Text style={[styles.createSubtitle, { color: colors.inkMuted }]}>
            Pose a question on any section or invite specific colleagues with a
            private link.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create new discussion"
            style={[styles.createButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.createButtonText}>+ New Discussion</Text>
          </Pressable>
        </View>

        {/* Discussion List */}
        <View style={styles.list}>
          {discussions.map((item) => (
            <View
              key={item.id}
              style={[
                styles.discussionCard,
                elevation[1],
                {
                  backgroundColor: colors.bgRaised,
                  borderColor: colors.line,
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.tagBadge,
                    { backgroundColor: colors.primarySoft },
                  ]}
                >
                  <Text style={[styles.tagText, { color: colors.primary }]}>
                    {item.instrument}
                  </Text>
                </View>
                <Text style={[styles.timeText, { color: colors.inkMuted }]}>
                  {item.time}
                </Text>
              </View>

              <Text style={[styles.cardTitle, { color: colors.ink }]}>
                {item.title}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.authorText, { color: colors.inkMuted }]}>
                  {item.author}
                </Text>
                <View style={styles.repliesRow}>
                  <Text style={[styles.repliesText, { color: colors.primary }]}>
                    💬 {item.replies} replies
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginVertical: space.md,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterText: {
    fontFamily: fonts.interMedium,
    fontSize: 13,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  createCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.md,
    marginBottom: space.lg,
  },
  createTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  createSubtitle: {
    fontFamily: fonts.interRegular,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: space.md,
  },
  createButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontFamily: fonts.interSemiBold,
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    gap: space.md,
    paddingBottom: space.xl,
  },
  discussionCard: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  tagText: {
    fontFamily: fonts.interSemiBold,
    fontSize: 10,
    fontWeight: '600',
  },
  timeText: {
    fontFamily: fonts.interRegular,
    fontSize: 11,
  },
  cardTitle: {
    fontFamily: fonts.interSemiBold,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '600',
    marginBottom: space.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  authorText: {
    fontFamily: fonts.interRegular,
    fontSize: 12,
  },
  repliesRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  repliesText: {
    fontFamily: fonts.interMedium,
    fontSize: 12,
    fontWeight: '500',
  },
});
