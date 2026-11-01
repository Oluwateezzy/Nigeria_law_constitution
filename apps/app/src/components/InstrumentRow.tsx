import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getElevation } from '@/theme/elevation';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type InstrumentRowProps = {
  title: string;
  detail?: string;
  onPress: () => void;
};

export function InstrumentRow({ title, detail, onPress }: InstrumentRowProps) {
  const { scheme, colors } = useTheme();
  const elevationStyle = getElevation(1, scheme);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detail ? `${title}. ${detail}` : title}
      onPress={onPress}
      style={({ pressed }) => [
        elevationStyle,
        styles.card,
        {
          backgroundColor: pressed ? colors.primarySoft : colors.bgRaised,
          borderColor: colors.line,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text
            style={{
              color: colors.ink,
              fontFamily: fonts.interSemi,
              fontSize: typeScale.h2.fontSize - 2, // 18px
              lineHeight: typeScale.h2.lineHeight - 2,
              fontWeight: '600',
            }}
          >
            {title}
          </Text>
          {detail ? (
            <Text
              style={{
                marginTop: space.xs,
                color: colors.inkMuted,
                fontFamily: fonts.inter,
                fontSize: typeScale.caption.fontSize,
                lineHeight: typeScale.caption.lineHeight,
              }}
            >
              {detail}
            </Text>
          ) : null}
        </View>

        <Text
          style={{
            color: colors.primary,
            fontFamily: fonts.interMedium,
            fontSize: 18,
            fontWeight: '600',
            marginLeft: space.sm,
          }}
        >
          →
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: space.target,
    marginTop: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
});
