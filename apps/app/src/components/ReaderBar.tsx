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
  onAsk?: () => void;
  onNote?: () => void;
};

export function ReaderMoves({
  atStart,
  atEnd,
  onPrevious,
  onNext,
}: {
  atStart: boolean;
  atEnd: boolean;
  onPrevious: () => void;
  onNext: () => void;
}) {
  return (
    <View style={{ flexDirection: 'row' }}>
      <MoveControl id="previous" disabled={atStart} onPress={onPrevious} />
      <MoveControl id="next" disabled={atEnd} onPress={onNext} />
    </View>
  );
}

export function ReaderBar({
  atStart,
  atEnd,
  noteFilled = false,
  onPrevious,
  onNext,
  onAsk,
  onNote,
}: ReaderBarProps) {
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
                : action.id === 'ask'
                  ? onAsk
                  : undefined;
        const label =
          action.id === 'note' && noteFilled
            ? copy.reader.noteSavedLabel
            : text.label;
        return (
          <MoveControl
            key={action.id}
            id={action.id}
            label={label}
            disabled={action.disabled}
            noteFilled={action.id === 'note' && noteFilled}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

function MoveControl({
  id,
  label,
  disabled = false,
  noteFilled = false,
  onPress,
}: {
  id: keyof typeof labels;
  label?: string;
  disabled?: boolean;
  noteFilled?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const text = labels[id];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label ?? text.label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        flex: 1,
        minHeight: space.target,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: space.unit,
        opacity: disabled ? 0.35 : 1,
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
        {noteFilled ? (
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
}
