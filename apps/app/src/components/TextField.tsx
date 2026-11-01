import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
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
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        placeholderTextColor={colors.inkMuted}
        accessibilityLabel={accessibilityLabel}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        style={[
          styles.input,
          {
            borderColor: error
              ? colors.danger
              : isFocused
                ? colors.primary
                : colors.line,
            borderWidth: isFocused ? 2 : 1,
            borderRadius: radius.md,
            paddingHorizontal: space.md,
            color: colors.ink,
            backgroundColor: colors.bgRaised,
            fontFamily: fonts.inter,
            fontSize: typeScale.body.fontSize,
          },
        ]}
      />
      {error ? (
        <Text
          accessibilityRole="alert"
          style={{
            marginTop: space.xs,
            color: colors.danger,
            fontFamily: fonts.inter,
            fontSize: typeScale.caption.fontSize,
            lineHeight: typeScale.caption.lineHeight,
          }}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  input: {
    minHeight: space.target,
  },
});
