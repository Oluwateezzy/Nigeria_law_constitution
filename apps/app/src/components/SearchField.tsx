import { Pressable, Text, TextInput, View, type TextInputInstance } from 'react-native';
import type { RefObject } from 'react';
import { copy } from '@/copy';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type SearchFieldProps = {
  value: string;
  onChangeText: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onClear: () => void;
  autoFocus?: boolean;
  inputRef: RefObject<TextInputInstance | null>;
};

export function SearchField({
  value,
  onChangeText,
  onFocus,
  onBlur,
  onClear,
  autoFocus = false,
  inputRef,
}: SearchFieldProps) {
  const { colors } = useTheme();
  return (
    <View
      accessibilityRole="search"
      onTouchStart={onFocus}
      style={{
        minHeight: space.target,
        marginTop: space.unit * 4,
        paddingHorizontal: space.unit * 4,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.field,
        backgroundColor: colors.bgRaised,
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.unit * 2,
      }}
    >
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        onBlur={onBlur}
        autoFocus={autoFocus}
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={false}
        placeholder={copy.searchPlaceholder}
        placeholderTextColor={colors.inkMuted}
        accessibilityLabel={copy.searchPlaceholder}
        style={{
          flex: 1,
          minHeight: space.target,
          color: colors.ink,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.search.clear}
          onPress={onClear}
          style={{ minHeight: space.target, justifyContent: 'center' }}
        >
          <Text
            style={{
              color: colors.accent,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            {copy.search.clear}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
