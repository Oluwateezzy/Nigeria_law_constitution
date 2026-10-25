import { Text, TextInput, View } from 'react-native';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type TextFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  accessibilityLabel: string;
  error?: string | null;
};

export function TextField({
  value,
  onChangeText,
  onSubmit,
  placeholder,
  accessibilityLabel,
  error,
}: TextFieldProps) {
  const { colors } = useTheme();
  return (
    <View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        style={{
          minHeight: space.target,
          borderWidth: 1,
          borderColor: error ? colors.danger : colors.line,
          borderRadius: radius.field,
          paddingHorizontal: space.unit * 3,
          color: colors.ink,
          backgroundColor: colors.bgRaised,
          fontSize: typeScale.ui.fontSize,
        }}
      />
      {error ? (
        <Text
          accessibilityRole="alert"
          style={{
            marginTop: space.unit,
            color: colors.danger,
            fontSize: typeScale.disclaimer.fontSize,
            lineHeight: typeScale.disclaimer.lineHeight,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}
