import { Pressable, StyleSheet, Text, View } from 'react-native';
import { copy } from '@/copy';
import { getElevation } from '@/theme/elevation';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type CitationCardProps = {
  shortTitle: string;
  number: string;
  heading: string;
  quote: string;
  onOpen: () => void;
};

export function CitationCard({
  shortTitle,
  number,
  heading,
  quote,
  onOpen,
}: CitationCardProps) {
  const { scheme, colors } = useTheme();
  const elevationStyle = getElevation(1, scheme);

  return (
    <View
      style={[
        elevationStyle,
        styles.card,
        {
          borderColor: colors.line,
          backgroundColor: colors.bgRaised,
          borderLeftColor: colors.primary,
          borderLeftWidth: 4,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text
          style={{
            color: colors.inkMuted,
            fontFamily: fonts.interMedium,
            fontSize: typeScale.caption.fontSize,
            lineHeight: typeScale.caption.lineHeight,
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {shortTitle}
        </Text>
      </View>

      <Text
        style={{
          marginTop: space.xs,
          color: colors.primary,
          fontFamily: fonts.interSemi,
          fontSize: typeScale.body.fontSize,
          lineHeight: typeScale.body.lineHeight,
          fontWeight: '600',
        }}
      >
        {number}
        {heading ? `. ${heading}` : ''}
      </Text>

      <Text
        style={{
          marginTop: space.sm,
          color: colors.ink,
          fontFamily: fonts.inter,
          fontSize: typeScale.body.fontSize,
          lineHeight: typeScale.body.lineHeight,
          fontStyle: 'italic',
        }}
      >
        "{quote}"
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.scenario.open}
        onPress={onOpen}
        style={({ pressed }) => ({
          minHeight: space.target,
          justifyContent: 'center',
          marginTop: space.xs,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text
          style={{
            color: colors.primary,
            fontFamily: fonts.interSemi,
            fontSize: typeScale.body.fontSize,
            lineHeight: typeScale.body.lineHeight,
            fontWeight: '600',
          }}
        >
          {copy.scenario.open} →
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: space.md,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
