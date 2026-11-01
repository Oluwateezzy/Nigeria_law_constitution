import { Text, View } from 'react-native';
import { fonts, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function EmptyState({ message }: { message: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: space.xl,
        paddingHorizontal: space.md,
      }}
    >
      <Text
        style={{
          color: colors.inkMuted,
          fontFamily: fonts.inter,
          fontSize: typeScale.body.fontSize,
          lineHeight: typeScale.body.lineHeight,
          textAlign: 'center',
        }}
      >
        {message}
      </Text>
    </View>
  );
}
