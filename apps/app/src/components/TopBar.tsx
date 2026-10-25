import { Pressable, Text, View } from 'react-native';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type TopBarProps = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function TopBar({ title, actionLabel, onAction }: TopBarProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        minHeight: space.target,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: space.unit * 3,
        paddingTop: space.unit * 2,
      }}
    >
      <Text
        accessibilityRole="header"
        style={{
          flex: 1,
          color: colors.ink,
          fontSize: typeScale.heading.fontSize,
          lineHeight: typeScale.heading.lineHeight,
        }}
      >
        {title}
      </Text>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onAction}
          style={{
            minHeight: space.target,
            minWidth: space.target,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: space.unit * 2,
          }}
        >
          <Text
            style={{
              color: colors.accent,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
