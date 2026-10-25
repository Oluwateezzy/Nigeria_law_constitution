import { Pressable, Text } from 'react-native';
import { space, type as typeScale } from '@/theme/tokens';
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
      style={{
        minHeight: space.target,
        justifyContent: 'center',
        paddingLeft: depth * space.unit * 4,
        paddingVertical: space.unit * 2,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      {kicker ? (
        <Text
          style={{
            color: colors.inkMuted,
            fontSize: typeScale.disclaimer.fontSize,
            lineHeight: typeScale.disclaimer.lineHeight,
          }}
        >
          {kicker}
        </Text>
      ) : null}
      <Text
        style={{
          color: colors.ink,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {title}
      </Text>
    </Pressable>
  );
}
