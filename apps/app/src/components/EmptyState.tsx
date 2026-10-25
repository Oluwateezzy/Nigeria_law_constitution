import { Text, View } from 'react-native';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function EmptyState({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        paddingVertical: space.unit * 6,
      }}
    >
      <Text
        style={{
          color: colors.ink,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {message}
      </Text>
    </View>
  );
}
