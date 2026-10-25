import { Pressable, Text } from 'react-native';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type ContinueCardProps = {
  kicker: string;
  title: string;
  detail: string;
  onPress: () => void;
};

export function ContinueCard({
  kicker,
  title,
  detail,
  onPress,
}: ContinueCardProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${kicker}. ${title}. ${detail}`}
      onPress={onPress}
      style={{
        minHeight: space.target,
        marginTop: space.unit * 4,
        padding: space.unit * 4,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.card,
        backgroundColor: colors.bgRaised,
      }}
    >
      <Text
        style={{
          color: colors.inkMuted,
          fontSize: typeScale.disclaimer.fontSize,
          lineHeight: typeScale.disclaimer.lineHeight,
        }}
      >
        {kicker}
      </Text>
      <Text
        style={{
          marginTop: space.unit,
          color: colors.ink,
          fontSize: typeScale.heading.fontSize,
          lineHeight: typeScale.heading.lineHeight,
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          marginTop: space.unit,
          color: colors.accent,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {detail}
      </Text>
    </Pressable>
  );
}
