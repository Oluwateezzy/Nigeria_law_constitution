import { Text, View } from 'react-native';
import { copy } from '@/copy';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

export function SearchField() {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="search"
      accessibilityState={{ disabled: true }}
      accessibilityLabel={copy.searchPlaceholder}
      style={{
        minHeight: space.target,
        marginTop: space.unit * 4,
        paddingHorizontal: space.unit * 4,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.field,
        backgroundColor: colors.bgRaised,
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: colors.inkMuted,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {copy.searchPlaceholder}
      </Text>
    </View>
  );
}
