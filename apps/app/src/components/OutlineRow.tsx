import { Pressable, Text } from 'react-native';
import { fonts, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type OutlineRowProps = {
  title: string;
  kicker?: string | null;
  depth: number;
  onPress: () => void;
  expanded?: boolean;
};

export function OutlineRow({
  title,
  kicker,
  depth,
  onPress,
  expanded,
}: OutlineRowProps) {
  const { colors } = useTheme();
  const label = kicker ? `${kicker}. ${title}` : title;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={expanded === undefined ? undefined : { expanded }}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: space.target,
        justifyContent: 'center',
        paddingLeft: depth * space.md,
        paddingVertical: space.sm,
        paddingRight: space.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        backgroundColor: pressed ? colors.primarySoft : 'transparent',
      })}
    >
      {kicker ? (
        <Text
          style={{
            color: colors.primary,
            fontFamily: fonts.interMedium,
            fontSize: typeScale.caption.fontSize,
            lineHeight: typeScale.caption.lineHeight,
            fontWeight: '600',
          }}
        >
          {kicker}
        </Text>
      ) : null}
      <Text
        style={{
          color: colors.ink,
          fontFamily: fonts.inter,
          fontSize: typeScale.body.fontSize,
          lineHeight: typeScale.body.lineHeight,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
