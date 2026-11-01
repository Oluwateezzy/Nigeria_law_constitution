import { Pressable, Text, TextInput, View, type TextInputInstance } from 'react-native';
import type { RefObject } from 'react';
import { copy } from '@/copy';
import { getGlassStyle } from '@/theme/glass';
import { fonts, radius, space, type as typeScale } from '@/theme/tokens';
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
  const { scheme, colors } = useTheme();
  const glassStyle = getGlassStyle(scheme, { border: true });

  return (
    <View
      accessibilityRole="search"
      onTouchStart={onFocus}
      style={[
        glassStyle,
        {
          minHeight: 48,
          marginTop: space.md,
          paddingHorizontal: space.md,
          borderRadius: radius.xl,
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.sm,
        },
      ]}
    >
      {/* Subtle Search Icon indicator */}
      <Text
        style={{
          color: colors.inkMuted,
          fontSize: 16,
          lineHeight: 20,
        }}
        accessibilityElementsHidden={true}
        importantForAccessibility="no"
      >
        🔍
      </Text>

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
          fontFamily: fonts.inter,
          fontSize: typeScale.body.fontSize,
          lineHeight: typeScale.body.lineHeight,
        }}
      />
      {value.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={copy.search.clear}
          onPress={onClear}
          style={({ pressed }) => ({
            minHeight: space.target,
            justifyContent: 'center',
            paddingHorizontal: space.xs,
            opacity: pressed ? 0.7 : 1,
          })}
        >
          <Text
            style={{
              color: colors.primary,
              fontFamily: fonts.interMedium,
              fontSize: typeScale.caption.fontSize,
              lineHeight: typeScale.caption.lineHeight,
              fontWeight: '600',
            }}
          >
            {copy.search.clear}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}
