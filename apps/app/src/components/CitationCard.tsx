import { Pressable, Text, View } from 'react-native';
import { copy } from '@/copy';
import { radius, space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

type CitationCardProps = {
  shortTitle: string;
  number: string;
  heading: string;
  quote: string;
  onOpen: () => void;
};

export function CitationCard({
  shortTitle,
  number,
  heading,
  quote,
  onOpen,
}: CitationCardProps) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        marginTop: space.unit * 3,
        padding: space.unit * 3,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.field,
        backgroundColor: colors.bgRaised,
      }}
    >
      <Text
        style={{
          color: colors.inkMuted,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {shortTitle}
      </Text>
      <Text
        style={{
          marginTop: space.unit,
          color: colors.accent,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {number}
        {heading ? `. ${heading}` : ''}
      </Text>
      <Text
        style={{
          marginTop: space.unit * 2,
          color: colors.ink,
          fontSize: typeScale.ui.fontSize,
          lineHeight: typeScale.ui.lineHeight,
        }}
      >
        {quote}
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={copy.scenario.open}
        onPress={onOpen}
        style={{ minHeight: space.target, justifyContent: 'center' }}
      >
        <Text style={{ color: colors.accent }}>{copy.scenario.open}</Text>
      </Pressable>
    </View>
  );
}
