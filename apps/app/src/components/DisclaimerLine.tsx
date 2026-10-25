import { Text } from 'react-native';
import { copy } from '@/copy';
import { type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function DisclaimerLine() {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        color: colors.inkMuted,
        fontSize: typeScale.disclaimer.fontSize,
        lineHeight: typeScale.disclaimer.lineHeight,
      }}
    >
      {copy.disclaimer}
    </Text>
  );
}
