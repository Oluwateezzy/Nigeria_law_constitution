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
  noteFilled?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onNote?: () => void;
};

export function ReaderBar({
  atStart,
  atEnd,
  noteFilled = false,
  onPrevious,
  onNext,
  onNote,
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
              : action.id === 'note'
                ? onNote
                : undefined;
        const label =
          action.id === 'note' && noteFilled
            ? copy.reader.noteSavedLabel
            : text.label;
        return (
          <Pressable
            key={action.id}
            accessibilityRole="button"
            accessibilityLabel={label}
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.unit,
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
              {action.id === 'note' && noteFilled ? (
                <View
                  accessibilityElementsHidden
                  importantForAccessibility="no-hide-descendants"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: colors.accent,
                  }}
                />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
