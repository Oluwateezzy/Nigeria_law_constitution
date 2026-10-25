import { Pressable, Text } from 'react-native';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type InstrumentRowProps = {
  title: string;
  detail?: string;
  onPress: () => void;
};

export function InstrumentRow({ title, detail, onPress }: InstrumentRowProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={detail ? `${title}. ${detail}` : title}
      onPress={onPress}
      style={{
        minHeight: space.target,
        justifyContent: 'center',
        paddingVertical: space.unit * 3,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
      }}
    >
      <Text
        style={{
          color: colors.ink,
          fontSize: typeScale.heading.fontSize,
          lineHeight: typeScale.heading.lineHeight,
        }}
      >
        {title}
      </Text>
      {detail ? (
        <Text
          style={{
            marginTop: space.unit,
            color: colors.inkMuted,
            fontSize: typeScale.ui.fontSize,
            lineHeight: typeScale.ui.lineHeight,
          }}
        >
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}
