import { Text } from 'react-native';
import { copy } from '@/copy';
import { fonts, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function DisclaimerLine() {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        color: colors.inkMuted,
        fontFamily: fonts.inter,
        fontSize: typeScale.caption.fontSize,
        lineHeight: typeScale.caption.lineHeight,
      }}
    >
      {copy.disclaimer}
    </Text>
  );
}
