import { Pressable, Text, View } from 'react-native';
import { copy } from '@/copy';
import { readerBarActions } from '@/reader/bar';
import { space, type as typeScale } from '@/theme/tokens';
import { useTheme } from '@/theme/ThemeProvider';

const labels = {
  previous: {
    title: copy.reader.previous,
    label: copy.reader.previousLabel,
  },
  ask: { title: copy.reader.ask, label: copy.reader.askLabel },
  note: { title: copy.reader.note, label: copy.reader.noteLabel },
  next: { title: copy.reader.next, label: copy.reader.nextLabel },
} as const;

type ReaderBarProps = {
  atStart: boolean;
  atEnd: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function ReaderBar({
  atStart,
  atEnd,
  onPrevious,
  onNext,
}: ReaderBarProps) {
  const { colors } = useTheme();
  const actions = readerBarActions({ atStart, atEnd });
  return (
    <View style={{ flexDirection: 'row' }}>
      {actions.map((action) => {
        const text = labels[action.id];
        const onPress =
          action.id === 'previous'
            ? onPrevious
            : action.id === 'next'
              ? onNext
              : undefined;
        return (
          <Pressable
            key={action.id}
            accessibilityRole="button"
            accessibilityLabel={text.label}
            accessibilityState={{ disabled: action.disabled }}
            disabled={action.disabled}
            onPress={onPress}
            style={{
              flex: 1,
              minHeight: space.target,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: space.unit,
              opacity: action.disabled ? 0.35 : 1,
            }}
          >
            <Text
              numberOfLines={1}
              style={{
                color: colors.ink,
                fontSize: typeScale.ui.fontSize,
                lineHeight: typeScale.ui.lineHeight,
              }}
            >
              {text.title}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
