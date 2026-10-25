import { Pressable, Text, View } from 'react-native';
import { copy } from '@/copy';
import { reviewBadge, type SearchResult } from '@/search/repository';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type SearchResultRowProps = {
  result: SearchResult;
  onPress: () => void;
};

export function SearchResultRow({ result, onPress }: SearchResultRowProps) {
  const { colors } = useTheme();
  const badge = reviewBadge(result.reviewStatus);
  const label = [
    result.shortTitle,
    result.path,
    result.number,
    result.heading,
    badge,
  ]
    .filter((part) => part && part.length > 0)
    .join('. ');
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        paddingVertical: space.unit * 3,
        borderBottomWidth: 1,
        borderBottomColor: colors.line,
        gap: space.unit,
      }}
    >
      <Text
        style={{
          color: colors.inkMuted,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {result.shortTitle}
        {result.path ? ` · ${result.path}` : ''}
      </Text>
      <Text
        style={{
          color: colors.ink,
          fontSize: typeScale.heading.fontSize,
          lineHeight: typeScale.heading.lineHeight,
        }}
      >
        {result.number}. {result.heading}
      </Text>
      <Text
        numberOfLines={3}
        style={{
          color: colors.inkMuted,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {result.snippet}
      </Text>
      {badge ? (
        <View>
          <Text
            style={{
              color: colors.ink,
              fontSize: typeScale.ui.fontSize,
              lineHeight: typeScale.ui.lineHeight,
            }}
          >
            {badge === 'Not yet reviewed' ? copy.search.notYetReviewed : badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}
