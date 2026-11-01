import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { TopBar } from '@/components/TopBar';
import { copy } from '@/copy';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function LegalScreen({
  title,
  paragraphs,
}: {
  title: string;
  paragraphs: readonly string[];
}) {
  const { colors, elevation } = useTheme();

  return (
    <Screen edges={['top', 'bottom']}>
      <TopBar
        title={title}
        actionLabel={copy.settings.close}
        onAction={() => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/settings');
        }}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          <Text style={[styles.docHeader, { color: colors.primary }]}>
            OFFICIAL POLICY DOCUMENT
          </Text>

          {paragraphs.map((paragraph, index) => (
            <Text
              key={index}
              style={[
                styles.paragraph,
                {
                  color: colors.ink,
                  marginTop: index === 0 ? space.sm : space.md,
                },
              ]}
            >
              {paragraph}
            </Text>
          ))}
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
    paddingVertical: space.md,
    paddingBottom: space.xl,
  },
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    padding: space.lg,
  },
  docHeader: {
    fontFamily: fonts.interSemiBold,
    fontSize: 11,
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: space.xs,
  },
  paragraph: {
    fontFamily: fonts.interRegular,
    fontSize: 14,
    lineHeight: 22,
  },
});
